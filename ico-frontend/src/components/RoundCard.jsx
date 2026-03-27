import { useState } from 'react';
import { formatTokenAmount, formatETH } from '../web3/contracts';
import { ROUND_NAMES, ROUND_COLORS } from '../constants/rounds';

const RoundCard = ({ round, roundIndex, onBuy, isLoading }) => {
  const [ethAmount, setEthAmount] = useState('');
  const [error, setError] = useState('');

  const handleBuy = () => {
    const amount = parseFloat(ethAmount);
    if (isNaN(amount) || amount <= 0 || amount > 1000) {
      setError('Please enter a valid ETH amount (0-1000)');
      return;
    }
    // Validate decimal precision (max 18 decimals for ETH)
    const decimalPlaces = (ethAmount.split('.')[1] || '').length;
    if (decimalPlaces > 18) {
      setError('ETH amount has too many decimal places (max 18)');
      return;
    }
    setError('');
    onBuy(roundIndex, ethAmount);
  };

  const calculateTokens = (eth) => {
    if (!eth || !round.priceUSD || !round.ethUsdRate) return '0';
    const ethValue = parseFloat(eth);
    const ethUsdRate = parseFloat(formatTokenAmount(round.ethUsdRate));
    const priceUsd = parseFloat(formatTokenAmount(round.priceUSD));
    const tokens = (ethValue * ethUsdRate) / priceUsd;
    return tokens.toFixed(2);
  };

  return (
    <div className="card hover:border-primary-500/50 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${ROUND_COLORS[roundIndex]} text-white text-sm font-semibold`}>
          {ROUND_NAMES[roundIndex]}
        </div>
        <div className="text-dark-400 text-sm">
          Round {roundIndex + 1}
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-dark-400">Price per Token</span>
          <span className="text-white font-semibold">
            ${parseFloat(formatTokenAmount(round.priceUSD)).toFixed(4)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-dark-400">Tokens Left</span>
          <span className="text-white font-semibold">
            {parseFloat(formatTokenAmount(round.tokensLeft)).toLocaleString()} PTK
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-dark-400">Total Tokens</span>
          <span className="text-white font-semibold">
            {parseFloat(formatTokenAmount(round.tokens)).toLocaleString()} PTK
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-dark-400">Sold</span>
          <span className="text-white">
            {((parseFloat(formatTokenAmount(round.tokens)) - parseFloat(formatTokenAmount(round.tokensLeft))) / parseFloat(formatTokenAmount(round.tokens)) * 100).toFixed(1)}%
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{
              width: `${((parseFloat(formatTokenAmount(round.tokens)) - parseFloat(formatTokenAmount(round.tokensLeft))) / parseFloat(formatTokenAmount(round.tokens))) * 100}%`
            }}
          ></div>
        </div>
      </div>

      {/* Buy Section */}
      <div className="space-y-4">
        <div>
          <label className="block text-dark-400 text-sm mb-2">ETH Amount</label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.0"
            value={ethAmount}
            onChange={(e) => setEthAmount(e.target.value)}
            className="input"
            disabled={isLoading}
          />
          {error && (
            <p className="text-red-400 text-sm mt-1">{error}</p>
          )}
        </div>

        {ethAmount && (
          <div className="bg-dark-900/50 rounded-lg p-3 border border-dark-700">
            <div className="flex justify-between text-sm">
              <span className="text-dark-400">You will receive</span>
              <span className="text-white font-semibold">
                {calculateTokens(ethAmount)} PTK
              </span>
            </div>
          </div>
        )}

        <button
          onClick={handleBuy}
          disabled={isLoading || !ethAmount || parseFloat(ethAmount) <= 0}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Buy Tokens</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default RoundCard;
