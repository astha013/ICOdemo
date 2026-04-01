import { useState, useEffect } from 'react';
import { getVestingContract, formatTokenAmount } from '../web3/contracts';
import { saveClaim } from '../api/axios';
import VestingCard from '../components/VestingCard';
import Loader from '../components/Loader';

const Vesting = ({ walletAddress }) => {
  const [vestings, setVestings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claimingIndex, setClaimingIndex] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (walletAddress) {
      fetchVestings();
    }
  }, [walletAddress]);

  const fetchVestings = async () => {
    setIsLoading(true);
    setError('');

    try {
      const vestingContract = await getVestingContract();
      const vestingsData = [];
      let index = 0;

      while (true) {
        try {
          const vesting = await vestingContract.userVestings(walletAddress, index);
          if (vesting.total === 0n) break;

          // Calculate claimable amount for this specific vesting
          const now = Math.floor(Date.now() / 1000);
          const start = Number(vesting.start);
          const cliff = Number(vesting.cliff);
          const duration = Number(vesting.duration);
          const total = Number(vesting.total);
          const claimed = Number(vesting.claimed);
          
          let claimable = 0n;
          if (now >= start + cliff) {
            if (now >= start + duration) {
              // Vesting complete
              claimable = vesting.total - vesting.claimed;
            } else {
              // Linear vesting
              const elapsed = now - start - cliff;
              const vested = (BigInt(elapsed) * vesting.total) / BigInt(duration - cliff);
              claimable = vested - vesting.claimed;
            }
          }

          vestingsData.push({
            total: vesting.total,
            claimed: vesting.claimed,
            start: vesting.start,
            cliff: vesting.cliff,
            duration: vesting.duration,
            category: Number(vesting.category), // Use actual category from contract
            claimable: claimable,
          });

          index++;
        } catch (error) {
          // Expected error when no more vestings exist at this index
          break;
        }
      }

      setVestings(vestingsData);
    } catch (err) {
      setError(err.message || 'Failed to fetch vestings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaim = async (index) => {
    setClaimingIndex(index);
    setError('');
    setSuccess('');

    try {
      const vestingContract = await getVestingContract(true);
      const tx = await vestingContract.claimTokens();
      const receipt = await tx.wait();

      // Use the claimable amount from the vesting data we already have
      const claimableAmount = vestings[index]?.claimable || 0n;

      // Save claim to backend
      try {
        await saveClaim(
          formatTokenAmount(claimableAmount),
          receipt.hash
        );
      } catch (apiError) {
        console.error('Failed to save claim:', apiError);
        // Show warning but continue
        setError('Claim successful but failed to save to server. Transaction: ' + receipt.hash);
      }

      setSuccess(`Successfully claimed tokens! Transaction: ${receipt.hash}`);

      // Refresh vestings data
      await fetchVestings();
    } catch (err) {
      setError(err.message || 'Failed to claim tokens');
    } finally {
      setClaimingIndex(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader message="Loading vestings..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Vesting</h1>
        <p className="text-dark-400">
          View your token vesting schedules and claim available tokens.
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

      {/* Summary Card */}
      <div className="mb-8 card">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-1">How Vesting Works</h3>
            <p className="text-dark-400 text-sm">
              Tokens are locked according to the vesting schedule. After the cliff period ends,
              tokens become claimable linearly over the vesting duration. Click "Claim Tokens" to
              transfer available tokens to your wallet.
            </p>
          </div>
        </div>
      </div>

      {/* Vestings Grid */}
      {vestings.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-white font-semibold mb-2">No Vestings Found</h3>
          <p className="text-dark-400">
            You don't have any token vestings yet. Purchase tokens in the ICO to get started.
          </p>
          <a href="/buy" className="btn-primary inline-block mt-4">
            Buy Tokens
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vestings.map((vesting, index) => (
            <VestingCard
              key={index}
              vesting={vesting}
              index={index}
              onClaim={handleClaim}
              isLoading={claimingIndex === index}
            />
          ))}
        </div>
      )}

      {/* Vesting Info */}
      <div className="mt-8 card">
        <h3 className="text-lg font-semibold text-white mb-4">Vesting Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-dark-900/50 rounded-lg p-4 border border-dark-700">
            <div className="text-white font-medium mb-1">PreSeed, Seed, Strategic</div>
            <div className="text-dark-400 text-sm">3 months cliff, 24 months duration</div>
          </div>
          <div className="bg-dark-900/50 rounded-lg p-4 border border-dark-700">
            <div className="text-white font-medium mb-1">Public Sale</div>
            <div className="text-dark-400 text-sm">Instant transfer, no vesting</div>
          </div>
          <div className="bg-dark-900/50 rounded-lg p-4 border border-dark-700">
            <div className="text-white font-medium mb-1">Founders, Advisors</div>
            <div className="text-dark-400 text-sm">12 months cliff, 24 months duration</div>
          </div>
          <div className="bg-dark-900/50 rounded-lg p-4 border border-dark-700">
            <div className="text-white font-medium mb-1">Ecosystem</div>
            <div className="text-dark-400 text-sm">1 month cliff, 24 months duration</div>
          </div>
          <div className="bg-dark-900/50 rounded-lg p-4 border border-dark-700">
            <div className="text-white font-medium mb-1">Treasury</div>
            <div className="text-dark-400 text-sm">1 month cliff, 12 months duration</div>
          </div>
          <div className="bg-dark-900/50 rounded-lg p-4 border border-dark-700">
            <div className="text-white font-medium mb-1">Partnerships</div>
            <div className="text-dark-400 text-sm">3 months cliff, 12 months duration</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Vesting;
