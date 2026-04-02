const { ethers } = require('ethers');
const Purchase = require('../models/Purchase');
const Claim = require('../models/Claim');

// ICOToken ABI - only events and functions we need
const ICO_TOKEN_ABI = [
  'event PurchaseRecorded(address indexed user, uint8 round, uint256 ethAmount, uint256 tokenAmount)',
  'event TokensClaimed(address indexed user, uint256 amount)',
  'function getCurrentRound() view returns (uint8)',
  'function getRoundInfo(uint8 round) view returns (uint256 price, uint256 tokensAvailable, uint256 tokensSold)',
  'function getTotalRaisedETH() view returns (uint256)',
  'function getTotalSoldTokens() view returns (uint256)',
  'function owner() view returns (address)',
];

// Round names mapping
const ROUND_NAMES = {
  0: 'PreSeed',
  1: 'Seed',
  2: 'Strategic',
  3: 'Public',
};

// Token prices in ETH
const TOKEN_PRICES = {
  0: 0.067,
  1: 0.089,
  2: 0.111,
  3: 0.133,
};

class EventListener {
  constructor() {
    this.provider = null;
    this.icoContract = null;
    this.isListening = false;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.retryDelay = 5000;
  }

  async initialize() {
    try {
      if (!process.env.SEPOLIA_RPC_URL) {
        throw new Error('SEPOLIA_RPC_URL not configured');
      }
      if (!process.env.ICO_ADDRESS) {
        throw new Error('ICO_ADDRESS not configured');
      }

      // Use HTTP provider for event polling (more reliable than WS)
      this.provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);

      // Create contract instance with ICOToken ABI
      this.icoContract = new ethers.Contract(
        process.env.ICO_ADDRESS,
        ICO_TOKEN_ABI,
        this.provider
      );

      console.log('Event listener initialized successfully');
      console.log('ICO Address:', process.env.ICO_ADDRESS);
    } catch (error) {
      console.error('Failed to initialize event listener:', error.message);
      throw error;
    }
  }

  async startListening() {
    if (this.isListening) {
      console.log('Event listener is already running');
      return;
    }

    try {
      await this.initialize();

      // Listen to PurchaseRecorded event (new contract event name)
      this.icoContract.on('PurchaseRecorded', async (user, round, ethAmount, tokenAmount, event) => {
        try {
          console.log('PurchaseRecorded event detected:');
          console.log('  User:', user);
          console.log('  Round:', round.toString());
          console.log('  ETH Amount:', ethers.formatEther(ethAmount));
          console.log('  Token Amount:', ethers.formatEther(tokenAmount));

          const roundIndex = Number(round);
          const roundName = ROUND_NAMES[roundIndex] || `Round ${roundIndex}`;
          const tokenPrice = TOKEN_PRICES[roundIndex] || 0;

          // Check if purchase already exists
          const existingPurchase = await Purchase.findOne({
            txHash: event.log.transactionHash,
          });

          if (existingPurchase) {
            console.log('Purchase already exists, skipping...');
            return;
          }

          // Save purchase to database
          const purchase = new Purchase({
            userWallet: user.toLowerCase(),
            round: roundIndex,
            roundName: roundName,
            ethAmount: parseFloat(ethers.formatEther(ethAmount)),
            tokenAmount: parseFloat(ethers.formatEther(tokenAmount)),
            tokenPrice: tokenPrice,
            txHash: event.log.transactionHash,
          });

          await purchase.save();
          console.log('Purchase saved to database');
        } catch (error) {
          console.error('Error processing PurchaseRecorded event:', error);
        }
      });

      // Listen to TokensClaimed event (same name in new contract)
      this.icoContract.on('TokensClaimed', async (user, amount, event) => {
        try {
          console.log('TokensClaimed event detected:');
          console.log('  User:', user);
          console.log('  Amount:', ethers.formatEther(amount));

          // Check if claim already exists
          const existingClaim = await Claim.findOne({
            txHash: event.log.transactionHash,
          });

          if (existingClaim) {
            console.log('Claim already exists, skipping...');
            return;
          }

          // Save claim to database
          const claim = new Claim({
            userWallet: user.toLowerCase(),
            amount: parseFloat(ethers.formatEther(amount)),
            txHash: event.log.transactionHash,
          });

          await claim.save();
          console.log('Claim saved to database');
        } catch (error) {
          console.error('Error processing TokensClaimed event:', error);
        }
      });

      this.isListening = true;
      this.retryCount = 0;
      console.log('Event listener started successfully');
    } catch (error) {
      console.error('Failed to start event listener:', error.message);

      if (error.message && (error.message.includes('quota') || error.message.includes('project ID exceeded'))) {
        console.error('RPC quota exceeded. Event listener will be disabled.');
        return;
      }

      if (error.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
        console.error('RPC authentication failed. Event listener will be disabled.');
        return;
      }

      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`Retrying event listener in ${this.retryDelay / 1000} seconds... (Attempt ${this.retryCount}/${this.maxRetries})`);
        setTimeout(() => this.startListening(), this.retryDelay);
      } else {
        console.error('Max retries exceeded. Event listener will not start.');
      }
    }
  }

  stopListening() {
    if (this.icoContract) {
      this.icoContract.removeAllListeners('PurchaseRecorded');
      this.icoContract.removeAllListeners('TokensClaimed');
    }
    this.isListening = false;
    console.log('Event listener stopped');
  }
}

// Create singleton instance
const eventListener = new EventListener();

module.exports = eventListener;
