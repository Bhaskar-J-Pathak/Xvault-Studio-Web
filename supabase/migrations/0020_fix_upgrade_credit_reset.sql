-- ============================================================
-- Migration 0020: Fix credit counters for users who upgraded mid-month
--
-- Bug: The webhook handler never reset ai_requests_this_month when
-- a user upgraded from free/trial to a paid plan. Any credits used
-- on the free/trial tier in the same calendar month were deducted
-- from the paid plan's allowance.
--
-- Fix (code): webhook now resets ai_requests_this_month = 0 on
-- payment.succeeded / subscription.active / subscription.plan_changed.
--
-- Fix (data): reset the monthly counter for all existing paid-plan
-- users so they receive their full allocation going forward.
-- Free-plan users are intentionally excluded — their 50 credits/month
-- limit is governed by the same counter and should not be refreshed.
-- ============================================================

UPDATE public.profiles
SET
  ai_requests_this_month = 0,
  requests_reset_at      = now()
WHERE
  plan IN ('hobbyist', 'founder_circle')
  AND ai_requests_this_month > 0;
