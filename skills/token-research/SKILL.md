---
name: token-research
description: Comprehensive token research for EVM chains (Base, ETH, Arbitrum) and Solana. Use this skill when you want to research crypto tokens, deep-dive projects or monitor tokens.
---

This skill is a comprehensive token research for EVM chains (Base, ETH, Arbitrum) and Solana. Two modes: **deep_research** and **shallow_dive**.

## MANDATORY: Owner alert escalation

**Verdict actions:**

- **SKIP / AVOID** → do not interrupt owner; optionally log internally.
- **WATCH 🟡** → send owner a private Telegram DM with concise analysis and append to the monthly watchlist. **Do not phone-call by default.**
- **APE 🟢 / BUY 🟢** → urgent: send owner a private Telegram DM, append to watchlist, and immediately call owner. NO EXCEPTIONS.

For APE/BUY calls:

1. Prefer AgentOS/agents-infra voice calling when configured: `agentos phone call --id ID --to +... --tts "APE alert: $TICKER at $MCAPk mcap, $VOLk volume. [1-line reason]"`
2. If AgentOS is installed but not configured, quickly inspect for usable phone IDs/owner number before giving up: `agentos phone --help`, `~/.agentos/config.json`, `~/.agentos/logs/`, and any known local alert scripts. AgentOS v0.7.9 may throw an Ink `Raw mode is not supported` error in non-interactive terminals; do not loop on that failure.
3. If the legacy helper exists, fallback: `~/workspace/scripts/ape-call.sh "APE alert: $TICKER at $MCAPk mcap, $VOLk volume. [1-line reason]"`
4. Send Telegram DM to your owner with full analysis.
5. If no actual phone-call route is discoverable, send an urgent Telegram voice alert as last-resort escalation: generate TTS with the APE/BUY reason and send it as `[[audio_as_voice]]` media. State in the final that phone calling was attempted/unavailable and voice-Telegram fallback was sent.

**DO NOT:** say "if owner were awake", hesitate because it is late, or process APE/BUY alerts without attempting escalation.

## MANDATORY: ALWAYS RESEARCH ON X/TWITTER — SKIP PURE MEMES

**For EVERY token, before giving a verdict, check X/Twitter:**
1. Search `$TICKER` and project name (Latest + Top)
2. Check the project's Twitter account: tweets, bio, what they're building
3. Look for a PRODUCT (website, GitHub, app, protocol)

**If the product is real, CALL your owner regardless of chart action.** Bad charts on real products = buying opportunity, not a skip.

**Pure memes = AVOID by default.** Be strict: do not label every high-volume meme as WATCH. A pure meme should only become WATCH when it has unusually strong organic traction (not mostly caller/bot posts), clear source virality, and sustained volume/liquidity; otherwise SKIP/AVOID. APE/BUY should be reserved for real products/builders or exceptional meme breakouts with overwhelming organic adoption.

### Z-specific scoring corrections / pitfalls

- **Bundle risk is a first-class filter.** Before WATCH/APE, check launch quality: bundled buys, suspicious connected early wallets, dev/top-holder concentration, sniper control, weak/real liquidity, and whether early buy flow looks organic. High bundle/manipulation risk usually means SKIP even when chart/volume looks good.
- **Generic cult/name memes are SKIP.** A token whose thesis is only “cult,” name aesthetics, an X Community, a meme site, or an NFT-generator-style page is not WATCH. Example pattern: `$soldier` / `soldiercult.com` → SKIP unless there is a genuinely interesting product, viral source moment, or unusual organic traction behind it.
- **Do not auto-reject X Community links, but research why they exist.** X Communities can be bullish when they formed around a real viral moment and active holders are waiting for a dev/project claim. Check community activity/source virality/volume before deciding. Community-only + generic meme/cult = SKIP.
- **Low mcap is not a reason to skip.** Research every token in a batch, including tiny caps; early low-cap entries can be the best opportunities.
- **Product presence alone is not enough.** Generic AI-wrapper slop, low-effort/vibecoded apps, poor UX/branding, boring products, or undifferentiated “we have a site/app” launches are SKIP even if technically a product exists. Example pattern: `$FATCATS`-style low-quality/vibecoded product → SKIP, not WATCH/APE.
- **For product-token launches, token utility/users/traction are not hard filters.** If the product is genuinely cool, novel, polished, or degen-shareable, it can be WATCH/APE even before users and even if token utility is weak/pointless. Score product quality/novelty/wow factor first; then use social/holders/chart as sizing/risk inputs.
- **When evaluating product quality, actually open/render the app when possible.** HTML metadata is not enough. Use a browser or headless screenshot + vision analysis to distinguish real interactive product (e.g. playable-looking game UI, wallet flows, token-gated mechanics) from generic landing/vibecoded slop.

