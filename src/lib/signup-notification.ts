import { createServiceClient } from "@/lib/auth";
import { sendNewSignupNotification, sendWelcomeEmail } from "@/lib/email";

type SignupIdentity = {
  id: string;
  email: string;
  name?: string | null;
  createdAt?: string | null;
  provider?: string | null;
};

async function releaseClaim(
  column: "welcome_email_sent" | "signup_notification_sent",
  id: string,
): Promise<void> {
  const service = createServiceClient();
  const { error } = await service
    .from("profiles")
    .update({ [column]: false })
    .eq("id", id)
    .eq(column, true);

  if (error) {
    console.error(`[signup-notification] Failed to release ${column} claim:`, error.message);
  }
}

export async function sendWelcomeEmailOnce({
  id,
  email,
  name,
}: Pick<SignupIdentity, "id" | "email" | "name">): Promise<boolean> {
  const service = createServiceClient();
  const { data: claimed, error: claimError } = await service
    .from("profiles")
    .update({ welcome_email_sent: true })
    .eq("id", id)
    .eq("welcome_email_sent", false)
    .select("id");

  if (claimError) {
    throw new Error(`Could not claim welcome email: ${claimError.message}`);
  }

  if (!claimed?.length) return false;

  try {
    await sendWelcomeEmail(email, name || undefined, `welcome-${id}`);
    return true;
  } catch (error) {
    await releaseClaim("welcome_email_sent", id);
    throw error;
  }
}

/**
 * Claims and sends the founder alert for a newly created account.
 *
 * This is safe to call from both the auth callback and dashboard fallback.
 * A failed delivery releases the claim so a later visit can retry.
 */
export async function sendSignupNotificationOnce({
  id,
  email,
  createdAt,
  provider,
}: SignupIdentity): Promise<boolean> {
  const service = createServiceClient();
  const { data: claimed, error: claimError } = await service
    .from("profiles")
    .update({ signup_notification_sent: true })
    .eq("id", id)
    .eq("signup_notification_sent", false)
    .select("id");

  if (claimError) {
    throw new Error(`Could not claim signup notification: ${claimError.message}`);
  }

  if (!claimed?.length) return false;

  try {
    await sendNewSignupNotification({
      email,
      userId: id,
      provider,
      createdAt,
    });
    return true;
  } catch (error) {
    await releaseClaim("signup_notification_sent", id);
    throw error;
  }
}
