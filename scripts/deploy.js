const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy ICOStorage
  console.log("\nDeploying ICOStorage...");
  const ICOStorage = await hre.ethers.getContractFactory("ICOStorage");
  const storage = await ICOStorage.deploy();
  await storage.waitForDeployment();
  const storageAddress = await storage.getAddress();
  console.log("ICOStorage deployed to:", storageAddress);

  // Deploy ICOToken
  console.log("\nDeploying ICOToken...");
  const ICOToken = await hre.ethers.getContractFactory("ICOToken");
  const icoToken = await ICOToken.deploy(storageAddress);
  await icoToken.waitForDeployment();
  const icoTokenAddress = await icoToken.getAddress();
  console.log("ICOToken deployed to:", icoTokenAddress);

  // Set ICOToken address in ICOStorage
  console.log("\nSetting ICOToken address in ICOStorage...");
  const setICOTx = await storage.setICOContract(icoTokenAddress);
  await setICOTx.wait();
  console.log("ICOToken address set in ICOStorage");

  // Verify round configuration
  console.log("\n=== Round Configuration ===");
  for (let i = 0; i < 4; i++) {
    const info = await icoToken.getRoundInfo(i);
    const names = ["PreSeed", "Seed", "Strategic", "Public"];
    console.log(`Round ${i} (${names[i]}): $${hre.ethers.formatEther(info.priceUSD)} USD, ${hre.ethers.formatEther(info.tokensAvailable)} tokens`);
  }

  console.log("\n=== Deployment Complete ===");
  console.log("ICOStorage:", storageAddress);
  console.log("ICOToken:", icoTokenAddress);

  // Update .env files with deployed addresses
  const network = hre.network.name;
  if (network === "sepolia") {
    // Update root .env
    updateEnvFile(path.join(__dirname, "../.env"), {
      ICO_TOKEN_ADDRESS: icoTokenAddress,
      ICO_STORAGE_ADDRESS: storageAddress,
    });

    // Update backend .env
    const backendEnvPath = path.join(__dirname, "../../icobackend/.env");
    if (fs.existsSync(backendEnvPath)) {
      updateEnvFile(backendEnvPath, {
        ICO_ADDRESS: icoTokenAddress,
      });
    }

    // Update frontend .env
    const frontendEnvPath = path.join(__dirname, "../../icofrontend/.env");
    if (fs.existsSync(frontendEnvPath)) {
      updateEnvFile(frontendEnvPath, {
        VITE_ICO_TOKEN_ADDRESS: icoTokenAddress,
        VITE_ICO_STORAGE_ADDRESS: storageAddress,
      });
    }

    console.log("\n.env files updated with deployed addresses");
  }
}

function updateEnvFile(filePath, updates) {
  let content = fs.readFileSync(filePath, "utf8");
  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      content += `\n${key}=${value}`;
    }
  }
  fs.writeFileSync(filePath, content);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
