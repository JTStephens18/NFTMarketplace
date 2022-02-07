require("@nomiclabs/hardhat-waffle");
const fs = require("fs")
const privateKey = fs.readFileSync(".secret").toString()
const projectId = "58eb54fb3e0e40648a6de226e9e43faa"

module.exports = {
  networks: {
    // Local network
    hardhat: {
      chainId: 1337
    },
    // Polygon testnet
    mumbai: {
      url: 'https://polygon-mumbai.infura.io/v3/${projectId}',
      // The accounts from where we are deploying our contracts
      accounts: [privateKey]
    },
    // Polygon mainnet
    mainnet: {
      url: 'https://polygon-mainnet.infura.io/v3/${projectId}',
      accounts: [privateKey]
    }
  },
  solidity: "0.8.4",
};
