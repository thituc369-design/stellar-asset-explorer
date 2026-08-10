# Stellar Asset Explorer

Look up a Stellar asset by code and issuer on the Stellar **testnet**, fetch
its total supply and holder count, and view the top holders.

## Framework

`vanilla-vite-ts` — Vite + TypeScript, no UI framework. Plain DOM rendering
in `src/app.ts`, plain `fetch` against the Horizon API.

## Folder structure

```
stellar-asset-explorer/
├── .npmrc
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
└── src/
    ├── main.ts        # entry point — mounts the app
    ├── app.ts         # DOM rendering + form handling + state
    ├── api.ts         # Horizon API client
    └── style.css      # dark theme styling
```

## Testnet endpoint

`https://horizon-testnet.stellar.org`

Read-only public endpoint. No wallet, no signing, no keys required.

## API calls

- `GET /assets?asset_code=<code>&asset_issuer=<G...>` — asset metadata, supply, holder count
- `GET /accounts?asset=<code>-<G...>&order=desc&limit=20` — top holders by balance

## Run

```bash
pnpm install
pnpm dev      # http://localhost:5173
pnpm build    # type-check + production build into dist/
pnpm preview  # serve the production build
```

## Usage

1. Enter an asset code (e.g. `USDC`, `BTC`, or a custom code).
2. Enter the issuer's Stellar public key (starts with `G`, 56 chars).
3. Submit. The explorer prints the asset summary and the top holders from the testnet.

Anything you find on Stellar's [testnet Horizon](https://horizon-testnet.stellar.org) can be looked up here.