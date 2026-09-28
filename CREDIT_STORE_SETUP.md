# Credit store: live Dodo transition

The in-app store sells one-time, non-expiring usage credits. Packs do not
change a user's plan or unlock subscription features.

## Live catalog

Create these as **one-time USD products in Dodo live mode**:

| Live environment variable | Price | Credits |
|---|---:|---:|
| `DODO_PRODUCT_CREDITS_100_LIVE` | $5 | 100 |
| `DODO_PRODUCT_CREDITS_200_LIVE` | $10 | 200 |
| `DODO_PRODUCT_CREDITS_400_LIVE` | $15 | 400 |
| `DODO_PRODUCT_CREDITS_600_LIVE` | $20 | 600 |
| `DODO_PRODUCT_CREDITS_1750_LIVE` | $50 | 1,750 |
| `DODO_PRODUCT_CREDITS_4000_LIVE` | $100 | 4,000 |

The checkout route retrieves each Dodo product before creating an order and
requires the product to be one-time, USD, and exactly the price listed above.
A mismatched product fails closed with a 503 and cannot take payment.

Local test mode remains backward compatible with the existing unsuffixed
`DODO_PRODUCT_CREDITS_*` variables. New test setups may use
`DODO_PRODUCT_CREDITS_*_TEST`. Live mode never falls back to either test
name.

## Required production environment

Set all of these in the production deployment environment:

```text
DODO_PAYMENTS_ENVIRONMENT=live_mode
DODO_API_KEY_LIVE=...
DODO_PAYMENTS_WEBHOOK_SECRET_LIVE=...
DODO_PRODUCT_CREDITS_100_LIVE=...
DODO_PRODUCT_CREDITS_200_LIVE=...
DODO_PRODUCT_CREDITS_400_LIVE=...
DODO_PRODUCT_CREDITS_600_LIVE=...
DODO_PRODUCT_CREDITS_1750_LIVE=...
DODO_PRODUCT_CREDITS_4000_LIVE=...
NEXT_PUBLIC_APP_URL=https://<canonical-production-domain>
```

Because subscriptions and the credit store share the Dodo client, also verify
that `NEXT_PUBLIC_DODO_LINK_HOBBYIST` and
`NEXT_PUBLIC_DODO_LINK_LIFETIME` are live product IDs. The Founder product
must be a one-time product priced at exactly $59 before this deployment.

Do not copy the test API key, test product IDs, or test webhook secret into any
of the live variables. Do not commit any secret or product ID to the repository.

## Database prerequisite

Apply migrations `0031_credit_topup_store.sql` and
`0032_credit_store_refunds.sql` to the production Supabase project before the
store route is exposed. Verify the migration history rather than assuming a
local/test migration also reached production.

Included trial/monthly credits are consumed first. Top-up credits are used only
for the remainder and survive billing-cycle resets. A full refund removes
unused top-up credits; already-spent refunded credits become debt that future
top-ups repay before adding spendable balance.

## Live webhook

Create a **live-mode** Dodo webhook for:

```text
https://<canonical-production-domain>/api/webhooks/dodo
```

At minimum, enable these events for the credit store:

- `payment.succeeded`
- `payment.failed`
- `refund.succeeded`

The same endpoint also handles the existing subscription and affiliate-risk
events, so retain their current subscriptions when replacing or editing the
endpoint:

- `subscription.active`
- `subscription.plan_changed`
- `subscription.renewed`
- `subscription.updated`
- `subscription.cancelled`
- `subscription.expired`
- `dispute.opened`
- `dispute.won`
- `dispute.lost`

Copy that live endpoint's signing secret to
`DODO_PAYMENTS_WEBHOOK_SECRET_LIVE`. The handler verifies Standard Webhooks
signatures and deduplicates deliveries by webhook ID.

## Safe rollout order

1. Confirm the production Supabase migrations.
2. Create the six live one-time Dodo products.
3. Create or identify the live Dodo API key.
4. Create the live HTTPS webhook and select the events above.
5. Add all production environment variables, including the live subscription
   product IDs and canonical app URL.
6. Run the read-only catalog check in an environment containing the production
   variables:

   ```bash
   node scripts/verify-dodo-live-config.mjs
   ```

7. Deploy the hardened code.
8. Send Dodo dashboard test events and confirm 2xx delivery in the deployment
   logs.
9. While signed in as a normal user, complete one real $5 purchase. Confirm
   exactly 100 top-up credits, one paid `credit_orders` row, and one processed
   `webhook_events` row.
10. Refund that purchase in Dodo. Confirm the order becomes `refunded` and
    unused top-up credits are removed exactly once.

Do not expose the store navigation to all users until steps 1-8 pass. The final
real payment and refund are deliberate financial actions and should be
performed only after explicit approval.
