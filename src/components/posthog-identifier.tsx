"use client";

import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";

interface Props {
  userId: string;
  email: string;
  plan?: string;
}

/**
 * Identifies the logged-in user in PostHog so all events are linked to
 * their email and profile — not just an anonymous device ID.
 * Drop this into any authenticated server layout.
 */
export default function PostHogIdentifier({ userId, email, plan }: Props) {
  const ph = usePostHog();

  useEffect(() => {
    if (!ph || !userId) return;
    ph.identify(userId, { email, plan });
  }, [ph, userId, email, plan]);

  return null;
}
