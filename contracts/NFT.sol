//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    // Will increment the value of tokens as they are minted
    Counters.Counter private _tokenIds;
    // Address of the marketplace that we want the NFT to interact with
    address contractAddress;

    // When we deploy this contract we need to pass in the address of the marketplace
    constructor(address marketplaceAddress) ERC721("Metaverse Tokens", "METT") {
        contractAddress = marketplaceAddress;
    }

    // Function for minting new tokens
    function createToken(string memory tokenURI) public returns (uint) {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();

        // Mints a new token
        _mint(msg.sender, newItemId);
        // Setting the tokenURI - Function available through ERC721URIStorage.sol
        _setTokenURI(newItemId, tokenURI);
        // Gives the marketplace the approval to transact this token between users
        setApprovalForAll(contractAddress, true);
        return newItemId;
    }
}
