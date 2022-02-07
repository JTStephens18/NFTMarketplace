//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// Security mechanism that will give us a utility called non reentrant - prevents reentry attacks
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTMarket is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _itemIds;
    // Reason for counting items sold is when working with arrays in Solidity,
    // you cannot have dynamic linked arrays. So, we need to know the length
    Counters.Counter private _itemsSold;

    // Owner of the contract
    address payable owner;
    // Even though we are deploying to matic, the API is sort of the same. So we use ether
    uint256 listingPrice = 0.025 ether;

    // Basically says the owner of the contract is the one deploying it
    constructor() {
        owner = payable(msg.sender);
    }

    // Struct for each market item
    struct MarketItem {
        uint256 itemId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
    }

    // Mapping for our market item - want to keep up with all items that have been created
    // All we need to do to fetch each market item is to know the ID of that item
    mapping(uint256 => MarketItem) private idToMarketItem;

    // Event for when a market item is created
    event MarkedItemCreated(
        uint256 indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold
    );

    // Function that returns the listing price
    // When we deploy our contract, the front end doesn't know how much it is to list an item
    // So, we need that value
    function getListingPrice() public view returns (uint256) {
        return listingPrice;
    }

    // Functions for interacting with the contract
    // For creating a market item and putting it for sale
    function createMarketItem(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) public payable nonReentrant {
        require(price > 0, "Price must be at least 1 wei");
        require(
            msg.value == listingPrice,
            "Price must be equal to listing price"
        );

        _itemIds.increment();
        uint256 itemId = _itemIds.current();

        idToMarketItem[itemId] = MarketItem(
            itemId,
            nftContract,
            tokenId,
            payable(msg.sender),
            payable(address(0)),
            price,
            false
        );

        //Transfer ownership of NFT to the contract itself
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        emit MarkedItemCreated(
            itemId,
            nftContract,
            tokenId,
            msg.sender,
            address(0),
            price,
            false
        );
    }

    // For creating a market sale for buying or selling an item between parties
    function createMarketSale(address nftContract, uint256 itemId)
        public
        payable
        nonReentrant
    {
        uint256 price = idToMarketItem[itemId].price;
        uint256 tokenId = idToMarketItem[itemId].tokenId;

        require(
            msg.value == price,
            "Please submit the asking price in order to complete the purchase"
        );

        // Transfer the value of the transaction (how much money was sent to seller)
        idToMarketItem[itemId].seller.transfer(msg.value);
        // We want to transfer ownership of this token to msg.sender (sent the NFT to the buyer)
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
        // Set the local value for the owner to be msg.sender
        idToMarketItem[itemId].owner = payable(msg.sender);
        idToMarketItem[itemId].sold = true;
        _itemsSold.increment();
        // Pay owner of contract amount of listing price
        payable(owner).transfer(listingPrice);
    }

    // Want to have a function that returns all the unsold items, returns only items I've purchased, returns items I've created

    // Function to return all unsold items
    function fetchMarketItems() public view returns (MarketItem[] memory) {
        uint256 itemCount = _itemIds.current();
        uint256 unsoldItemCount = _itemIds.current() - _itemsSold.current();
        uint256 currentIndex = 0;

        // Creation of empty array the length of unsold items
        MarketItem[] memory items = new MarketItem[](unsoldItemCount);
        for (uint256 i = 0; i < itemCount; i++) {
            // Check to see if this item is unsold by checking if owner address of an item is empty
            // When creating the mapping for a new item we set the address to empty
            if (idToMarketItem[i + 1].owner == address(0)) {
                uint256 currentId = idToMarketItem[i + 1].itemId;
                // Reference to current item
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    // Function that returns only the NFTs the user has purchased
    function fetchMyNFTs() public view returns (MarketItem[] memory) {
        uint256 totalItemCount = _itemIds.current();
        uint256 itemCount = 0;
        uint256 currentIndex = 0;

        // For loop to determine how many items are the users
        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].owner == msg.sender) {
                itemCount += 1;
            }
        }
        // Items array length of itemCount
        MarketItem[] memory items = new MarketItem[](itemCount);
        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].owner == msg.sender) {
                uint256 currentId = idToMarketItem[i + 1].itemId;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    // Function that returns an array of NFTs the user has created themselves
    // Similar to the fetchMyNFTs function, expect we will check the idToMarketItem[i + 1].seller == msg.sender
    function fetchItemsCreated() public view returns (MarketItem[] memory) {
        uint256 totalItemCount = _itemIds.current();
        uint256 itemCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].seller == msg.sender) {
                itemCount += 1;
            }
        }
        MarketItem[] memory items = new MarketItem[](itemCount);
        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].seller == msg.sender) {
                uint256 currentId = idToMarketItem[i + 1].itemId;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }
}
