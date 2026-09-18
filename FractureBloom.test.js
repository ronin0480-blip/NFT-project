const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FractureBloom", function () {
  let contract, owner, alice, bob;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("FractureBloom");
    contract = await Factory.deploy("ipfs://unrevealed");
    await contract.waitForDeployment();
  });

  it("starts closed with zero supply", async function () {
    expect(await contract.phase()).to.equal(0n);
    expect(await contract.totalSupply()).to.equal(0n);
  });

  it("blocks public mint until phase is Public", async function () {
    await expect(
      contract.connect(alice).publicMint(1, { value: ethers.parseEther("0.02") })
    ).to.be.revertedWith("Public mint is not open");
  });

  it("mints publicly once opened, respecting price and wallet cap", async function () {
    await contract.setPhase(2); // Public
    await contract.connect(alice).publicMint(2, { value: ethers.parseEther("0.04") });
    expect(await contract.balanceOf(alice.address)).to.equal(2n);

    await expect(
      contract.connect(alice).publicMint(2, { value: ethers.parseEther("0.04") })
    ).to.be.revertedWith("Exceeds per-wallet limit");
  });

  it("rejects underpayment", async function () {
    await contract.setPhase(2);
    await expect(
      contract.connect(alice).publicMint(1, { value: ethers.parseEther("0.001") })
    ).to.be.revertedWith("Insufficient payment");
  });

  it("never exceeds max supply", async function () {
    await contract.setPhase(2);
    // owner-mint most of the supply to make the boundary cheap to test
    await contract.ownerMint(owner.address, 98);
    await contract.connect(alice).publicMint(2, { value: ethers.parseEther("0.04") });
    expect(await contract.totalSupply()).to.equal(100n);

    await expect(
      contract.connect(bob).publicMint(1, { value: ethers.parseEther("0.02") })
    ).to.be.revertedWith("Exceeds max supply");
  });

  it("serves unrevealed URI until reveal() is called", async function () {
    await contract.setPhase(2);
    await contract.connect(alice).publicMint(1, { value: ethers.parseEther("0.02") });
    expect(await contract.tokenURI(0)).to.equal("ipfs://unrevealed");

    await contract.reveal("ipfs://revealed-cid");
    expect(await contract.tokenURI(0)).to.equal("ipfs://revealed-cid/0");
  });

  it("only the owner can withdraw, reveal, or change phase", async function () {
    await expect(contract.connect(alice).setPhase(2)).to.be.revertedWithCustomError(
      contract,
      "OwnableUnauthorizedAccount"
    );
    await expect(contract.connect(alice).reveal("ipfs://x")).to.be.revertedWithCustomError(
      contract,
      "OwnableUnauthorizedAccount"
    );
    await expect(contract.connect(alice).withdraw()).to.be.revertedWithCustomError(
      contract,
      "OwnableUnauthorizedAccount"
    );
  });
});
