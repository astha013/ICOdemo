import { useState, useEffect } from 'react';
import { getICOContract, formatTokenAmount, parseETH } from '../web3/contracts';
import { savePurchase } from '../api/axios';
import RoundCard from '../components/RoundCard';
import Loader from '../components/Loader';
import { ROUND_NAMES, TOTAL_ROUNDS } from '../constants/rounds';

const BuyTokens = ({ walletAddress }) => {
  const [rounds, setRounds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [buyingRound, setBuyingRound] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchRounds();
  }, []);

  const fetchRounds = async () => {
    setIsLoading(true);
    setError('');

    try {
      const icoContract = await getICOContract();
      const roundsData = [];

      // Fetch ETH/USD rate from contract
      const ethUsdRate = await icoContract.ETH_USD_RATE();

      for (let i = 0; i < TOTAL_ROUNDS; i++) {
        const roundInfo = await icoContract.getRoundInfo(i);
        roundsData.push({
          tokens: roundInfo.tokens,
          priceUSD: roundInfo.priceUSD,
          tokensLeft: roundInfo.tokensLeft,
          category: roundInfo.category,
          ethUsdRate: ethUsdRate,
        });
      }

      setRounds(roundsData);
    } catch (err) {
      setError(err.message || 'Failed to fetch rounds');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuy = async (roundIndex, ethAmount) => {
    setBuyingRound(roundIndex);
    setError('');
    setSuccess('');

    try {
      const icoContract = await getICOContract(true);
      const tx = await icoContract.buyTokens(roundIndex, {
        value: parseETH(ethAmount),
      });

      const receipt = await tx.wait();

      // Save purchase to backend
      try {
        await savePurchase(
          walletAddress,
          roundIndex,
          ethAmount,
          receipt.hash
        );
      } catch (apiError) {
        console.error('Failed to save purchase:', apiError);
        // Show warning but continue
        setError('Purchase successful but failed to save to server. Transaction: ' + receipt.hash);
      }

      setSuccess(`Successfully purchased tokens! Transaction: ${receipt.hash}`);

      // Refresh rounds data
      await fetchRounds();
    } catch (err) {
      setError(err.message || 'Failed to buy tokens');
    } finally {
      setBuyingRound(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader message="Loading rounds..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Buy Tokens</h1>
        <p className="text-dark-400">
          Participate in the ICO by purchasing tokens in any available round.
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 bg-red-900/20 border border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-400">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-900/20 border border-green-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-green-400">{success}</span>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="mb-8 card">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-primary-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-1">How to Buy Tokens</h3>
            <p className="text-dark-400 text-sm">
              Select a round, enter the amount of ETH you want to spend, and click "Buy Tokens".
              The transaction will be processed on the Sepolia test network. Make sure you have enough ETH for gas fees.
            </p>
          </div>
        </div>
      </div>

      {/* Rounds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {rounds.map((round, index) => (
          <RoundCard
            key={index}
            round={round}
            roundIndex={index}
            onBuy={handleBuy}
            isLoading={buyingRound === index}
          />
        ))}
      </div>

      {/* ETH/USD Rate Info */}
      <div className="mt-8 card">
        <h3 className="text-lg font-semibold text-white mb-4">Pricing Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-dark-400">ETH/USD Rate (Fixed)</span>
            <span className="text-white font-semibold">${rounds[0]?.ethUsdRate ? parseFloat(formatTokenAmount(rounds[0].ethUsdRate)).toLocaleString() : '3,000'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-dark-400">Network</span>
            <span className="text-green-400 font-medium">Sepolia Testnet</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-dark-400">Token Symbol</span>
            <span className="text-white font-semibold">PTK</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyTokens;
