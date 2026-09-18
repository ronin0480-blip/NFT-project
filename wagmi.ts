import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, sepolia, base, baseSepolia } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "Fracture Bloom",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "REPLACE_WITH_WALLETCONNECT_ID",
  chains: [sepolia, baseSepolia, mainnet, base],
  ssr: true,
});
