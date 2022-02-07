import { useState } from 'react'
import { ethers } from 'ethers'
import { create as ifpsHttpClient } from 'ipfs-http-client'
import { useRouter } from 'next/router'
import Web3Modal from 'web3modal'

// This infura url sets and pins items to ipfs
const client = ifpsHttpClient('https://ipfs.infura.io:5001/api/v0')

import {
    nftaddress, nftmarketaddress
} from '../config'

// References for ABIs
import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'
import { list } from 'postcss'

// Definition of default export (component)
export default function CreateItem () {
    // Want to create a couple of pieces of local state 
    
    // First one we want to set is the file URL - for IPFS file
    const [fileUrl, setFileUrl] = useState(null)
    // Allows someone to create an NFT - Allows setting the price, name, and description
    // Utilizing useState we pass in an object instead of a bool, string, etc.
    const [formInput, updateFormInput] = useState({ price: '', name: '', description: ''})
    // Reference to router using the useRouter hook
    const router = useRouter()

    // First function is for creating and updating the file URL via a form input
    async function onChange(e) {
        const file = e.target.files[0]
        // Try catch block is what we will use to upload the file to ipfs
        try {
            const added = await client.add (
                file,
                // Progress callback 
                {
                    progress: (prog) => console.log('received: ${prog}')
                }
            )
            // Using the added variable, we can now set the URL of where the file is now located
            const url = 'https://ipfs.infura.io/ipfs/${added.path}'
            setFileUrl(url) 
        } catch (e) {
            console.log(e)
        }
    }

    // Functions that allow the user to list an item for sale 

    // First function allows user to create and item and save it to ipfs (it will be the reference to the nft)
    async function createItem() {
        const {name, description, price } = formInput
        if (!name || !description || !price || !fileUrl) return 
        const data = JSON.stringify({
            name, description, image: fileUrl
        })

        try {
            const added = await client.add(data)
            const url = 'https://ipfs.infura.io/ipfs/${added.path}'
            // After file is upload3ed to IPFS, pass URL to save it on Polygon
            createSale(url)
        } catch (error) {
            console.log('Error uploading file: ', error)
        }   
    }
    // Second function is for listing the item for sale (also creates the NFT)
    async function createSale(url) {
        const web3Modal = new Web3Modal()
        const connection = await web3Modal.connect()
        const provider = new ethers.providers.Web3Provider(connection)
        const signer = provider.getSigner()

        let contract = new ethers.Contract(nftaddress, NFT.abi, signer)
        // Creates a token
        let transaction = await contract.createToken(url)
        // Waiting for transaction to succeed 
        let tx = await transaction.wait()

        // We want to get the tokenId return from that transaction
        let event = tx.events[0]
        let value = event.args[2]
        let tokenId = value.toNumber()

        // Want to get a reference to the price we want to sell the item for
        const price = ethers.utils.parseUnits(formInput.price, 'ether')

        // Want to move the reference of the contract from NFT to the market
        contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
        let listingPrice = await contract.getListingPrice()
        listingPrice = listingPrice.toString()

        transaction = await contract.createMarketItem(nftaddress, tokenId, price, { value: listingPrice })
        await transaction.wait()

        // Now we want to reroute the user to main page 
        router.push('/')
    }

    return (
        <div className="flex justify-center">
            <div className="w-1/2 flex flex-col pb-12">
                <input 
                    placeholder="Asset Name"
                    className="mt-8 border rouded p-4"
                    // This calls all formInput, but only return the name
                    onChange={e => updateFormInput({ ...formInput, name: e.target.value })}
                />
                <textarea
                    placeholder="Asset Description"
                    className="mt=2 border rounded p-4"
                    onChange={e => updateFormInput({...formInput, description: e.target.value})}
                />
                <input
                    placeholder="Asset Price in Matic"
                    className="mt-2 border rounded p-4"
                    onChange={e => updateFormInput({...formInput, price: e.target.value})}
                />
                <input 
                    type="file"
                    name="Asset"
                    className="my-4"
                    onChange={onChange}
                />
                {
                    fileUrl && (
                        <img className="rounded mt-4" width="350" src={fileUrl} />
                    )
                }
                <button 
                    onClick={createItem} 
                    className="font-bold mt-4 bg-purple-500 text-white rounded p-4 shadow-lg"
                >
                    Create Digital Asset
                </button>
            </div>
        </div>
        )
}
