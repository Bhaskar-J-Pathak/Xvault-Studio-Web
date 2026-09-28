import assert from "node:assert/strict";
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (process.env.AFFILIATE_INTEGRATION_CONFIRM !== "1") {
  throw new Error("Set AFFILIATE_INTEGRATION_CONFIRM=1 to run the cleanup-safe remote integration test.");
}

for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (!match || process.env[match[1]]) continue;
  let value = match[2].trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  process.env[match[1]] = value;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
assert(url && anonKey && serviceKey, "Supabase URL, anon key, and service key are required");

const service = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = `Affiliate-Test-${suffix}!`;
const createdUserIds = [];

async function deleteTestUser(userId) {
  const { error: orderError } = await service.from("orders").delete().eq("user_id", userId);
  if (orderError) throw orderError;
  const { error: userError } = await service.auth.admin.deleteUser(userId);
  if (userError) throw userError;
}

async function cleanupStaleTestUsers() {
  const { data, error } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  const stale = data.users.filter((user) => user.email?.startsWith("affiliate-test-"));
  for (const user of stale) await deleteTestUser(user.id);
  if (stale.length > 0) console.log(`CLEANUP removed ${stale.length} stale test users`);
}

await cleanupStaleTestUsers();

async function createTestUser(role, index = 0) {
  const email = `affiliate-test-${role}-${index}-${suffix}@example.com`;
  const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  createdUserIds.push(data.user.id);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data: profile } = await service.from("profiles").select("id,referral_code,topup_credits,referred_by").eq("id", data.user.id).maybeSingle();
    if (profile) return { user: data.user, profile, email };
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Profile trigger did not create ${role} profile`);
}

async function claimReferral(referredId, code, source) {
  const { data, error } = await service.rpc("claim_affiliate_referral", {
    p_referred_id: referredId,
    p_code: code,
    p_source: source,
  });
  if (error) throw error;
  return data;
}

async function createAndActivateOrder(userId, plan, amountCents, index, purchasedAt) {
  const { data: order, error: orderError } = await service.from("orders").insert({
    user_id: userId,
    product_id: `affiliate-test-${plan}`,
    plan_purchased: plan,
    amount_cents: amountCents,
    currency: "USD",
    status: "pending",
  }).select("id").single();
  if (orderError) throw orderError;

  const { data, error } = await service.rpc("activate_paid_order", {
    p_order_id: order.id,
    p_user_id: userId,
    p_payment_id: `pay_affiliate_test_${suffix}_${index}`,
    p_subscription_id: plan === "hobbyist" ? `sub_affiliate_test_${suffix}_${index}` : null,
    p_purchased_at: purchasedAt,
  });
  if (error) throw error;
  return data;
}

async function summaryFor(email) {
  const client = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  const { data, error } = await client.rpc("get_my_affiliate_summary");
  if (error) throw error;
  return data;
}

try {
  const referrer = await createTestUser("referrer");
  const hobbyist = await createTestUser("hobbyist");
  const maturedFounders = await Promise.all([0, 1, 2].map((index) => createTestUser("founder", index)));
  const pendingFounder = await createTestUser("pending-founder");

  const selfClaim = await claimReferral(referrer.user.id, referrer.profile.referral_code, "integration_self_test");
  assert.equal(selfClaim.ok, false);
  assert.equal(selfClaim.reason, "self_referral");

  for (const candidate of [hobbyist, ...maturedFounders, pendingFounder]) {
    const claim = await claimReferral(candidate.user.id, referrer.profile.referral_code, "integration_test");
    assert.equal(claim.ok, true);
    assert.equal(claim.linked, true);
  }

  const immutableClaim = await claimReferral(maturedFounders[0].user.id, hobbyist.profile.referral_code, "integration_reassign_test");
  assert.equal(immutableClaim.reason, "already_attributed");
  const { data: stillAttributed } = await service.from("profiles").select("referred_by").eq("id", maturedFounders[0].user.id).single();
  assert.equal(stillAttributed.referred_by, referrer.user.id);

  const maturedAt = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  const hobbyActivation = await createAndActivateOrder(hobbyist.user.id, "hobbyist", 1199, "hobby", maturedAt);
  assert.equal(hobbyActivation.affiliate_commission_cents, 0);
  const { count: hobbyCommissionCount, error: hobbyCountError } = await service
    .from("affiliate_commissions").select("id", { count: "exact", head: true }).eq("referred_id", hobbyist.user.id);
  if (hobbyCountError) throw hobbyCountError;
  assert.equal(hobbyCommissionCount, 0);

  for (let index = 0; index < maturedFounders.length; index += 1) {
    const activation = await createAndActivateOrder(maturedFounders[index].user.id, "founder_circle", 5900, index, maturedAt);
    assert.equal(activation.affiliate_commission_cents, 2360);
  }
  const pendingActivation = await createAndActivateOrder(pendingFounder.user.id, "founder_circle", 5900, "pending", now);
  assert.equal(pendingActivation.affiliate_commission_cents, 2360);

  let summary = await summaryFor(referrer.email);
  assert.equal(summary.available_cents, 7080);
  assert.equal(summary.pending_cents, 2360);
  assert.equal(summary.lifetime_earned_cents, 9440);

  const { data: withdrawal, error: withdrawalError } = await service.rpc("request_affiliate_withdrawal", {
    p_user_id: referrer.user.id,
    p_payout_email: referrer.email,
  });
  if (withdrawalError) throw withdrawalError;
  assert.equal(withdrawal.ok, true);
  assert.equal(withdrawal.amount_cents, 7080);

  summary = await summaryFor(referrer.email);
  assert.equal(summary.available_cents, 0);
  assert.equal(summary.payout_pending_cents, 7080);

  const { data: rejected, error: rejectError } = await service.rpc("resolve_affiliate_withdrawal", {
    p_withdrawal_id: withdrawal.withdrawal_id,
    p_status: "rejected",
    p_admin_note: "Automated integration test",
  });
  if (rejectError) throw rejectError;
  assert.equal(rejected.ok, true);

  const { data: conversion, error: conversionError } = await service.rpc("convert_affiliate_commission_to_credits", {
    p_user_id: referrer.user.id,
    p_pack_key: "credits_400",
  });
  if (conversionError) throw conversionError;
  assert.equal(conversion.ok, true);
  assert.equal(conversion.amount_cents, 1500);
  assert.equal(conversion.credits_added, 400);

  summary = await summaryFor(referrer.email);
  assert.equal(summary.available_cents, 5580);
  assert.equal(summary.converted_cents, 1500);
  assert.equal(summary.converted_credits, 400);

  const { data: referrerAfter, error: profileError } = await service
    .from("profiles").select("topup_credits,referral_count").eq("id", referrer.user.id).single();
  if (profileError) throw profileError;
  assert.equal(referrerAfter.topup_credits, 400);
  assert.equal(referrerAfter.referral_count, 4);

  console.log("PASS self-referral blocked");
  console.log("PASS first-touch attribution is immutable");
  console.log("PASS Hobbyist purchase earns $0 commission");
  console.log("PASS each $59 Founder purchase earns $23.60 (40%)");
  console.log("PASS 30-day pending and available balances are separated");
  console.log("PASS $50 withdrawal reserves cleared balance and rejection restores it");
  console.log("PASS direct $15 earnings conversion adds 400 credits without checkout");
  console.log("PASS remaining cleared balance is $55.80");
} finally {
  for (const userId of createdUserIds.reverse()) {
    try {
      await deleteTestUser(userId);
    } catch (error) {
      console.error("Cleanup failed for test user", userId, error);
    }
  }
}