## Reports & Watchlist

**Integration reference:** see `references/onchain-alerts-hermes-integration.md` for wiring onchain scanner alerts into Hermes with SKIP/WATCH/APE/BUY action routing.

**Reports:** `reports/YYYY-MM-DD/[report-name].md`
**Watchlist:** `watchlists/YYYY-MM/watchlist.md`

### User-facing result discipline
- If the user asked for token research, deliver the verdict in chat after the research is complete. Appending to a watchlist is not enough.
- Give the action label first (`SKIP`, `WATCH`, `APE`, `BUY`), then the core metrics, catalyst, social proof, and risks.
- If another setup/debug task is also active, do not let it bury the research answer; send the token verdict before continuing infrastructure work.

### Watchlist Rules
- After any research, if token has real product/team or unique narrative → append to watchlist
- Tiers: **Tier 1** (strongest), **Tier 2** (good signal, higher risk), **Tier 3** (speculative)
- Each entry: token, chain, CA, entry MC, current MC, catalyst, status (🟢🟡🔴)
- APPEND only — never overwrite. Update status when new data comes in.
- Before writing a watchlist entry, read the exact monthly file path (`watchlists/YYYY-MM/watchlist.md`) if it exists. Do not rely only on `search_files`/glob discovery: if the file is missing, create the directory/file only after checking the exact path; if a sibling-write warning appears, immediately read the file and re-append without clobbering.
- When appending/patching watchlists from `read_file` output, remember the tool displays line-number prefixes (e.g. `34|`) that are **not file content**. Do not copy those prefixes into `old_string`/`new_string`; patch only the raw markdown table row, then re-read the tail to verify no line-number artifacts were inserted.
- When a token is based on a viral meme/narrative, scan the existing monthly watchlist for sibling/competing CAs on the same meme (e.g. another ticker/name already listed). Competing CAs reduce conviction and should be included in the risk notes; usually this keeps a pure meme at WATCH instead of APE/BUY unless one CA has overwhelming organic adoption.
- If the monthly watchlist file does not exist, create it at `watchlists/YYYY-MM/watchlist.md` with a simple markdown table, then append the WATCH/APE/BUY entry.
- For WATCH DMs, include: verdict, token, chain, contract, DexScreener URL, key metrics, X/community findings, risks, and why watchlist-worthy. Explicitly do **not** call for WATCH.

## Prerequisites

```bash
source ~/.openclaw/secrets/twitterapi.env
```

## APIs

| API | Base URL | Auth | Use |
|-----|----------|------|-----|
| DexScreener | `https://api.dexscreener.com` | None | Price, liquidity, volume, pairs |
| GoPlus | `https://api.gopluslabs.io` | None | Security audit, honeypot, ownership |
| Basescan | `https://api.basescan.org/api` | Optional | Holders, contract info |
| Etherscan | `https://api.etherscan.org/api` | Optional | Holders, contract info |
| TwitterAPI | `https://api.twitterapi.io` | `$TWITTERAPI_KEY` | Social research, sentiment |

**Chain IDs:** Ethereum: `1` — Base: `8453` — BSC: `56` — Solana: `solana`

### API/tooling pitfalls

- **DexScreener may return 403 from bare Python urllib.** If `curl`/terminal hangs or an unauthenticated request gets `403 Forbidden`, retry with a browser-like `User-Agent` and `Accept: application/json` headers before giving up:
  ```python
  urllib.request.Request(url, headers={"User-Agent":"Mozilla/5.0", "Accept":"application/json"})
  ```
