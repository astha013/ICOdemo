import { ethers } from 'ethers';
import { getSigner, getProvider } from './provider';

// Contract addresses from environment variables
export const ICO_ADDRESS = import.meta.env.VITE_ICO_ADDRESS;
export const TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_ADDRESS;
export const VESTING_ADDRESS = import.meta.env.VITE_VESTING_ADDRESS;

// Validate environment variables on load
if (!ICO_ADDRESS || !TOKEN_ADDRESS || !VESTING_ADDRESS) {
  console.error('Missing required environment variables:', {
    ICO_ADDRESS: !!ICO_ADDRESS,
    TOKEN_ADDRESS: !!TOKEN_ADDRESS,
    VESTING_ADDRESS: !!VESTING_ADDRESS,
  });
}

// Token ABI (ERC20)
export const TOKEN_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

// ICO ABI
export const ICO_ABI = [
  'function token() view returns (address)',
  'function vesting() view returns (address)',
  'function ETH_USD_RATE() view returns (uint256)',
  'function rounds(uint256) view returns (uint256 tokens, uint256 priceUSD, uint256 tokensLeft, uint8 category)',
  'function buyTokens(uint256 roundIndex) payable',
  'function getRoundInfo(uint256 roundIndex) view returns (uint256 tokens, uint256 priceUSD, uint256 tokensLeft, uint256 category)',
  'function getETHPrice(uint256 ethAmount) view returns (uint256)',
  'function pause()',
  'function unpause()',
  'function withdrawETH()',
  'function owner() view returns (address)',
  'function paused() view returns (bool)',
  'event TokensPurchased(address indexed user, uint256 amount, uint256 round)',
];

// Vesting ABI
export const VESTING_ABI = [
  'function token() view returns (address)',
  'function ico() view returns (address)',
  'function distributor() view returns (address)',
  'function userVestings(address user, uint256 index) view returns (uint256 total, uint256 claimed, uint256 start, uint256 cliff, uint256 duration)',
  'function claimableAmount(address user) view returns (uint256)',
  'function claimTokens()',
  'function getVestingParams(uint8 category) view returns (uint256 cliff, uint256 duration)',
  'event TokensClaimed(address indexed user, uint256 amount)',
  'event VestingAdded(address indexed user, uint256 amount, uint256 category)',
];

// Get contract instances
export const getTokenContract = async (withSigner = false) => {
  if (!TOKEN_ADDRESS) {
    throw new Error('Token address not configured');
  }
  
  if (withSigner) {
    const signer = await getSigner();
    return new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
  }
  
  const provider = getProvider();
  return new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, provider);
};

export const getICOContract = async (withSigner = false) => {
  if (!ICO_ADDRESS) {
    throw new Error('ICO address not configured');
  }
  
  if (withSigner) {
    const signer = await getSigner();
    return new ethers.Contract(ICO_ADDRESS, ICO_ABI, signer);
  }
  
  const provider = getProvider();
  return new ethers.Contract(ICO_ADDRESS, ICO_ABI, provider);
};

export const getVestingContract = async (withSigner = false) => {
  if (!VESTING_ADDRESS) {
    throw new Error('Vesting address not configured');
  }
  
  if (withSigner) {
    const signer = await getSigner();
    return new ethers.Contract(VESTING_ADDRESS, VESTING_ABI, signer);
  }
  
  const provider = getProvider();
  return new ethers.Contract(VESTING_ADDRESS, VESTING_ABI, provider);
};

// Helper functions
export const formatTokenAmount = (amount, decimals = 18) => {
  return ethers.formatUnits(amount, decimals);
};

export const parseTokenAmount = (amount, decimals = 18) => {
  return ethers.parseUnits(amount, decimals);
};

export const formatETH = (amount) => {
  return ethers.formatEther(amount);
};

export const parseETH = (amount) => {
  return ethers.parseEther(amount);
};
