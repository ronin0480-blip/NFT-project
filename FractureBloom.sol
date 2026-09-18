// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/// @title Fracture Bloom
/// @notice A fixed-supply generative art collection with an allowlist phase
///         followed by a public mint. Metadata is unrevealed by default and
///         can be revealed once by the owner after upload to IPFS.
contract FractureBloom is ERC721Enumerable, Ownable {
    uint256 public constant MAX_SUPPLY = 100;
    uint256 public constant MAX_PER_WALLET = 3;

    uint256 public allowlistPrice = 0.01 ether;
    uint256 public publicPrice = 0.02 ether;

    enum MintPhase {
        Closed,
        Allowlist,
        Public
    }
    MintPhase public phase = MintPhase.Closed;

    bytes32 public merkleRoot;

    string private _baseTokenURI;
    bool public revealed = false;
    string public unrevealedURI;

    mapping(address => uint256) public mintedPerWallet;

    uint256 private _nextTokenId;

    event Minted(address indexed to, uint256 indexed tokenId);
    event PhaseChanged(MintPhase phase);
    event Revealed(string baseURI);

    constructor(
        string memory unrevealedURI_
    ) ERC721("Fracture Bloom", "BLOOM") Ownable(msg.sender) {
        unrevealedURI = unrevealedURI_;
    }

    // ---------------------------------------------------------------
    // Minting
    // ---------------------------------------------------------------

    function allowlistMint(uint256 quantity, bytes32[] calldata proof) external payable {
        require(phase == MintPhase.Allowlist, "Allowlist mint is not open");
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(MerkleProof.verify(proof, merkleRoot, leaf), "Not on allowlist");
        require(msg.value >= allowlistPrice * quantity, "Insufficient payment");
        _mintBatch(msg.sender, quantity);
    }

    function publicMint(uint256 quantity) external payable {
        require(phase == MintPhase.Public, "Public mint is not open");
        require(msg.value >= publicPrice * quantity, "Insufficient payment");
        _mintBatch(msg.sender, quantity);
    }

    function _mintBatch(address to, uint256 quantity) internal {
        require(quantity > 0, "Quantity must be greater than zero");
        require(_nextTokenId + quantity <= MAX_SUPPLY, "Exceeds max supply");
        require(
            mintedPerWallet[to] + quantity <= MAX_PER_WALLET,
            "Exceeds per-wallet limit"
        );

        mintedPerWallet[to] += quantity;
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _nextTokenId;
            _nextTokenId++;
            _safeMint(to, tokenId);
            emit Minted(to, tokenId);
        }
    }

    /// @notice Owner-only mint, for reserving pieces (giveaways, team, etc.)
    function ownerMint(address to, uint256 quantity) external onlyOwner {
        require(_nextTokenId + quantity <= MAX_SUPPLY, "Exceeds max supply");
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _nextTokenId;
            _nextTokenId++;
            _safeMint(to, tokenId);
            emit Minted(to, tokenId);
        }
    }

    function totalSupply() public view override returns (uint256) {
        return _nextTokenId;
    }

    // ---------------------------------------------------------------
    // Admin controls
    // ---------------------------------------------------------------

    function setPhase(MintPhase newPhase) external onlyOwner {
        phase = newPhase;
        emit PhaseChanged(newPhase);
    }

    function setMerkleRoot(bytes32 root) external onlyOwner {
        merkleRoot = root;
    }

    function setPrices(uint256 newAllowlistPrice, uint256 newPublicPrice) external onlyOwner {
        allowlistPrice = newAllowlistPrice;
        publicPrice = newPublicPrice;
    }

    /// @notice Called once, after images/metadata are pinned to IPFS.
    function reveal(string calldata baseURI) external onlyOwner {
        require(!revealed, "Already revealed");
        _baseTokenURI = baseURI;
        revealed = true;
        emit Revealed(baseURI);
    }

    function withdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }

    // ---------------------------------------------------------------
    // Metadata
    // ---------------------------------------------------------------

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        if (!revealed) {
            return unrevealedURI;
        }
        return string(abi.encodePacked(_baseTokenURI, "/", _toString(tokenId)));
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + (value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
