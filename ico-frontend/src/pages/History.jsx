import { useState, useEffect } from 'react';
import { getPurchases, getClaims } from '../api/axios';
import Loader from '../components/Loader';
import { shortenTxHash } from '../utils/address';
import { ROUND_NAMES } from '../constants/rounds';

const History = ({ walletAddress }) => {
  const [purchases, setPurchases] = useState([]);
  const [claims, setClaims] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('purchases');

  useEffect(() => {
    if (walletAddress) {
      fetchHistory();
    }
  }, [walletAddress]);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [purchasesData, claimsData] = await Promise.all([
        getPurchases(walletAddress),
        getClaims(walletAddress),
      ]);

      setPurchases(purchasesData || []);
      setClaims(claimsData || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch history');
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
        <Loader message="Loading history..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Transaction History</h1>
        <p className="text-dark-400">
          View your purchase and claim history.
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

      {/* Tabs */}
      <div className="mb-6 flex space-x-4 border-b border-dark-700">
        <button
          onClick={() => setActiveTab('purchases')}
          className={`pb-4 px-2 text-sm font-medium transition-colors ${
            activeTab === 'purchases'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-dark-400 hover:text-white'
          }`}
        >
          Purchases ({purchases.length})
        </button>
        <button
          onClick={() => setActiveTab('claims')}
          className={`pb-4 px-2 text-sm font-medium transition-colors ${
            activeTab === 'claims'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-dark-400 hover:text-white'
          }`}
        >
          Claims ({claims.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'purchases' && (
        <div className="card">
          {purchases.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">No Purchases Yet</h3>
              <p className="text-dark-400">
                You haven't made any token purchases yet.
              </p>
              <a href="/buy" className="btn-primary inline-block mt-4">
                Buy Tokens
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="text-left py-3 px-4 text-dark-400 font-medium">Date</th>
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
                        <span className="px-2 py-1 bg-primary-600/20 text-primary-400 rounded text-sm">
                          {ROUND_NAMES[purchase.roundIndex] || `Round ${purchase.roundIndex}`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white font-semibold">
                        {purchase.amount} ETH
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
      )}

      {activeTab === 'claims' && (
        <div className="card">
          {claims.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">No Claims Yet</h3>
              <p className="text-dark-400">
                You haven't claimed any tokens yet.
              </p>
              <a href="/vesting" className="btn-primary inline-block mt-4">
                View Vesting
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="text-left py-3 px-4 text-dark-400 font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-dark-400 font-medium">Amount (PTK)</th>
                    <th className="text-left py-3 px-4 text-dark-400 font-medium">Transaction</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim, index) => (
                    <tr key={index} className="border-b border-dark-700/50 hover:bg-dark-900/50">
                      <td className="py-3 px-4 text-white">
                        {formatDate(claim.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-green-400 font-semibold">
                        {parseFloat(claim.amount).toLocaleString()} PTK
                      </td>
                      <td className="py-3 px-4">
                        <a
                          href={`https://sepolia.etherscan.io/tx/${claim.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-400 hover:text-primary-300 font-mono text-sm"
                        >
                          {shortenTxHash(claim.txHash)}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Refresh Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={fetchHistory}
          className="btn-secondary flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
};

export default History;