- **Prefer DexScreener pair endpoint when token endpoint fails.** For scanner alerts that include a pair ID, `GET /latest/dex/pairs/{chain}/{pair}` often works even when `GET /latest/dex/tokens/{token}` blocks. Use the pair endpoint to recover live MC/liquidity/txns without stalling.
- **For real product launches, also query the token endpoint and aggregate meaningful pools.** Scanner alerts can point to one small pair while the same token has a larger USDC/SOL pool. Use `/latest/dex/tokens/{token}` to find all pairs, prioritize pools with real liquidity (e.g. >$100 or context-appropriate), and report both the alert pair and aggregate major-pool liquidity/volume/txns.
- **TwitterAPI payloads can be large.** Do not truncate API responses before `json.loads`; read the full body, parse JSON, then summarize only the needed tweet fields. Truncating around 12k chars can cause `JSONDecodeError: Unterminated string`.
- **TwitterAPI env in Python needs export.** `source ~/.openclaw/secrets/twitterapi.env` is enough for shell `curl` expansion, but a Python child process may not see `TWITTERAPI_KEY` unless you use `set -a; source ~/.openclaw/secrets/twitterapi.env; set +a`, pass the variable explicitly, or parse the env file.
- **Single tweet lookup endpoint quirk.** If `GET /twitter/tweet/info?tweetId=...` returns 404, use `GET /twitter/tweets?tweet_ids=TWEET_ID`; it can return the full source tweet, quoted tweet, media URL, and metrics needed to distinguish viral-source memes from token endorsements.
- **TwitterAPI can fail with `402 Payment Required`.** Do not stop the research or skip X entirely. First try any configured official X tooling (`xurl auth status`, then `xurl user/search` if installed/authenticated). If unavailable, fetch the public `https://x.com/PROJECT_HANDLE` profile HTML with a browser-like User-Agent and parse `window.__INITIAL_STATE__` snippets for account bio, follower count, post count, created date, pinned tweet id, website/social links, Premium/verified flags. If X HTML is generic/JS-only, try profile metadata mirrors before giving up: `https://api.fxtwitter.com/HANDLE` and `https://api.vxtwitter.com/HANDLE` often return account existence, bio, followers, tweet count, verification, website, avatar/banner, and joined date without TwitterAPI credits. Treat these mirrors as profile evidence only, not full Latest/Top search evidence. For CA-specific alerts, a verified/profile bio containing the exact CA plus a matching website is meaningful project-account confirmation even if search endpoints are blocked; still label Latest/Top search as unavailable.
- **Pump.fun metadata can reveal the launch/source tweet when Dex only shows an X Community.** For Solana Pump/PumpSwap tokens, query `https://frontend-api-v3.pump.fun/coins/CA`; inspect `twitter`, `creator`, `reply_count`, `ath_market_cap`, and `usd_market_cap`. If `twitter` points to a status, fetch it via `https://api.fxtwitter.com/status/TWEET_ID` or `https://api.vxtwitter.com/<handle>/status/TWEET_ID` to recover tweet text, author age/followers, quoted viral source, views/likes, and media without spending TwitterAPI credits. This is especially useful when TwitterAPI is 402 and the DexScreener social is only `x.com/i/communities/...`.
- **When X remains blocked and the token only has an X Community, do not over-escalate on chart action alone.** If TwitterAPI returns 402, `xurl` is unavailable, X community/profile HTML is JS-only, and Pump metadata has no source tweet or replies, label Latest/Top/community activity as unavailable. Use DexScreener token+pair data, Pump.fun metadata, RugCheck, and any web links (e.g. IG/TG/site) to decide. A pure meme with fast early flow can be WATCH, but keep it out of APE/BUY unless there is verified product/team/source virality or overwhelming organic adoption.
- **Instagram/social web links are weak evidence when login-gated.** If a Dex/Pump website is an Instagram profile that redirects to login or cannot expose follower/post data, report it as an unverified external link, not product/team confirmation.
- **Unauthenticated X search pages are usually not useful.** `https://x.com/search?...` may return generic bootstrapping HTML with no query/tweet data, so don't rely on it for Latest/Top search evidence. Use TwitterAPI/xurl for tweet search, or explicitly state search was blocked and rely on profile/product/web evidence. For CA-specific token alerts, a verified/profile bio that includes the exact CA + matching website is meaningful project-account confirmation even when tweet search is blocked.
- **If shell curl commands hang/time out, switch transport rather than looping.** Use a short-timeout Python `urllib.request` probe or another client and continue the research.
- **When TwitterAPI is 402-blocked, official Telegram can be decisive CA confirmation for real projects.** For tokens with an established project account/site but no CA visible in X bio/pinned tweet, inspect public Telegram mirrors from Dex/Linktree/socials (`https://t.me/s/CHANNEL` and `?before=ID`). Search the HTML for the exact CA and official trade links such as `jup.ag/tokens/CA`. A verified/older X + matching Linktree/website + official Telegram post linking the exact CA is meaningful project-token confirmation; report that X Latest/Top was unavailable and specify Telegram as the CA proof.
- **X profile HTML can expose profile JSON and pinned tweet IDs without TwitterAPI credits.** Fetch `https://x.com/HANDLE` with a browser-like UA, search embedded JSON for `description`, `followers_count`, `is_blue_verified`, and `pinned_tweet_ids_str`, then fetch the pinned status through `https://api.fxtwitter.com/status/TWEET_ID` for text/metrics/media. This is useful when mirrors provide only profile data and TwitterAPI returns 402.
- **Jina Reader can recover X/fxtwitter/community evidence when direct requests hang.** If TwitterAPI is 402 and direct `curl`/`urllib` to X, fxtwitter, or vxtwitter times out, try `https://r.jina.ai/http://r.jina.ai/http://https://x.com/HANDLE`, `/status/TWEET_ID`, or `/i/communities/COMMUNITY_ID`, and also `https://r.jina.ai/http://r.jina.ai/http://https://api.fxtwitter.com/status/TWEET_ID`. Jina-rendered X Community pages can expose the community title, member count, exact CA in the description, recent posts, and quoted source tweets. Treat this as fallback evidence, not a substitute for full Latest/Top search.
- **React/Vite landing pages can hide the real product evidence in bundled JS.** If a project website only returns an HTML shell (`<div id="root">`) but metadata suggests a product, fetch the referenced `/assets/*.js` bundle and grep/extract string literals for API base URLs, roadmap text, contract/reserve claims, devnet/mainnet links, GitHub links, and product copy. This can distinguish a real/unique product narrative from a generic landing page when browser rendering or backend APIs hang.
- **Official-looking tiny product accounts are usually WATCH, not APE, without social/team verification.** A Premium/verified X profile with exact CA + matching site is meaningful authenticity evidence when TwitterAPI search is 402-blocked, but if the account is brand-new/tiny and no founder/GitHub/team proof is found, keep the verdict at WATCH unless the product is clearly exceptional and independently verifiable. See `references/biohash-product-token-evaluation.md` for the BioHash pattern.

