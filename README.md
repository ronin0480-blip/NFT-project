# Fracture Bloom — a complete NFT project

A full, ready-to-deploy NFT collection: 100 generative artworks, an ERC-721
smart contract with an allowlist + public mint, and a Next.js minting site
styled as a botanical specimen ledger — ready to push to GitHub and deploy
on Vercel.

```
nft-project/
├── art/
│   ├── generator/generate.js     ← procedural SVG art generator (already run)
│   └── output/
│       ├── images/0.svg … 99.svg
│       └── metadata/0.json … 99.json
├── contracts/
│   └── FractureBloom.sol         ← the ERC-721 contract
├── scripts/
│   ├── deploy.js
│   ├── build-allowlist.js
│   └── allowlist.json            ← put your allowlist addresses here
├── test/FractureBloom.test.js
├── hardhat.config.js
├── package.json                  ← contract/Hardhat workspace
└── frontend/                     ← the Next.js minting site (separate app)
```

This is a real, working scaffold — but *you* control the money-handling
parts: your own wallet, your own RPC key, your own IPFS pinning. Nobody
else can deploy a contract or move funds on your behalf. Read every step
before running it, especially anything involving a private key.

---

## 0. What you'll need

- Node.js 18+ and npm
- A wallet you control (e.g. MetaMask) with some test ETH for a testnet
  deploy — get free Sepolia ETH from a faucet like `sepoliafaucet.com`
- A free RPC endpoint from [Alchemy](https://alchemy.com) or
  [Infura](https://infura.io)
- A free [Pinata](https://pinata.cloud) or [NFT.Storage](https://nft.storage)
  account, to pin images/metadata to IPFS
- A free [WalletConnect Cloud](https://cloud.walletconnect.com) project ID,
  for the "Connect Wallet" button
- A [GitHub](https://github.com) account and a [Vercel](https://vercel.com)
  account (Vercel can sign in with GitHub directly)

---

## 1. The artwork (already generated)

The 100-piece "Fracture Bloom" collection is already generated at
`art/output/images/*.svg` and `art/output/metadata/*.json`. Each piece is
a unique radially-symmetric bloom (background, palette, petal count, core
shape, overlay, and a ~8%-chance golden aura), built with zero external
dependencies so it's fully reproducible.

To regenerate (e.g. after tweaking `art/generator/generate.js` for your own
palette or shapes):

```bash
node art/generator/generate.js
```

Open a few files in `art/output/images/` in a browser to preview them —
any `.svg` file opens directly.

---

## 2. Pin the art to IPFS

1. Create a free account at [pinata.cloud](https://pinata.cloud).
2. Upload the entire `art/output/images/` folder as one pin (this gives you
   one CID for the whole image set).
3. Copy the resulting CID, then edit `art/output/metadata/*.json` (or
   regenerate with `IMAGE_BASE_URI` changed in `generate.js`) so each
   `image` field reads `ipfs://<images-CID>/<tokenId>.svg`.
4. Upload the `art/output/metadata/` folder as a second pin. Copy that CID
   too — this is what you'll pass to `reveal()` on-chain later.
5. Also pin one placeholder "unrevealed" image + a small JSON metadata file
   for it, and copy that URI into `.env` as `UNREVEALED_URI`. This is what
   buyers see before you call `reveal()`.

---

## 3. Deploy the smart contract

```bash
npm install
cp .env.example .env
# edit .env: add your RPC URL, your deploy wallet's PRIVATE_KEY,
# an Etherscan/Basescan API key, and UNREVEALED_URI from step 2
```

Run the tests first:

```bash
npx hardhat test
```

Deploy to a testnet (recommended before mainnet):

```bash
npm run deploy:sepolia
# or: npm run deploy:base-sepolia
```

This prints the deployed contract address — save it. Then verify the
source code so buyers can read it on the block explorer:

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> "<UNREVEALED_URI>"
```

When you're happy with testnet behavior, repeat with `npm run deploy:mainnet`
using a mainnet RPC URL and real ETH for gas.

### Setting up the allowlist (optional)

```bash
# edit scripts/allowlist.json with real wallet addresses
node scripts/build-allowlist.js
```

This prints a Merkle root — call `setMerkleRoot(<root>)` on the contract
(via Etherscan's "Write Contract" tab, or a small script) to activate it.

### Running the mint

The contract starts in `Closed` phase. As the owner, call:

- `setPhase(1)` to open the allowlist mint
- `setPhase(2)` to open the public mint
- `reveal("ipfs://<metadata-CID>")` once, after step 2, to switch tokens
  from the placeholder image to their real artwork
- `withdraw()` any time, to move collected ETH to your wallet

All of these are visible under the "Write Contract" tab once verified on
Etherscan/Basescan, or callable from a script using ethers.js.

---

## 4. Configure and run the frontend locally

```bash
cd frontend
npm install
cp .env.local.example .env.local
# edit .env.local: NEXT_PUBLIC_CONTRACT_ADDRESS from step 3,
# NEXT_PUBLIC_CHAIN_ID matching the network you deployed to,
# NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID from cloud.walletconnect.com
npm run dev
```

Open `http://localhost:3000` — connect a wallet on the same network you
deployed to, and confirm the mint panel shows the right phase and price.

---

## 5. Push to GitHub

From the project root:

```bash
git init
git add .
git commit -m "Fracture Bloom: contract, art, and minting site"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

`.gitignore` already excludes `node_modules`, `.env`, and `.env.local` —
double check `git status` before your first commit that no secrets are
staged.

---

## 6. Deploy the frontend on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import your GitHub repo.
2. **Root Directory**: set this to `frontend` (the contract workspace at
   the repo root is not part of the deployed site).
3. Framework preset: Next.js (auto-detected).
4. Add the same three environment variables from `.env.local` under
   Project → Settings → Environment Variables:
   - `NEXT_PUBLIC_CONTRACT_ADDRESS`
   - `NEXT_PUBLIC_CHAIN_ID`
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
5. Deploy. Vercel gives you a `your-project.vercel.app` URL immediately,
   and redeploys automatically on every push to `main`.

---

## Notes and honest caveats

- This scaffold uses OpenZeppelin's audited base contracts, but the
  combined contract has **not** been professionally audited. For a
  collection handling meaningful money, get an audit or at least a second
  experienced developer's review before mainnet deploy.
- Gas costs on Ethereum mainnet can be significant; consider an L2 like
  Base if that fits your project.
- Never share your `PRIVATE_KEY` or commit `.env`/`.env.local` — anyone
  with that key can drain the deploying wallet.
- The art here is original generative SVG output from the included script,
  free to use as-is or to restyle — it's not a copy of any existing
  collection.
