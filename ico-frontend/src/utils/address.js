/**
 * Shortens an Ethereum address for display
 * @param {string} address - The full Ethereum address
 * @returns {string} - The shortened address (0x1234...5678)
 */
export const shortenAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Shortens a transaction hash for display
 * @param {string} hash - The full transaction hash
 * @returns {string} - The shortened hash (0x12345678...567890ab)
 */
export const shortenTxHash = (hash) => {
  if (!hash) return '';
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
};
