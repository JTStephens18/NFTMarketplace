import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
// Used to connect to one's wallet
import Web3Modal from "web3modal"

// We need a reference to our NFT address and Marketplace address
import {
  nftaddress, nftmarketaddress
} from '../config'

// We need our ABIs - Essentially a JSON representation of our Smart Contracts
// Allow us to interact with the SC on a client side application
// Created when our smart contracts are compiled (stored in artifacts folder)

import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'

export default function Home() {
  // Creation of initial states
  // First is an empty array of NFTs with a function to reset that array
  const [nfts, setNfts] = useState([])
  // Loading state for the app. By default it is not loaded
  // By using this, we can show/hide our UI. Which is a good way 
  // to keep up with where the application currently is
  const[loadingState, setLoadingState] = useState('not-loaded')

  // The way we can invoke the function to fetch NFTs when the app
  // loads is to use useEffect token
  useEffect(() => {
    loadNFTs()
  }, [])

  // This function is where we call our Smart Contract and fetch our NFTs
  // typically you want this function to be called when the app loads
  async function loadNFTs() {
    // Want to talk to the SC and load our NFTs
    // We can work with one of the ethers providers to do this
    const provider = new ethers.providers.JsonRpcProvider() 
    // Configure the contract with ethers.Contract
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
    const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, provider)
    // Returning array of all unsold market items with this function call
    const data = await marketContract.fetchMarketItems()

    // Want to map over all of those items - Creation of array called items
    // By mapping we can format and set the data into something nice and readable
    const items = await Promise.all(data.map(async i => {
      // First we want to call the token contract and get the tokenURI
      const tokenUri = await tokenContract.tokenURI(i.tokenId)
      // One additional call is for the metadata from the token
      // When working with IPFS, we will upload a JSON representation of the token
      // which will have name, description, and image of the token
      // To get that metadata, we will call axios.get(tokenUri)
      const meta = await axios.get(tokenUri)
      // Formatting the price to something we can use 
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price, 
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image, 
        name: meta.data.name,
        description: meta.data.description,
      }
      return item
    }))

    // Set the new updated items array
    setNfts(items)
    // Setting the loading state to be loaded 
    setLoadingState('loaded')
  }

  // Function for user to buy an NFT - allows user to connect to their wallet
  async function buyNft(nft) {
    const web3modal = new Web3Modal()
    const connection = await web3Modal.connect()
    // Create provider using the users connection
    const provider = new ethers.providers.Web3Provider(connection)

    // We need user to sign and create a transaction 

    // Create a signer
    const signer = provider.getSigner()
    const contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)

    // Reference to the price 
    const price = ethers.utils.parseUnits(nft.price.toString(), 'ether')

    // Create the market sale
    const transaction = await contract.createMarketSale(nftaddress, nft.tokenId, {value: price})
  
    // A way to wait until the transaction is executed 
    // So we can reload the screen and remove the NFT after transaction
    await transaction.wait()
    loadNFTs()

  }

  // Since there are no items, this is what will display when the app first loads
  if (loadingState === 'loaded' && !nfts.length) return (
  <h1 className="px-20 py-10 text-3x1">No items in marketplace</h1>)


  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: '1600px'}}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {/* Map over NFTs */}
          {
            nfts.map((nft, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden">
                <img src={nft.image} />
                <div className="p-4">
                  <p style={{ height: '64px'}} className="text-2xl font-semibold">{nft.name}</p>
                  <div style={{ height: '70px', overflow: 'hidden'}}>
                    <p className="text-gray-400">{nft.description}</p>
                  </div>
                </div>
                <div className="p-4 bg-black">
                  <p className="text-2xl mb-4 font-bold text-white">{nft.price} Matic</p>
                  <button className="w-full bg-purple-500 text-white font-bold py-2 px-12 rounded" 
                  onClick={() => buyNft(nft)}>Buy</button>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}
