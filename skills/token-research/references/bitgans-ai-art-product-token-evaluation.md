# bitGAN AI-art product token evaluation pattern

Session pattern: Solana Pump/PumpSwap alert for `$bitGAN` / bitGAN (`4gnm8ChRH9VhcSiiU4UDMohkFEf98MCz44T71G5apump`) linked to `@thebitgans` and `bitgans.com/news/the-bytegans`.

## Signals that made it WATCH, not SKIP

- **Real older project footprint:** `bitgans.com` is an older Squarespace AI-art/NFT site with 2023 article content about byteGANs/bitGANs being inscribed on-chain, not a generic launch page created only for the token.
- **Exact CA authenticity signal:** `@thebitgans` profile bio included the exact token CA and linked the same bitgans.com article.
- **Source launch tweet had concrete mechanics:** fxtwitter status showed text claiming “first interactive generative adversarial networks inscribed on-chain,” Solana/Pump.fun launch, auto-generated wallet art for every 0.1% holding, and Tensor collection page in progress.
- **Known creator ecosystem clue:** bitgans.com pages/listing pointed to Pindar Van Arman / `@VanArman`, whose fxtwitter profile showed a real verified AI/robot artist account with ~40k followers. This increases product/narrative credibility even if token endorsement is unconfirmed.
- **Market/risk acceptable for WATCH:** migrated to PumpSwap, locked LP, RugCheck good; alert/current mcap was low (~$35k-$52k), LP thin (~$16k-$17k), but low mcap alone is not a skip.

## Why not APE/BUY

- TwitterAPI Latest/Top/CA/user checks returned `402 Payment Required`; `xurl` unavailable, so broader organic search proof was unavailable.
- `@thebitgans` was tiny (~73-81 followers, 7-8 tweets) despite being old.
- No direct `@VanArman` token/CA endorsement was verified via available fallbacks; treat creator-ecosystem link as credibility evidence, not endorsement.
- Tensor collection / auto-generation mechanics were “in progress” and not independently verified.
- Thin liquidity and low-LP-provider warning remain sizing/rug risks.

## Reusable workflow

1. For Pump/PumpSwap product-looking alerts, query both DexScreener pair and token endpoints to catch pre-migration pumpfun volume plus current PumpSwap LP/txns.
2. Query Pump.fun metadata (`frontend-api-v3.pump.fun/coins/CA`) for `twitter`, `website`, `creator`, `reply_count`, `ath_market_cap`, `usd_market_cap`.
3. If TwitterAPI is 402, use fxtwitter/vxtwitter for:
   - status URL text, metrics, media, author profile;
   - project profile bio/follower/tweet counts;
   - related founder/artist profile metadata.
4. Fetch/render the linked website when possible. If browser navigation hangs, fall back to `urllib`/curl with browser UA and parse title/meta/body text. For Squarespace/article sites, visible body text can be extracted with Python `HTMLParser` while skipping script/style.
5. Classify older real creative/project footprint + exact CA profile + concrete token/product mechanics as **WATCH** if social proof/team endorsement is not fully verified. Upgrade only if official founder/team endorsement or strong organic traction is confirmed.

## Suggested verdict template

`WATCH 🟡`: real/unique AI-art or NFT/product narrative with older web footprint and exact-CA project account, but tiny social base / blocked X search / no direct founder endorsement / unverified mechanics keep it below APE.
