export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const COLLECTION_SIZE = 100;

// Set this to the chain ID you deployed to: 1 (mainnet), 11155111 (Sepolia),
// 84532 (Base Sepolia), 8453 (Base mainnet).
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 11155111);
