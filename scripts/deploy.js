const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy Token
  console.log("\nDeploying Token...");
  const Token = await hre.ethers.getContractFactory("Token");
  const token = await Token.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("Token deployed to:", tokenAddress);

  // Deploy Vesting
  console.log("\nDeploying Vesting...");
  const Vesting = await hre.ethers.getContractFactory("Vesting");
  const vesting = await Vesting.deploy(tokenAddress);
  await vesting.waitForDeployment();
  const vestingAddress = await vesting.getAddress();
  console.log("Vesting deployed to:", vestingAddress);

  // Deploy ICO
  console.log("\nDeploying ICO...");
  const ICO = await hre.ethers.getContractFactory("ICO");
  const ico = await ICO.deploy(tokenAddress, vestingAddress);
  await ico.waitForDeployment();
  const icoAddress = await ico.getAddress();
  console.log("ICO deployed to:", icoAddress);

  // Deploy Distributor
  console.log("\nDeploying Distributor...");
  const Distributor = await hre.ethers.getContractFactory("Distributor");
  const distributor = await Distributor.deploy(vestingAddress);
  await distributor.waitForDeployment();
  const distributorAddress = await distributor.getAddress();
  console.log("Distributor deployed to:", distributorAddress);

  // Set ICO and Distributor addresses in Vesting
  console.log("\nSetting ICO and Distributor in Vesting...");
  const vestingOwner = await vesting.owner();
  if (vestingOwner !== deployer.address) {
    throw new Error(`Deployer ${deployer.address} is not owner of Vesting contract. Owner is ${vestingOwner}`);
  }

  const setICOTx = await vesting.setICO(icoAddress);
  const setICOReceipt = await setICOTx.wait();
  if (setICOReceipt.status !== 1) {
    throw new Error("setICO transaction failed");
  }

  const setDistributorTx = await vesting.setDistributor(distributorAddress);
  const setDistributorReceipt = await setDistributorTx.wait();
  if (setDistributorReceipt.status !== 1) {
    throw new Error("setDistributor transaction failed");
  }
  console.log("ICO and Distributor set in Vesting");

  // Transfer all tokens to Vesting
  console.log("\nTransferring all tokens to Vesting...");
  const totalSupply = await token.totalSupply();
  const transferTx = await token.transfer(vestingAddress, totalSupply);
  const transferReceipt = await transferTx.wait();
  if (transferReceipt.status !== 1) {
    throw new Error("Token transfer transaction failed");
  }
  console.log("Transferred", hre.ethers.formatEther(totalSupply), "tokens to Vesting");

  console.log("\n=== Deployment Complete ===");
  console.log("Token:", tokenAddress);
  console.log("Vesting:", vestingAddress);
  console.log("ICO:", icoAddress);
  console.log("Distributor:", distributorAddress);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
