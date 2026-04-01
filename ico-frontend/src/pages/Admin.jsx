import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminStats, getAllPurchases } from '../api/axios';
import { getICOContract } from '../web3/contracts';
import Loader from '../components/Loader';
import { shortenAddress, shortenTxHash } from '../utils/address';

const Admin = ({ walletAddress }) => {
  const [stats, setStats] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
  }, [walletAddress]);

  const checkAdminAccess = async () => {
    try {
      // Check if wallet is admin by calling the contract
      const icoContract = await getICOContract();
      const owner = await icoContract.owner();
      const isOwner = owner.toLowerCase() === walletAddress.toLowerCase();
      setIsAdmin(isOwner);
      
      if (isOwner) {
        fetchAdminData();
      } else {
        setError('Unauthorized: Admin access required');
        setIsLoading(false);
        // Redirect to dashboard after 1 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      }
    } catch (err) {
      setError('Failed to verify admin access');
      setIsLoading(false);
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }
  };

  const fetchAdminData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [statsData, purchasesData] = await Promise.all([
        getAdminStats(walletAddress),
        getAllPurchases(walletAddress),
      ]);

      setStats(statsData);
      setPurchases(purchasesData || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch admin data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader message="Loading admin data..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-dark-400">
          View ICO statistics and purchase history.
        </p>
      </div>

      {/* Error Message */}
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

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total ETH Raised */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-dark-400 text-sm">Total ETH Raised</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats.totalETH || '0'} ETH
            </div>
            <div className="text-dark-400 text-sm">Sepolia Testnet</div>
          </div>

          {/* Total Purchases */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-dark-400 text-sm">Total Purchases</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats.totalPurchases || '0'}
            </div>
            <div className="text-dark-400 text-sm">Transactions</div>
          </div>

          {/* Unique Users */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className="text-dark-400 text-sm">Unique Users</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats.uniqueUsers || '0'}
            </div>
            <div className="text-dark-400 text-sm">Wallets</div>
          </div>

          {/* Total Tokens Sold */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-600/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-dark-400 text-sm">Total Tokens Sold</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats.totalTokens || '0'}
            </div>
            <div className="text-dark-400 text-sm">PTK</div>
          </div>
        </div>
      )}

      {/* Purchases Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">All Purchases</h2>
          <button
            onClick={fetchAdminData}
            className="btn-secondary flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>

        {purchases.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2">No Purchases Yet</h3>
            <p className="text-dark-400">
              No token purchases have been made yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left py-3 px-4 text-dark-400 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-dark-400 font-medium">User</th>
                  <th className="text-left py-3 px-4 text-dark-400 font-medium">Round</th>
                  <th className="text-left py-3 px-4 text-dark-400 font-medium">Amount (ETH)</th>
                  <th className="text-left py-3 px-4 text-dark-400 font-medium">Transaction</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase, index) => (
                  <tr key={index} className="border-b border-dark-700/50 hover:bg-dark-900/50">
                    <td className="py-3 px-4 text-white">
                      {formatDate(purchase.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <a
                        href={`https://sepolia.etherscan.io/address/${purchase.userWallet}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-400 hover:text-primary-300 font-mono text-sm"
                      >
                        {shortenAddress(purchase.userWallet)}
                      </a>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-primary-600/20 text-primary-400 rounded text-sm">
                        {purchase.roundName || `Round ${purchase.round}`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white font-semibold">
                      {purchase.ethAmount} ETH
                    </td>
                    <td className="py-3 px-4">
                      <a
                        href={`https://sepolia.etherscan.io/tx/${purchase.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-400 hover:text-primary-300 font-mono text-sm"
                      >
                        {shortenTxHash(purchase.txHash)}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
