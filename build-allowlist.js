/**
 * Reads scripts/allowlist.json (an array of wallet addresses),
 * builds a Merkle tree, prints the root (for setMerkleRoot on-chain),
 * and writes scripts/allowlist-proofs.json mapping each address to its
 * proof (for the frontend to use when calling allowlistMint).
 */
const fs = require("fs");
const path = require("path");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const { ethers } = require("ethers");

const inputPath = path.join(__dirname, "allowlist.json");
if (!fs.existsSync(inputPath)) {
  console.error("Create scripts/allowlist.json first — an array of wallet addresses, e.g.:");
  console.error('["0xAbc123...", "0xDef456..."]');
  process.exit(1);
}

const addresses = JSON.parse(fs.readFileSync(inputPath, "utf8")).map((a) =>
  ethers.getAddress(a)
);

const leaves = addresses.map((addr) => keccak256(addr));
const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
const root = tree.getHexRoot();

const proofs = {};
addresses.forEach((addr) => {
  const leaf = keccak256(addr);
  proofs[addr] = tree.getHexProof(leaf);
});

fs.writeFileSync(
  path.join(__dirname, "allowlist-proofs.json"),
  JSON.stringify({ root, proofs }, null, 2)
);

console.log(`Merkle root: ${root}`);
console.log(`Wrote proofs for ${addresses.length} addresses to scripts/allowlist-proofs.json`);
console.log(`\nOn-chain: call setMerkleRoot("${root}")`);
