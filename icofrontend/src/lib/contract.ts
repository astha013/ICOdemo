import { ethers } from "ethers";
import ICOTokenABI from "./abi/ICOToken.json";
import ICOStorageABI from "./abi/ICOStorage.json";

export const ICO_TOKEN_ADDRESS =
  import.meta.env.VITE_ICO_TOKEN_ADDRESS || "";
export const ICO_STORAGE_ADDRESS =
  import.meta.env.VITE_ICO_STORAGE_ADDRESS || "";

export const SEPOLIA_CHAIN_ID = 11155111;

export const ROUND_NAMES: Record<number, string> = {
  0: "PreSeed",
  1: "Seed",
  2: "Strategic",
  3: "Public",
};

export const ROUND_PRICES: Record<number, string> = {
  0: "0.067",
  1: "0.089",
  2: "0.111",
  3: "0.133",
};

export const ROUND_TOKENS: Record<number, string> = {
  0: "4,500,000",
  1: "7,875,000",
  2: "2,250,000",
  3: "1,875,000",
};

export const ROUND_HAS_VESTING: Record<number, boolean> = {
  0: true,
  1: true,
  2: true,
  3: false,
};

// Allocation categories matching contract
export const ALLOCATION_CATEGORIES = [
  { name: "Founders/Team", pct: 12, tokens: "27,000,000", cliff: "12 months", vest: "24 months" },
  { name: "Advisors", pct: 2.5, tokens: "5,625,000", cliff: "12 months", vest: "24 months" },
  { name: "Ecosystem", pct: 20, tokens: "45,000,000", cliff: "1 month", vest: "24 months" },
  { name: "Treasury", pct: 40.2, tokens: "90,450,000", cliff: "1 month", vest: "12 months" },
  { name: "Partnerships", pct: 18, tokens: "40,500,000", cliff: "3 months", vest: "12 months" },
];

// ICO allocation
export const ICO_ALLOCATION = { name: "ICO Sale", pct: 7.33, tokens: "16,500,000" };

export const TOTAL_SUPPLY = "225,000,000";

export { ICOTokenABI, ICOStorageABI };

export function isContractConfigured(): boolean {
  return (
    ICO_TOKEN_ADDRESS !== "" &&
    ICO_TOKEN_ADDRESS !== "0x0000000000000000000000000000000000000000"
  );
}

export function getICOTokenContract(
  providerOrSigner: ethers.Provider | ethers.Signer
) {
  if (!isContractConfigured()) {
    throw new Error("ICO_TOKEN_ADDRESS not configured. Deploy contracts first and update .env");
  }
  return new ethers.Contract(ICO_TOKEN_ADDRESS, ICOTokenABI, providerOrSigner);
}

export function getICOStorageContract(
  providerOrSigner: ethers.Provider | ethers.Signer
) {
  if (
    !ICO_STORAGE_ADDRESS ||
    ICO_STORAGE_ADDRESS === "0x0000000000000000000000000000000000000000"
  ) {
    throw new Error("ICO_STORAGE_ADDRESS not configured. Deploy contracts first and update .env");
  }
  return new ethers.Contract(ICO_STORAGE_ADDRESS, ICOStorageABI, providerOrSigner);
}

export function getReadOnlyProvider(): ethers.Provider | null {
  const eth = (window as any).ethereum;
  if (eth) return new ethers.BrowserProvider(eth);
  const rpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL;
  if (rpcUrl) return new ethers.JsonRpcProvider(rpcUrl);
  return null;
}
