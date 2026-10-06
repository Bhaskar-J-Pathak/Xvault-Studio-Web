import * as React from "react";

import WelcomeEmail from "./welcome";

interface ReferredWelcomeEmailProps {
  name?: string;
  dashboardUrl?: string;
}

export default function ReferredWelcomeEmail({
  name,
  dashboardUrl = "https://xvault.dev/dashboard",
}: ReferredWelcomeEmailProps) {
  return (
    <WelcomeEmail
      name={name}
      dashboardUrl={dashboardUrl}
      referralBonusCredits={30}
    />
  );
}
