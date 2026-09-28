import DodoPayments from "dodopayments";

const packs = [
  { env: "DODO_PRODUCT_CREDITS_100_LIVE", name: "100 credits", cents: 500 },
  { env: "DODO_PRODUCT_CREDITS_200_LIVE", name: "200 credits", cents: 1000 },
  { env: "DODO_PRODUCT_CREDITS_400_LIVE", name: "400 credits", cents: 1500 },
  { env: "DODO_PRODUCT_CREDITS_600_LIVE", name: "600 credits", cents: 2000 },
  { env: "DODO_PRODUCT_CREDITS_1750_LIVE", name: "1,750 credits", cents: 5000 },
  { env: "DODO_PRODUCT_CREDITS_4000_LIVE", name: "4,000 credits", cents: 10000 },
];

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

if (requireEnv("DODO_PAYMENTS_ENVIRONMENT") !== "live_mode") {
  throw new Error("DODO_PAYMENTS_ENVIRONMENT must equal live_mode");
}

const appUrl = new URL(requireEnv("NEXT_PUBLIC_APP_URL"));
if (appUrl.protocol !== "https:") {
  throw new Error("NEXT_PUBLIC_APP_URL must use HTTPS");
}

requireEnv("DODO_PAYMENTS_WEBHOOK_SECRET_LIVE");

const dodo = new DodoPayments({
  bearerToken: requireEnv("DODO_API_KEY_LIVE"),
  environment: "live_mode",
});

let failures = 0;
for (const pack of packs) {
  try {
    const product = await dodo.products.retrieve(requireEnv(pack.env));
    const price = product.price;
    const valid =
      price.type === "one_time_price" &&
      "price" in price &&
      price.currency === "USD" &&
      price.price === pack.cents;

    if (!valid) {
      failures += 1;
      console.error(`FAIL ${pack.name}: expected one-time USD ${pack.cents} cents`);
      continue;
    }
    console.log(`PASS ${pack.name}: $${(pack.cents / 100).toFixed(2)}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${pack.name}:`, error instanceof Error ? error.message : error);
  }
}

if (failures > 0) {
  throw new Error(`${failures} live Dodo product check(s) failed`);
}

console.log(`PASS return URL: ${appUrl.origin}`);
console.log("PASS live Dodo credit catalog");