### Viral-source meme evaluation

- **Do not treat a high-follower source tweet as project endorsement.** For memes spawned by public figures, government accounts, KOLs, or news moments, verify whether the source account posted the token/CA or merely used a word/image that became the meme. If no CA/token mention exists, label it as *viral narrative only*, not team/dev confirmation.
- **Check ticker collisions.** Generic tickers like `$CARDS` can belong to established projects and pollute Top search results. Separate CA-specific/latest tweets from legacy ticker discourse before scoring social proof.
- **Pure meme can still be WATCH when volume is exceptional.** If there is no product/team but the source moment is verifiably viral and early volume/liquidity are unusually high, classify WATCH rather than SKIP; reserve APE/BUY for real product/team confirmation or extreme conviction.
- Case reference: `references/viral-source-meme-evaluation.md` captures the CARDS/Iran-consulate pattern and how to score it.
- Case reference: `references/kospi6900-viral-source-pattern.md` captures the KOSPI6900/Jukan pattern: viral finance meme + exceptional early volume, but no CA endorsement and multiple competing CAs → WATCH, not APE/BUY.
- Case reference: `references/bitgans-ai-art-product-token-evaluation.md` captures the bitGAN pattern: older real AI-art/NFT project footprint + exact-CA project profile + concrete token/product mechanics → WATCH when founder/team endorsement and broader organic X proof remain unverified.
- Case reference: `references/roman-ai-founder-product-pattern.md` captures the ROMAN pattern: founder/source account explicitly posts the exact CA + real live product/install surfaces + acceptable token safety at microcap → can justify APE/BUY even when TwitterAPI Latest/Top is 402-blocked, as long as risks are explicit.
- Case reference: `references/oneira-ai-product-builder-pattern.md` captures the Oneira pattern: an alert may look like an X-Community-only meme, but if Pump/X fallbacks reveal a real product account plus a verified builder profile carrying the exact CA, microcap + strong early flow can justify APE despite TwitterAPI 402; use Jina-rendered X/fxtwitter pages when direct X/fxtwitter requests hang.
- Case reference: `references/detour-elizaos-builder-product-pattern.md` captures the DTOUR pattern: a real, public, downloadable/buildable elizaOS-style agent product plus a verified builder profile carrying the exact CA can justify APE at microcap even when the project mascot X is tiny and TwitterAPI Latest/Top is 402-blocked; verify via site, GitHub/API/raw README, Pump/Dex metadata, and builder-owned X fallbacks.
- Case reference: `references/denali-charity-viral-source-pattern.md` captures the DENALI pattern: wholesome official-source/charity meme + exceptional early flow → WATCH, not APE/BUY, when the official source did not mention the CA/token and charity proof is unverified.

