const facts = [
  {
    label: "Full writing studio",
    detail: "Import, map, write, revise, and export",
  },
  {
    label: "14 days free",
    detail: "Start without a credit card",
  },
  {
    label: "100 AI credits",
    detail: "Included with every new account",
  },
  {
    label: "Google Cloud",
    detail: "Supported by Google Cloud for Startups",
  },
] as const;

export default function CredibilityBand() {
  return (
    <section aria-label="Xvault at a glance" className="bg-[#F4F0E8] px-6 text-[#191714] lg:px-10">
      <div className="mx-auto max-w-[1280px] border-b border-[#191714]/15">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((fact, index) => (
            <div
              key={fact.label}
              className={`py-8 sm:px-7 lg:min-h-[142px] lg:px-8 lg:py-9 ${
                index > 0 ? "border-t border-[#191714]/15 sm:border-t-0" : ""
              } ${index % 2 === 1 ? "sm:border-l sm:border-[#191714]/15" : ""} ${
                index > 1 ? "sm:border-t sm:border-[#191714]/15 lg:border-t-0" : ""
              } ${index > 0 ? "lg:border-l lg:border-[#191714]/15" : ""}`}
            >
              <p className="font-display text-[1.65rem] leading-tight tracking-[-0.025em]">{fact.label}</p>
              <p className="mt-2 max-w-[220px] text-xs leading-5 text-[#191714]/64">{fact.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
