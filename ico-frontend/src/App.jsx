import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BuyTokens from './pages/BuyTokens';
import Vesting from './pages/Vesting';
import History from './pages/History';
import Admin from './pages/Admin';
import { getTokenContract, formatTokenAmount } from './web3/contracts';
import { listenToAccountChanges } from './web3/provider';

function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [tokenBalance, setTokenBalance] = useState('0');

  useEffect(() => {
    // Listen for account changes
    listenToAccountChanges((address) => {
      if (address) {
        setWalletAddress(address);
        fetchTokenBalance(address);
      } else {
        setWalletAddress(null);
        setTokenBalance('0');
      }
    });

    // Check if already connected
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            fetchTokenBalance(accounts[0]);
          }
        } catch (error) {
          console.error('Failed to check wallet connection:', error);
        }
      }
    };
    checkConnection();
  }, []);

  const fetchTokenBalance = async (address) => {
    try {
      const tokenContract = await getTokenContract();
      const balance = await tokenContract.balanceOf(address);
      setTokenBalance(formatTokenAmount(balance));
    } catch (error) {
      console.error('Failed to fetch token balance:', error);
    }
  };

  const handleConnect = (address) => {
    setWalletAddress(address);
    fetchTokenBalance(address);
  };

  return (
    <Router>
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
          {walletAddress && (
            <Navbar walletAddress={walletAddress} tokenBalance={tokenBalance} />
          )}
          
          <Routes>
            <Route
              path="/"
              element={
                walletAddress ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Login onConnect={handleConnect} />
                )
              }
            />
            <Route
              path="/dashboard"
              element={
                walletAddress ? (
                  <Dashboard walletAddress={walletAddress} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/buy"
              element={
                walletAddress ? (
                  <BuyTokens walletAddress={walletAddress} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/vesting"
              element={
                walletAddress ? (
                  <Vesting walletAddress={walletAddress} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/history"
              element={
                walletAddress ? (
                  <History walletAddress={walletAddress} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/admin"
              element={
                walletAddress ? (
                  <Admin walletAddress={walletAddress} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
          </Routes>
        </div>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
