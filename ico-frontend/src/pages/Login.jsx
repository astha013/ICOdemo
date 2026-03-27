import { useNavigate } from 'react-router-dom';
import WalletConnect from '../components/WalletConnect';

const Login = ({ onConnect }) => {
  const navigate = useNavigate();

  const handleConnect = (address) => {
    onConnect(address);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-primary-600 to-primary-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-3xl">ICO</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Token Sale DApp</h1>
          <p className="text-dark-400">
            Connect your wallet to participate in the ICO
          </p>
        </div>

        {/* Connect Card */}
        <div className="card">
          <WalletConnect onConnect={handleConnect} walletAddress={null} />
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-dark-800 rounded-lg flex items-center justify-center mx-auto mb-2 border border-dark-700">
              <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-dark-400 text-sm">Secure</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-dark-800 rounded-lg flex items-center justify-center mx-auto mb-2 border border-dark-700">
              <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-dark-400 text-sm">Fast</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-dark-800 rounded-lg flex items-center justify-center mx-auto mb-2 border border-dark-700">
              <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-dark-400 text-sm">Verified</p>
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 text-center">
          <p className="text-dark-500 text-sm">
            Make sure you're connected to the Sepolia test network
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
