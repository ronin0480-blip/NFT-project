import { ConnectButton } from "@rainbow-me/rainbowkit";
import MintPanel from "@/components/MintPanel";
import GalleryGrid from "@/components/GalleryGrid";
import { CONTRACT_ADDRESS } from "@/lib/contract";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b hairline">
        <div className="max-w-content mx-auto px-6 py-5 flex items-center justify-between">
          <span className="font-display text-lg tracking-tight">Fracture Bloom</span>
          <ConnectButton showBalance={false} chainStatus="icon" />
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-content mx-auto px-6 pt-16 pb-20 grid md:grid-cols-5 gap-12 items-start">
        <div className="md:col-span-3">
          <p className="font-mono text-xs text-moss mb-4">Plate 001 through 100</p>
          <h1 className="font-display text-4xl md:text-5xl leading-tight mb-6">
            One hundred blooms, grown once each, and never regrown the same way twice.
          </h1>
          <p className="text-paper/70 max-w-md mb-8 leading-relaxed">
            Fracture Bloom is a fixed index of one hundred algorithmically cultivated
            specimens. Each one is fixed permanently to a wallet at mint — a background
            field, a petal count, a palette, and an aura, combined into a form that
            exists nowhere else in the set.
          </p>
          <div className="flex gap-8 font-mono text-sm text-paper/60">
            <div>
              <div className="text-paper text-xl font-display">100</div>
              <div>total specimens</div>
            </div>
            <div>
              <div className="text-paper text-xl font-display">3</div>
              <div>max per wallet</div>
            </div>
            <div>
              <div className="text-paper text-xl font-display">1</div>
              <div>chain, fixed forever</div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <MintPanel />
        </div>
      </section>

      {/* Gallery */}
      <section className="max-w-content mx-auto px-6 pb-20">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display text-2xl">From the index</h2>
          <span className="font-mono text-xs text-paper/50">12 of 100 shown</span>
        </div>
        <GalleryGrid />
      </section>

      {/* About */}
      <section className="max-w-content mx-auto px-6 pb-20 grid md:grid-cols-2 gap-12 border-t hairline pt-12">
        <div>
          <h3 className="font-display text-xl mb-3">How a bloom is grown</h3>
          <p className="text-paper/70 leading-relaxed text-sm">
            Each specimen is generated from a seed tied to its plate number. The seed
            fixes a background field, a color palette, a petal count between five and
            twelve, a core motif, and an optional overlay. Roughly one in twelve
            specimens carries a golden aura — the rarest trait in the set. Every
            combination is checked against the rest of the index before it is
            finalized, so no two plates repeat.
          </p>
        </div>
        <div>
          <h3 className="font-display text-xl mb-3">What minting gets you</h3>
          <p className="text-paper/70 leading-relaxed text-sm">
            Minting transfers full ownership of the token to your wallet, recorded
            on-chain. Artwork and metadata are pinned to IPFS, so the specimen
            you hold isn&apos;t dependent on any one server staying online. There is
            no roadmap promise beyond the artwork itself — this is a fixed,
            finished collection.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t hairline">
        <div className="max-w-content mx-auto px-6 py-8 flex flex-col md:flex-row justify-between gap-4 text-xs font-mono text-paper/40">
          <span>
            Contract:{" "}
            {CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000"
              ? "not yet deployed"
              : CONTRACT_ADDRESS}
          </span>
          <span>Verify the contract address before sending funds.</span>
        </div>
      </footer>
    </main>
  );
}
