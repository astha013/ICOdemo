import { Link, useLocation } from 'react-router-dom';
import { shortenAddress } from '../utils/address';

const Navbar = ({ walletAddress, tokenBalance }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/buy', label: 'Buy Tokens' },
    { path: '/vesting', label: 'Vesting' },
    { path: '/history', label: 'History' },
    { path: '/admin', label: 'Admin' },
  ];

  return (
    <nav className="bg-dark-900/80 backdrop-blur-md border-b border-dark-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-primary-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">ICO</span>
              </div>
              <span className="text-white font-bold text-xl hidden sm:block">Token Sale</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive(link.path)
                      ? 'bg-primary-600 text-white'
                      : 'text-dark-300 hover:bg-dark-700 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Wallet Info */}
          <div className="flex items-center space-x-4">
            {tokenBalance && (
              <div className="hidden sm:flex items-center space-x-2 bg-dark-800 px-3 py-1.5 rounded-lg border border-dark-700">
                <span className="text-dark-400 text-sm">Balance:</span>
                <span className="text-white font-semibold">{parseFloat(tokenBalance).toFixed(2)} PTK</span>
              </div>
            )}
            {walletAddress && (
              <div className="flex items-center space-x-2 bg-dark-800 px-3 py-1.5 rounded-lg border border-dark-700">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-white font-mono text-sm">{shortenAddress(walletAddress)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden border-t border-dark-700">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive(link.path)
                  ? 'bg-primary-600 text-white'
                  : 'text-dark-300 hover:bg-dark-700 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
