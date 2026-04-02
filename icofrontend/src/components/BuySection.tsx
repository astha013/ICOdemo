import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { ScrollReveal } from "./ScrollReveal";
import { useWallet } from "@/lib/wallet";
import {
  getICOTokenContract,
  ROUND_NAMES,
  ROUND_PRICES,
  ROUND_TOKENS,
  ROUND_HAS_VESTING,
  isContractConfigured,
} from "@/lib/contract";

function formatTokenAmount(raw: string): string {
  const num = parseFloat(raw);
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(2) + "K";
  return num.toFixed(2);
}

const BuySection = () => {
  const { address, signer, provider, connect, isCorrectNetwork } = useWallet();
  const [ethAmount, setEthAmount] = useState("");
  const [currentRound, setCurrentRound] = useState(0);
  const [roundInfo, setRoundInfo] = useState<{
    price: string;
    tokensAvailable: string;
    tokensSold: string;
  } | null>(null);
  const [isBuying, setIsBuying] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [contractReady, setContractReady] = useState(true);

  // Use contract price when available, fallback to hardcoded
  const roundPrice = roundInfo?.price || ROUND_PRICES[currentRound] || "0.067";

  // Preview token amount: matches contract formula (eth * 1e18) / price
  const tokenAmountPreview = ethAmount
    ? (parseFloat(ethAmount) / parseFloat(roundPrice)).toFixed(2)
    : "0";

  const hasVesting = ROUND_HAS_VESTING[currentRound] ?? true;

  const fetchRoundData = useCallback(async () => {
    if (!isContractConfigured()) {
      setContractReady(false);
      return;
    }
    setContractReady(true);

    // Build a read-only provider: prefer MetaMask, fallback to RPC
    let readProvider: ethers.Provider | null = provider;
    if (!readProvider) {
      const rpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL;
      if (rpcUrl) {
        readProvider = new ethers.JsonRpcProvider(rpcUrl);
      }
    }
    if (!readProvider) return;

    try {
      const contract = getICOTokenContract(readProvider);
      const round = await contract.getCurrentRound();
      const rNum = Number(round);
      setCurrentRound(rNum);

      const info = await contract.getRoundInfo(rNum);
      setRoundInfo({
        price: ethers.formatEther(info.priceUSD),
        tokensAvailable: ethers.formatEther(info.tokensAvailable),
        tokensSold: ethers.formatEther(info.tokensSold),
      });
    } catch (err) {
      console.error("Failed to fetch round data:", err);
    }
  }, [provider]);

  useEffect(() => {
    fetchRoundData();
    const interval = setInterval(fetchRoundData, 15000);
    return () => clearInterval(interval);
  }, [fetchRoundData]);

  const handleBuy = async () => {
    if (!signer || !ethAmount) return;
    setIsBuying(true);
    setTxHash("");
    try {
      const contract = getICOTokenContract(signer);
      const value = ethers.parseEther(ethAmount);
      const tx = await contract.buyTokens(currentRound, { value });
      setTxHash(tx.hash);
      await tx.wait();
      await fetchRoundData();
      setEthAmount("");
    } catch (err) {
      console.error("Buy failed:", err);
      alert(err?.reason || err?.message || "Transaction failed");
    } finally {
      setIsBuying(false);
    }
  };

  const soldPct =
    roundInfo && parseFloat(roundInfo.tokensAvailable) > 0
      ? (
          (parseFloat(roundInfo.tokensSold) /
            parseFloat(roundInfo.tokensAvailable)) *
          100
        ).toFixed(1)
      : "0";

  // Tokens remaining in current round
  const tokensRemaining = roundInfo
    ? formatTokenAmount(
        (
          parseFloat(roundInfo.tokensAvailable) -
          parseFloat(roundInfo.tokensSold)
        ).toString()
      )
    : ROUND_TOKENS[currentRound] || "0";

  return (
    <section id="buy" className="py-24">
      <div className="container mx-auto px-4 max-w-lg">
        <ScrollReveal className="text-center mb-12">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 gradient-text">
            Buy Tokens
          </h2>
          <p className="text-muted-foreground">
            Current Round:{" "}
            <span className="text-primary font-semibold">
              {ROUND_NAMES[currentRound] || "Loading..."}
            </span>
          </p>
          {roundInfo && (
            <p className="text-muted-foreground text-sm mt-1">
              {formatTokenAmount(roundInfo.tokensSold)} /{" "}
              {ROUND_TOKENS[currentRound]} tokens sold ({soldPct}%)
            </p>
          )}
          {!contractReady && (
            <p className="text-yellow-500 text-sm mt-2">
              Contract not deployed yet. Connect wallet after deployment.
            </p>
          )}
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <div className="glass-card-active p-8">
            <div className="mb-6">
              <label className="block text-sm text-muted-foreground mb-2">
                You Pay (ETH)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={ethAmount}
                  onChange={(e) => setEthAmount(e.target.value)}
                  placeholder="0.0"
                  min="0"
                  step="0.001"
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-4 text-lg font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
                />
                {/* <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                  ETH
                </span> */}
              </div>
            </div>

            <div className="flex justify-center my-2">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm text-muted-foreground mb-2">
                You Receive (estimated)
              </label>
              <div className="relative">
                <div className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-4 text-lg font-semibold text-foreground">
                  {parseFloat(tokenAmountPreview).toLocaleString()}
                </div>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-primary font-semibold">
                  ICO
                </span>
              </div>
            </div>

            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Price per token</span>
                <span className="text-foreground font-medium">
                  {roundPrice} ETH
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Remaining</span>
                <span className="text-foreground font-medium">
                  {tokensRemaining} tokens
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Vesting</span>
                <span className="text-foreground font-medium">
                  {hasVesting ? "3mo cliff + 24mo linear" : "No vesting"}
                </span>
              </div>
            </div>

            {txHash && (
              <div className="mb-4 text-xs text-center text-muted-foreground">
                Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </div>
            )}

            {!address ? (
              <button
                onClick={connect}
                className="w-full gradient-primary py-4 rounded-xl font-display font-bold text-lg text-primary-foreground hover:opacity-90 transition-opacity animate-pulse-glow"
              >
                Connect Wallet to Buy
              </button>
            ) : !isCorrectNetwork ? (
              <button
                onClick={() => {
                  const eth = (window as { ethereum?: { request: (args: { method: string; params: unknown[] }) => Promise<unknown> } }).ethereum;
                  if (eth) {
                    eth.request({
                      method: "wallet_switchEthereumChain",
                      params: [{ chainId: "0xaa36a7" }],
                    });
                  }
                }}
                className="w-full bg-yellow-600 py-4 rounded-xl font-display font-bold text-lg text-white hover:opacity-90 transition-opacity"
              >
                Switch to Sepolia Network
              </button>
            ) : (
              <button
                onClick={handleBuy}
                disabled={
                  isBuying ||
                  !ethAmount ||
                  parseFloat(ethAmount) <= 0 ||
                  !contractReady
                }
                className="w-full gradient-primary py-4 rounded-xl font-display font-bold text-lg text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBuying ? "Buying..." : "Buy Tokens"}
              </button>
            )}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default BuySection;
