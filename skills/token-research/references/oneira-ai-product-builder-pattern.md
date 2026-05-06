# Oneira AI product/builder-confirmed CA pattern

Session: 2026-05-06 — `$Oneira` on Solana, CA `5DKpFABHrtepo2NxR4B4TM3FfngtSN6L8mYkFU5epump`.

## Why this mattered

Alert metadata only showed an X Community link, which usually looks weak. Deeper X fallback research showed a real product/builder-confirmed token:

- Pump.fun metadata `website` pointed to a source/status tweet, not a normal site.
- Source tweet by `@heygurisingh` described Oneira as an AI that lives on X, posts autonomously, and generates a nightly dream video from its daily conversation stream.
- fxtwitter status data showed the source tweet had meaningful traction: ~171k views, 328 likes, 75 RTs, 34 replies.
- Source tweet named `@owenbreakcode` as builder and `@OneiraEngine` as the live product account.
- `@OneiraEngine` profile showed a live/tiny AI product account: joined Apr 2026, ~738 posts, ~138 followers, powered by `@owenbreakcode`.
- `@owenbreakcode` profile was verified/Premium, old account (joined Dec 2008), ~1.9k followers, and bio explicitly included the exact CA.
- X Community page carried the exact CA and active community posts redirecting fees to the dev.

This justified **APE** despite the original alert's “X Community link” red flag because the CA was verified from the builder's own profile and attached to a real product/narrative.

## Useful fallback technique

When TwitterAPI returns `402` and direct `curl`/`urllib` to X/fxtwitter hangs:

```bash
# X status/profile/community through Jina reader
https://r.jina.ai/http://r.jina.ai/http://https://x.com/HANDLE/status/TWEET_ID
https://r.jina.ai/http://r.jina.ai/http://https://x.com/i/communities/COMMUNITY_ID
https://r.jina.ai/http://r.jina.ai/http://https://x.com/HANDLE

# fxtwitter JSON through Jina reader (works even when direct fxtwitter fetch hangs)
https://r.jina.ai/http://r.jina.ai/http://https://api.fxtwitter.com/status/TWEET_ID
https://r.jina.ai/http://r.jina.ai/http://https://api.fxtwitter.com/HANDLE
```

Jina-rendered X Community pages can expose:
- community title / member count
- exact CA in community description
- recent community posts
- quoted source tweets and authors

Jina-rendered fxtwitter JSON can expose:
- tweet text, source author, followers, verification, views/likes/RT/replies
- media URL
- mentioned builder/product handles

## Scoring guidance

Treat this as stronger than a pure meme/community-only alert when all are true:

1. Source tweet describes a concrete product or live AI agent, not just a meme.
2. Product/builder account is independently visible through profile fallbacks.
3. Builder's own account/profile includes the exact CA or directly posts the exact CA.
4. Early flow is meaningful relative to microcap and liquidity is locked/acceptable.

Keep risks explicit:
- tiny product/community account
- missing GitHub/open-source proof even if source says “open source”
- TwitterAPI Latest/Top unavailable
- low liquidity, high holder concentration, low LP-provider warnings

Verdict tendency: **APE** at microcap if builder-confirmed exact CA + real product; **WATCH** if product exists but CA is only community/holder-claimed or builder confirmation is missing.