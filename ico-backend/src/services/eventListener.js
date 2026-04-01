const { ethers } = require('ethers');
const Purchase = require('../models/Purchase');
const Claim = require('../models/Claim');

// ICO ABI (only events we need)
const ICO_ABI = [
  'event TokensPurchased(address indexed user, uint256 amount, uint256 round)',
];

// Vesting ABI (only events we need)
const VESTING_ABI = [
  'event TokensClaimed(address indexed user, uint256 amount)',
];

// Round names mapping
const ROUND_NAMES = {
  0: 'PreSeed',
  1: 'Seed',
  2: 'Strategic',
  3: 'Public',
};

// Token prices in USD (with 18 decimals)
const TOKEN_PRICES = {
  0: 0.067, // PreSeed
  1: 0.089, // Seed
  2: 0.111, // Strategic
  3: 0.133, // Public
};

class EventListener {
  constructor() {
    this.provider = null;
    this.icoContract = null;
    this.vestingContract = null;
    this.isListening = false;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
  }

  async initialize() {
    try {
      // Validate environment variables
      if (!process.env.RPC_WSS) {
        throw new Error('RPC_WSS not configured');
      }
      if (!process.env.ICO_ADDRESS) {
        throw new Error('ICO_ADDRESS not configured');
      }
      if (!process.env.VESTING_ADDRESS) {
        throw new Error('VESTING_ADDRESS not configured');
      }

      // Create WebSocket provider for event subscriptions
      this.provider = new ethers.WebSocketProvider(process.env.RPC_WSS);

      // Handle WebSocket errors
      this.provider.websocket.on('error', (error) => {
        console.error('WebSocket error:', error.message);
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          console.error('WebSocket authentication failed. Please check your RPC_WSS URL and credentials.');
          console.error('To fix this issue:');
          console.error('1. Verify your Infura project ID is correct');
          console.error('2. Check if your Infura project has WebSocket access enabled');
          console.error('3. Or use an alternative RPC provider like Alchemy, QuickNode, or a local node');
        }
      });

      // Create contract instances
      this.icoContract = new ethers.Contract(
        process.env.ICO_ADDRESS,
        ICO_ABI,
        this.provider
      );

      this.vestingContract = new ethers.Contract(
        process.env.VESTING_ADDRESS,
        VESTING_ABI,
        this.provider
      );

      console.log('Event listener initialized successfully');
      console.log('ICO Address:', process.env.ICO_ADDRESS);
      console.log('Vesting Address:', process.env.VESTING_ADDRESS);
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

      // Listen to TokensPurchased event
      this.icoContract.on('TokensPurchased', async (user, amount, round, event) => {
        try {
          console.log('TokensPurchased event detected:');
          console.log('  User:', user);
          console.log('  Amount:', ethers.formatUnits(amount, 18));
          console.log('  Round:', round.toString());
          console.log('  TxHash:', event.log.transactionHash);

          // Calculate ETH amount from token amount
          // Formula: ethAmount = (tokenAmount * priceUSD) / ETH_USD_RATE
          // For simplicity, we'll store token amount and let frontend calculate ETH
          const tokenAmount = parseFloat(ethers.formatUnits(amount, 18));
          const roundIndex = Number(round);

          // Get round name and token price
          const roundName = ROUND_NAMES[roundIndex] || `Round ${roundIndex}`;
          const tokenPrice = TOKEN_PRICES[roundIndex] || 0;

          // Check if purchase already exists (avoid duplicates)
          const existingPurchase = await Purchase.findOne({
            txHash: event.log.transactionHash,
          });

          if (existingPurchase) {
            console.log('Purchase already exists, skipping...');
            return;
          }

          // Save purchase to database with normalized wallet address
          const purchase = new Purchase({
            userWallet: user.toLowerCase(), // Normalize to lowercase
            round: roundIndex,
            roundName: roundName,
            ethAmount: 0, // Will be calculated by frontend or from event data
            tokenAmount: tokenAmount,
            tokenPrice: tokenPrice,
            txHash: event.log.transactionHash,
            timestamp: new Date(),
          });

          await purchase.save();
          console.log('Purchase saved to database');
        } catch (error) {
          console.error('Error processing TokensPurchased event:', error);
        }
      });

      // Listen to TokensClaimed event
      this.vestingContract.on('TokensClaimed', async (user, amount, event) => {
        try {
          console.log('TokensClaimed event detected:');
          console.log('  User:', user);
          console.log('  Amount:', ethers.formatUnits(amount, 18));
          console.log('  TxHash:', event.log.transactionHash);

          const claimAmount = parseFloat(ethers.formatUnits(amount, 18));

          // Check if claim already exists (avoid duplicates)
          const existingClaim = await Claim.findOne({
            txHash: event.log.transactionHash,
          });

          if (existingClaim) {
            console.log('Claim already exists, skipping...');
            return;
          }

          // Save claim to database with normalized wallet address
          const claim = new Claim({
            userWallet: user.toLowerCase(), // Normalize to lowercase
            amount: claimAmount,
            txHash: event.log.transactionHash,
            timestamp: new Date(),
          });

          await claim.save();
          console.log('Claim saved to database');
        } catch (error) {
          console.error('Error processing TokensClaimed event:', error);
        }
      });

      this.isListening = true;
      this.retryCount = 0; // Reset retry count on success
      console.log('Event listener started successfully');
    } catch (error) {
      console.error('Failed to start event listener:', error.message);
      
      // Check if it's a quota error
      if (error.message && (error.message.includes('quota') || error.message.includes('project ID exceeded'))) {
        console.error('RPC quota exceeded. Event listener will be disabled.');
        console.error('To fix this issue:');
        console.error('1. Upgrade your Infura plan at https://infura.io/pricing');
        console.error('2. Or use an alternative RPC provider like Alchemy, QuickNode, or a local node');
        console.error('3. Or set up your own Ethereum node');
        // Don't throw - allow server to start without event listener
        return;
      }
      
      // Check if it's an authentication error
      if (error.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
        console.error('WebSocket authentication failed. Event listener will be disabled.');
        console.error('To fix this issue:');
        console.error('1. Verify your Infura project ID is correct');
        console.error('2. Check if your Infura project has WebSocket access enabled');
        console.error('3. Or use an alternative RPC provider like Alchemy, QuickNode, or a local node');
        // Don't throw - allow server to start without event listener
        return;
      }
      
      // For other errors, retry if we haven't exceeded max retries
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`Retrying event listener in ${this.retryDelay / 1000} seconds... (Attempt ${this.retryCount}/${this.maxRetries})`);
        setTimeout(() => this.startListening(), this.retryDelay);
      } else {
        console.error('Max retries exceeded. Event listener will not start.');
        // Don't throw - allow server to start without event listener
      }
    }
  }

  stopListening() {
    if (this.icoContract) {
      this.icoContract.removeAllListeners('TokensPurchased');
    }
    if (this.vestingContract) {
      this.vestingContract.removeAllListeners('TokensClaimed');
    }
    if (this.provider) {
      this.provider.websocket.close();
    }
    this.isListening = false;
    console.log('Event listener stopped');
  }
}

// Create singleton instance
const eventListener = new EventListener();

module.exports = eventListener;
