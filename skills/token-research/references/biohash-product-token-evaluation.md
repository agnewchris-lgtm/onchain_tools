# BioHash pattern: tiny official-looking product token (May 2026)

Use this as a scoring reference for Solana/Pump product tokens where the project looks real but social proof is very early.

## Facts observed

- Token: `$BioHash` / BioHash on Solana, CA `4sPePkv1Xx5vt8FkJxF5EAXLaFgNH9S2aUirCf5wpump`.
- Dex/Pump metadata linked `https://biohash.network/` and `https://x.com/BioHashNetwork`.
- X profile HTML (without TwitterAPI credits) exposed:
  - exact CA in bio,
  - matching `biohash.network` website,
  - Premium/verified status,
  - joined May 2, 2026,
  - very small social base (~65 followers, ~18 posts at research time).
- TwitterAPI returned `402 Payment Required`; `xurl` was unavailable. Latest/Top/CA search remained unverified.
- Website HTML was a React/Vite shell, but bundled JS string extraction revealed product claims:
  - peptide vendor-price oracle,
  - Solana memo/Merkle commitments,
  - 26 tracked peptides,
  - public REST API endpoints,
  - roadmap to peg-backed peptide SPL tokens / reserve mechanics,
  - devnet/mainnet/contract/reserve copy.
- Backend API probe to the Railway app hung from the environment; do not loop on it.
- RugCheck was good/locked LP, but low LP-provider warning and very early liquidity remained.

## Verdict lesson

Classify as **WATCH**, not SKIP, because the narrative/product is unique and there is official-looking CA + site alignment. Do **not** jump to APE/BUY unless social/team/product proof becomes independently strong: founder/GitHub/team confirmation, working rendered app/API verification, broader organic X proof, or exceptional market traction.

## Reusable workflow

1. Query Dex token + pair endpoint and Pump metadata.
2. If TwitterAPI is 402, fetch `https://x.com/HANDLE` with a browser-like User-Agent and search the HTML for profile fields (`description`, `followers_count`, `statuses_count`, `created_at`, `verification_info`, `url`).
3. Fetch fxtwitter/vxtwitter profile mirrors to cross-check, but treat them as profile evidence only.
4. For React/Vite shells, fetch referenced `/assets/*.js` bundles and extract quoted strings containing product terms (`oracle`, `api`, `roadmap`, `contract`, `Solana`, `GitHub`, ticker/CA).
5. If backend/API/browser rendering hangs, record it as an unverifiable risk and continue rather than timing out the whole alert.