---

## DEEP RESEARCH

### Phase 1: Token Fundamentals + Launch Quality
```bash
curl -s "https://api.dexscreener.com/latest/dex/tokens/CHAIN/TOKEN_ADDRESS"
curl -s "https://api.gopluslabs.io/api/v1/token_security/CHAIN_ID?contract_addresses=TOKEN_ADDRESS"
```

Before promoting to WATCH/APE, inspect bundle/launch quality signals: dev/top-holder concentration, suspicious early wallets, sniper-controlled supply, weak LP/provider distribution, LP lock, and whether buy flow looks organic or coordinated. Treat bundle risk as a major verdict input, not a minor footnote.

### Phase 2: X/Twitter Research (PRIMARY / most important phase)

X is the main research surface for token thesis. Dex/chart/security stats are secondary context, not the thesis. Before assigning WATCH/APE, extract real-info from X: what the project is building, how long the account/team has been building, founder/team credibility, exact CA/token endorsement from official accounts, organic discussion quality, and whether the idea is genuinely unique. Do not substitute random stats for thesis.

```bash
# Search by ticker, CA, and project name
curl -s "https://api.twitterapi.io/twitter/tweet/advanced_search?query=\$TICKER&queryType=Latest" -H "X-API-Key: $TWITTERAPI_KEY"
curl -s "https://api.twitterapi.io/twitter/tweet/advanced_search?query=TOKEN_ADDRESS&queryType=Latest" -H "X-API-Key: $TWITTERAPI_KEY"

# Project account info + tweets
curl -s "https://api.twitterapi.io/twitter/user/info?userName=PROJECT_HANDLE" -H "X-API-Key: $TWITTERAPI_KEY"
curl -s "https://api.twitterapi.io/twitter/user/last_tweets?userName=PROJECT_HANDLE" -H "X-API-Key: $TWITTERAPI_KEY"

# KOL mentions
curl -s "https://api.twitterapi.io/twitter/tweet/advanced_search?query=\$TICKER%20min_faves:50&queryType=Top" -H "X-API-Key: $TWITTERAPI_KEY"

# Founder research (if found)
curl -s "https://api.twitterapi.io/twitter/user/info?userName=FOUNDER_HANDLE" -H "X-API-Key: $TWITTERAPI_KEY"
```

⚠️ **VERIFY dev claims from THEIR OWN ACCOUNT.** Never trust holder/community claims about dev endorsement. Search `from:DEV_HANDLE` for mentions of the token. If dev hasn't posted about it → flag as unconfirmed.

### Phase 3: Web Research
Search for: project website, team/founder background, news/partnerships, Reddit sentiment.

### Phase 4: Narrative Assessment

**Narrative Score (add to every report):**
- 🔥 **Strong** — Novel concept, viral potential, clear catalyst
- 🟡 **Moderate** — Decent angle but not unique, or good concept with weak execution
- 🧊 **Weak/None** — Generic, repetitive, no story → likely dumps to zero

Key questions: Is it novel? Would someone share it unprompted? Is the market tired of this category? Why hold beyond a flip?

Smart money wallet count + narrative quality are better predictors than contract safety.

### Phase 5: Risk Synthesis
Combine: narrative quality, smart money interest, contract security, holder concentration, team transparency, social proof (organic vs bots), liquidity depth, buy/sell ratio.

---

## SHALLOW DIVE

Run only: DexScreener + GoPlus + one Twitter search + basic web search.

---

## Batch Research (5+ Tokens)

1. Spawn parallel sub-agents for concurrent research
2. After filtering, **auto deep dive top 1-3 tokens** without waiting for user to ask
3. Save report to `reports/YYYY-MM-DD/[N]-token-analysis.md`
4. Auto-add top picks to monthly watchlist
