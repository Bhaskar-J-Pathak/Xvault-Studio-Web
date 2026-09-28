export const CREDIT_PACKS = [
  { id: "credits_100", credits: 100, amountCents: 500, label: "Quick top-up", productEnv: "DODO_PRODUCT_CREDITS_100", featured: false },
  { id: "credits_200", credits: 200, amountCents: 1000, label: "Standard", productEnv: "DODO_PRODUCT_CREDITS_200", featured: false },
  { id: "credits_400", credits: 400, amountCents: 1500, label: "Popular", productEnv: "DODO_PRODUCT_CREDITS_400", featured: false },
  { id: "credits_600", credits: 600, amountCents: 2000, label: "Writer pack", productEnv: "DODO_PRODUCT_CREDITS_600", featured: false },
  { id: "credits_1750", credits: 1750, amountCents: 5000, label: "Deep revision", productEnv: "DODO_PRODUCT_CREDITS_1750", featured: false },
  { id: "credits_4000", credits: 4000, amountCents: 10000, label: "Power user", productEnv: "DODO_PRODUCT_CREDITS_4000", featured: true },
] as const;

export type CreditPackId = (typeof CREDIT_PACKS)[number]["id"];

export function getCreditPack(id: string) {
  return CREDIT_PACKS.find((pack) => pack.id === id);
}
