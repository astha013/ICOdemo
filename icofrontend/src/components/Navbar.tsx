import { useWallet } from "@/lib/wallet";
import tokenIcon from "@/assets/token-icon.png";

const Navbar = () => {
  const { address, isConnecting, connect, disconnect, isCorrectNetwork } =
    useWallet();

  const shortenAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-t-0 border-x-0 rounded-none">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={tokenIcon}
            alt="ICO Token"
            width={40}
            height={40}
            className="rounded-full"
          />
          <span className="font-display text-xl font-bold gradient-text">
            ICO Token
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#rounds"
            className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
          >
            Rounds
          </a>
          <a
            href="#buy"
            className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
          >
            Buy Tokens
          </a>
          <a
            href="#vesting"
            className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
          >
            Vesting
          </a>
          <a
            href="#tokenomics"
            className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
          >
            Tokenomics
          </a>
        </div>
        {address ? (
          <div className="flex items-center gap-3">
            {!isCorrectNetwork && (
              <span className="text-yellow-500 text-xs font-medium">
                Switch to Sepolia
              </span>
            )}
            <button
              onClick={disconnect}
              className="gradient-primary px-5 py-2.5 rounded-lg font-semibold text-sm text-primary-foreground hover:opacity-90 transition-opacity"
            >
              {shortenAddress(address)}
            </button>
          </div>
        ) : (
          <button
            onClick={connect}
            disabled={isConnecting}
            className="gradient-primary px-5 py-2.5 rounded-lg font-semibold text-sm text-primary-foreground hover:opacity-90 transition-opacity animate-pulse-glow"
          >
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
