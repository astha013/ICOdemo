require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

// Validate required environment variables
let privateKey = process.env.PRIVATE_KEY;
const sepoliaRpcUrl = process.env.SEPOLIA_RPC_URL;

// Normalize private key - add 0x prefix if missing
if (privateKey && !privateKey.startsWith("0x")) {
  privateKey = "0x" + privateKey;
}

// Only configure sepolia if both RPC URL and valid private key are provided
const networks = {
  hardhat: {
    chainId: 31337,
    accounts: {
      count: 10,
      balance: "1000000000000000000000000"
    }
  }
};

if (sepoliaRpcUrl && privateKey && privateKey.length === 66) {
  networks.sepolia = {
    url: sepoliaRpcUrl,
    accounts: [privateKey],
  };
} else {
  console.warn("WARNING: Sepolia network not configured. Set SEPOLIA_RPC_URL and PRIVATE_KEY in .env for deployment.");
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
  networks: networks,
};
