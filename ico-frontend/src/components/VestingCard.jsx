import { formatTokenAmount } from '../web3/contracts';

const VestingCard = ({ vesting, index, onClaim, isLoading }) => {
  const categoryNames = [
    'PreSeed',
    'Seed',
    'Strategic',
    'PublicSale',
    'Founders',
    'Ecosystem',
    'Advisors',
    'Treasury',
    'Partnerships',
  ];

  const categoryColors = [
    'from-purple-600 to-purple-400',
    'from-blue-600 to-blue-400',
    'from-green-600 to-green-400',
    'from-orange-600 to-orange-400',
    'from-pink-600 to-pink-400',
    'from-cyan-600 to-cyan-400',
    'from-yellow-600 to-yellow-400',
    'from-red-600 to-red-400',
    'from-indigo-600 to-indigo-400',
  ];

  const total = parseFloat(formatTokenAmount(vesting.total));
  const claimed = parseFloat(formatTokenAmount(vesting.claimed));
  const claimable = parseFloat(formatTokenAmount(vesting.claimable));
  const progress = total > 0 ? ((claimed + claimable) / total) * 100 : 0;

  const formatDate = (timestamp) => {
    if (!timestamp || timestamp === 0n) return 'N/A';
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString();
  };

  const getTimeRemaining = () => {
    if (!vesting.start || !vesting.cliff || !vesting.duration) return 'N/A';
    
    const now = Math.floor(Date.now() / 1000);
    const start = Number(vesting.start);
    const cliff = Number(vesting.cliff);
    const duration = Number(vesting.duration);
    
    const cliffEnd = start + cliff;
    const vestingEnd = start + duration;
    
    if (now < cliffEnd) {
      const remaining = cliffEnd - now;
      const days = Math.ceil(remaining / 86400);
      return `${days} days until cliff`;
    } else if (now < vestingEnd) {
      const remaining = vestingEnd - now;
      const days = Math.ceil(remaining / 86400);
      return `${days} days remaining`;
    } else {
      return 'Vesting complete';
    }
  };

  return (
    <div className="card hover:border-primary-500/50 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${categoryColors[vesting.category] || 'from-gray-600 to-gray-400'} text-white text-sm font-semibold`}>
          {categoryNames[vesting.category] || 'Unknown'}
        </div>
        <div className="text-dark-400 text-sm">
          Vesting #{index + 1}
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-dark-400">Total Allocated</span>
          <span className="text-white font-semibold">
            {total.toLocaleString()} PTK
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-dark-400">Claimed</span>
          <span className="text-white font-semibold">
            {claimed.toLocaleString()} PTK
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-dark-400">Claimable Now</span>
          <span className="text-green-400 font-semibold">
            {claimable.toLocaleString()} PTK
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-dark-400">Start Date</span>
          <span className="text-white font-semibold">
            {formatDate(vesting.start)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-dark-400">Status</span>
          <span className="text-white font-semibold">
            {getTimeRemaining()}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-dark-400">Progress</span>
          <span className="text-white">{progress.toFixed(1)}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Claim Button */}
      <button
        onClick={() => onClaim(index)}
        disabled={isLoading || claimable <= 0}
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
            <span>Claim Tokens</span>
          </>
        )}
      </button>
    </div>
  );
};

export default VestingCard;
