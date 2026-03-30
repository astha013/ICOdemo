require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

// Validate required environment variables
const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  console.warn("WARNING: PRIVATE_KEY environment variable is not set. Network deployments will fail.");
}

const sepoliaRpcUrl = process.env.SEPOLIA_RPC_URL;
if (!sepoliaRpcUrl) {
  console.warn("WARNING: SEPOLIA_RPC_URL environment variable is not set. Network deployments will fail.");
}

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    sepolia: {
      type: "http",
      url: sepoliaRpcUrl,
      accounts: [privateKey],
    },
  },
};
