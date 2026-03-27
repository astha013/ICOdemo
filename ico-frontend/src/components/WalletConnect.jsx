import { useState } from 'react';
import { connectWallet } from '../web3/provider';
import { saveWalletAddress } from '../api/axios';
import { shortenAddress } from '../utils/address';

const WalletConnect = ({ onConnect, walletAddress }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');

    try {
      const address = await connectWallet();
      
      // Save wallet address to backend
      try {
        await saveWalletAddress(address);
      } catch (apiError) {
        console.error('Failed to save wallet address:', apiError);
        // Show warning but continue
        setError('Wallet connected but failed to sync with server. Some features may not work properly.');
      }

      onConnect(address);
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  if (walletAddress) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-dark-800 px-4 py-2 rounded-lg border border-dark-700">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-white font-mono">{shortenAddress(walletAddress)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConnecting ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Connect MetaMask</span>
          </>
        )}
      </button>

      {error && (
        <div className="text-red-400 text-sm bg-red-900/20 px-4 py-2 rounded-lg border border-red-800">
          {error}
        </div>
      )}

      <p className="text-dark-400 text-sm">
        Connect your wallet to participate in the ICO
      </p>
    </div>
  );
};

export default WalletConnect;
