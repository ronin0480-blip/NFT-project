const hre = require("hardhat");

async function main() {
  // Placeholder metadata shown before reveal. Point this at a small JSON
  // pinned to IPFS, e.g. { "name": "Fracture Bloom", "description": "...",
  // "image": "ipfs://<cid>/unrevealed.svg" }
  const UNREVEALED_URI = process.env.UNREVEALED_URI || "ipfs://REPLACE_WITH_UNREVEALED_CID";

  const FractureBloom = await hre.ethers.getContractFactory("FractureBloom");
  const contract = await FractureBloom.deploy(UNREVEALED_URI);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`FractureBloom deployed to: ${address}`);
  console.log(`Network: ${hre.network.name}`);
  console.log("\nNext steps:");
  console.log("1. Verify:      npx hardhat verify --network", hre.network.name, address, `"${UNREVEALED_URI}"`);
  console.log("2. Set the allowlist merkle root with setMerkleRoot(...)");
  console.log("3. Open minting with setPhase(1) for allowlist, setPhase(2) for public");
  console.log("4. After pinning images+metadata to IPFS, call reveal(<metadata folder CID as ipfs://...>)");
  console.log("5. Put this contract address + ABI into frontend/.env.local as NEXT_PUBLIC_CONTRACT_ADDRESS");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
