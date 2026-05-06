# Viral-source meme evaluation

Use this reference for new-token alerts where the token narrative is based on a viral X post by a notable source account, but the source is not necessarily the token creator.

## Pattern

Example from 2026-05-04: `$CARDS` on Solana used an official Iran in Hyderabad consulate tweet (`Yes, we have less cards 😎`) as its social link. The tweet was genuinely viral (~1.23M views, ~26.6k likes, ~3.17k RTs) and the account kept making "cards/Uno" replies, but it never endorsed the token or posted the CA. CA-specific X posts were mostly low-follower callers/bots reporting 2x performance. Generic `$CARDS` Top search was polluted by an existing Collector_Crypt `$CARDS` project.

## Workflow

1. Fetch DexScreener pair data using the pair endpoint if token endpoint fails: `/latest/dex/pairs/{chain}/{pair}`.
2. Fetch the linked source tweet by ID and record views/likes/RTs/replies.
3. Search `from:SOURCE_HANDLE ticker_or_keyword` to see whether the source account kept the narrative alive.
4. Search the exact CA separately from `$TICKER`; CA search shows actual token promotion, while ticker search may show unrelated projects.
5. If the source did not post the CA/token, explicitly mark social proof as `viral narrative only — no official token endorsement`.
6. Score the verdict:
   - `SKIP`: weak/non-viral source, low volume, mostly bots, no product.
   - `WATCH`: verifiably viral source moment + unusually high early volume/liquidity, but no official endorsement/product.
   - `APE/BUY`: only when there is real product/team confirmation or exceptional high-conviction catalyst; call owner per escalation rules.

## Output language

For WATCH DMs, include a risk line like: `Pure meme; no product/team; source account did not endorse the token/CA; ticker collides with existing projects; caller/bot spam may indicate wash trading.`
