"use client";

import { useState, useMemo, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatEther } from "viem";
import { fractureBloomAbi } from "@/lib/abi";
import { CONTRACT_ADDRESS, COLLECTION_SIZE } from "@/lib/contract";

const PHASE_LABEL = ["Closed", "Allowlist", "Public"] as const;

export default function MintPanel() {
  const { address, isConnected } = useAccount();
  const [quantity, setQuantity] = useState(1);

  const contractConfig = { address: CONTRACT_ADDRESS, abi: fractureBloomAbi } as const;

  const { data: phase } = useReadContract({ ...contractConfig, functionName: "phase" });
  const { data: totalSupply, refetch: refetchSupply } = useReadContract({
    ...contractConfig,
    functionName: "totalSupply",
  });
  const { data: publicPrice } = useReadContract({ ...contractConfig, functionName: "publicPrice" });
  const { data: maxPerWallet } = useReadContract({ ...contractConfig, functionName: "MAX_PER_WALLET" });
  const { data: mintedByMe, refetch: refetchMintedByMe } = useReadContract({
    ...contractConfig,
    functionName: "mintedPerWallet",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isSuccess) {
      refetchSupply();
      refetchMintedByMe();
    }
  }, [isSuccess, refetchSupply, refetchMintedByMe]);

  const phaseNumber = typeof phase === "number" ? phase : Number(phase ?? 0);
  const supply = totalSupply ? Number(totalSupply) : 0;
  const remaining = COLLECTION_SIZE - supply;
  const myMinted = mintedByMe ? Number(mintedByMe) : 0;
  const walletCap = maxPerWallet ? Number(maxPerWallet) : 3;
  const price = publicPrice ? formatEther(publicPrice) : "0.02";
  const total = publicPrice ? formatEther(publicPrice * BigInt(quantity)) : "—";

  const canMint = phaseNumber === 2 && myMinted < walletCap && remaining > 0;

  const percentMinted = useMemo(
    () => Math.min(100, Math.round((supply / COLLECTION_SIZE) * 100)),
    [supply]
  );

  function handleMint() {
    if (!publicPrice) return;
    writeContract({
      ...contractConfig,
      functionName: "publicMint",
      args: [BigInt(quantity)],
      value: publicPrice * BigInt(quantity),
    });
  }

  return (
    <div className="border border-line rounded-none bg-ink/60 p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs uppercase tracking-wide text-moss font-sans">
          Mint status
        </span>
        <span className="text-xs font-mono px-2 py-1 border border-line text-ochre">
          {PHASE_LABEL[phaseNumber] ?? "Unknown"}
        </span>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm font-mono text-paper/70 mb-2">
          <span>{supply} / {COLLECTION_SIZE} grown</span>
          <span>{remaining} remaining</span>
        </div>
        <div className="h-[2px] w-full bg-line">
          <div
            className="h-[2px] bg-bloom transition-all duration-500"
            style={{ width: `${percentMinted}%` }}
          />
        </div>
      </div>

      <div className="flex items-baseline justify-between mb-6 font-display">
        <span className="text-2xl">{price} ETH</span>
        <span className="text-sm font-sans text-paper/60">per specimen</span>
      </div>

      {!isConnected ? (
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <button
              onClick={openConnectModal}
              className="w-full border border-paper py-3 font-sans text-sm hover:bg-paper hover:text-ink transition-colors"
            >
              Connect wallet to mint
            </button>
          )}
        </ConnectButton.Custom>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between border border-line px-4 py-2">
            <button
              aria-label="Decrease quantity"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="text-xl px-2 hover:text-bloom"
            >
              −
            </button>
            <span className="font-mono text-lg">{quantity}</span>
            <button
              aria-label="Increase quantity"
              onClick={() => setQuantity((q) => Math.min(walletCap - myMinted, q + 1))}
              className="text-xl px-2 hover:text-bloom"
            >
              +
            </button>
          </div>

          <button
            onClick={handleMint}
            disabled={!canMint || isPending || isConfirming}
            className="w-full bg-bloom text-ink py-3 font-sans text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition"
          >
            {isPending || isConfirming
              ? "Confirming in wallet…"
              : `Mint ${quantity} for ${total} ETH`}
          </button>

          <p className="text-xs font-mono text-paper/50">
            {myMinted} / {walletCap} minted from this wallet
          </p>

          {!canMint && phaseNumber !== 2 && (
            <p className="text-xs text-ochre">Public mint isn&apos;t open yet.</p>
          )}
          {error && (
            <p className="text-xs text-bloom break-words">
              {error.message.split("\n")[0]}
            </p>
          )}
          {isSuccess && (
            <p className="text-xs text-moss">Minted. Welcome to the index.</p>
          )}
        </div>
      )}
    </div>
  );
}
