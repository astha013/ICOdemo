import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTokenContract, getVestingContract, formatTokenAmount } from '../web3/contracts';
import Loader from '../components/Loader';

const Dashboard = ({ walletAddress }) => {
  const [tokenBalance, setTokenBalance] = useState('0');
  const [totalVested, setTotalVested] = useState('0');
  const [claimable, setClaimable] = useState('0');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (walletAddress) {
      fetchDashboardData();
    }
  }, [walletAddress]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Fetch token balance
      const tokenContract = await getTokenContract();
      const balance = await tokenContract.balanceOf(walletAddress);
      setTokenBalance(formatTokenAmount(balance));

      // Fetch vesting data
      const vestingContract = await getVestingContract();
      
      // Get claimable amount
      const claimableAmount = await vestingContract.claimableAmount(walletAddress);
      setClaimable(formatTokenAmount(claimableAmount));

      // Get total vested by iterating through vestings
      let totalVestedAmount = 0n;
      let index = 0;
      
      while (true) {
        try {
          const vesting = await vestingContract.userVestings(walletAddress, index);
          if (vesting.total === 0n) break;
          totalVestedAmount += vesting.total;
          index++;
        } catch {
          break;
        }
      }
      
      setTotalVested(formatTokenAmount(totalVestedAmount));
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader message="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-red-400 mb-4">{error}</div>
          <button onClick={fetchDashboardData} className="btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-dark-400">Welcome back! Here's your token overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Token Balance */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-dark-400 text-sm">Token Balance</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {parseFloat(tokenBalance).toLocaleString()}
          </div>
          <div className="text-dark-400 text-sm">PTK</div>
        </div>

        {/* Total Vested */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span className="text-dark-400 text-sm">Total Vested</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {parseFloat(totalVested).toLocaleString()}
          </div>
          <div className="text-dark-400 text-sm">PTK</div>
        </div>

        {/* Claimable */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-dark-400 text-sm">Claimable Now</span>
          </div>
          <div className="text-3xl font-bold text-green-400 mb-1">
            {parseFloat(claimable).toLocaleString()}
          </div>
          <div className="text-dark-400 text-sm">PTK</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/buy"
            className="flex items-center space-x-3 p-4 bg-dark-900/50 rounded-lg border border-dark-700 hover:border-primary-500/50 transition-colors"
          >
            <div className="w-10 h-10 bg-primary-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-white font-medium">Buy Tokens</div>
              <div className="text-dark-400 text-sm">Participate in ICO</div>
            </div>
          </Link>

          <Link
            to="/vesting"
            className="flex items-center space-x-3 p-4 bg-dark-900/50 rounded-lg border border-dark-700 hover:border-primary-500/50 transition-colors"
          >
            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <div className="text-white font-medium">View Vesting</div>
              <div className="text-dark-400 text-sm">Check vesting schedule</div>
            </div>
          </Link>

          <Link
            to="/history"
            className="flex items-center space-x-3 p-4 bg-dark-900/50 rounded-lg border border-dark-700 hover:border-primary-500/50 transition-colors"
          >
            <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <div className="text-white font-medium">History</div>
              <div className="text-dark-400 text-sm">View transactions</div>
            </div>
          </Link>

          <Link
            to="/admin"
            className="flex items-center space-x-3 p-4 bg-dark-900/50 rounded-lg border border-dark-700 hover:border-primary-500/50 transition-colors"
          >
            <div className="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <div className="text-white font-medium">Admin</div>
              <div className="text-dark-400 text-sm">View statistics</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Wallet Info */}
      <div className="mt-8 card">
        <h2 className="text-xl font-semibold text-white mb-4">Wallet Information</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-dark-400">Address</span>
            <span className="text-white font-mono text-sm">{walletAddress}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-dark-400">Network</span>
            <span className="text-green-400 font-medium">Sepolia Testnet</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
