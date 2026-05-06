# Roman AI founder/product token pattern

Session: 2026-05-05, `$ROMAN` on Solana (`Hxx5bFcqjHDx1Ke3xumUjWr8SvjXKHtP6kcYyhoXpump`).

## Pattern

A very low-cap product-token launch can justify APE/BUY escalation when all of these are true:

1. **Founder/source account explicitly posts the exact CA** — not a community claim. For `$ROMAN`, fxtwitter recovered @everestchris6's launch tweet: “I decided to tokenize the $ROMAN agent on Pumpfun” plus the exact CA.
2. **Founder/account quality is meaningful** — older account, real follower base, verified/Premium, plausible product/company link. For `$ROMAN`, Chris was verified, joined 2016, ~18.6k followers, and linked a founder/product footprint.
3. **Product is independently live, not just metadata** — verify website, app/login, OAuth/install links, docs/bundle copy, or real interaction surface. For `$ROMAN`, `getroman.ai` rendered a polished Slack-native AI coworker site, `app.getroman.ai/login` existed, and the Slack OAuth URL returned a real Slack authorization page.
4. **Token safety is acceptable for the context** — migrated/completed Pump.fun/PumpSwap, locked LP, null mint/freeze authority, no major RugCheck warnings beyond low LP providers.
5. **Entry is early enough to matter** — tiny mcap can be a feature when the product/founder proof is strong.

## Verification techniques used

- When TwitterAPI returns `402 Payment Required`, use `https://api.fxtwitter.com/status/TWEET_ID` and `https://api.vxtwitter.com/HANDLE/status/TWEET_ID` to recover tweet text, author stats, media, views/likes/RTs/replies.
- Query Pump.fun metadata (`https://frontend-api-v3.pump.fun/coins/CA`) to confirm the launch account/social links and product description.
- Query both DexScreener pair endpoint and token endpoint. Token endpoint can expose a prior Pump.fun pair and migrated PumpSwap pair; report main-pair metrics plus aggregate/visible pair context.
- For product proof, do not stop at HTML metadata. Fetch Vite/React bundles and grep for product copy, integrations, OAuth URLs, app links, pricing, and API/app domains.
- Probe app and OAuth URLs directly with short timeouts. A real `app.getroman.ai/login` and live Slack OAuth page are stronger evidence than a landing page alone.

## Scoring guidance

This is stronger than “official-looking tiny product account” because the founder/source tweet included the exact CA and the product had live install/login surfaces. If social traction is still small and broader X search is blocked, keep risks explicit, but founder-confirmed real product at microcap can be APE rather than WATCH.

## Risks to still report

- TwitterAPI Latest/Top unavailable means broader organic proof is unknown.
- Launch tweet may still have low early engagement.
- Low liquidity and low LP-provider warning remain sizing risks.
- Product category can be crowded; verify traction/users before larger sizing.
