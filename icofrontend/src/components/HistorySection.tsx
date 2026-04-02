import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { ScrollReveal } from "./ScrollReveal";
import { useWallet } from "@/lib/wallet";
import {
  getICOStorageContract,
  getReadOnlyProvider,
  isContractConfigured,
  ROUND_NAMES,
} from "@/lib/contract";

interface PurchaseRecord {
  user: string;
  timestamp: number;
  round: number;
  ethAmount: string;
  tokenAmount: string;
}

const HistorySection = () => {
  const { address, connect } = useWallet();
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"my" | "all">("my");

  const fetchHistory = useCallback(async () => {
    if (!address || !isContractConfigured()) return;

    const provider = getReadOnlyProvider();
    if (!provider) return;

    setLoading(true);
    try {
      const storage = getICOStorageContract(provider);

      if (viewMode === "my") {
        const userPurchases = await storage.getUserPurchases(address);
        const records: PurchaseRecord[] = userPurchases.map((p: any) => ({
          user: p.user,
          timestamp: Number(p.timestamp),
          round: Number(p.round),
          ethAmount: ethers.formatEther(p.ethAmount),
          tokenAmount: ethers.formatEther(p.tokenAmount),
        }));
        setPurchases(records.reverse());
      } else {
        const total = Number(await storage.totalPurchases());
        const records: PurchaseRecord[] = [];
        for (let i = 0; i < total; i++) {
          const p = await storage.getPurchase(i);
          records.push({
            user: p.user,
            timestamp: Number(p.timestamp),
            round: Number(p.round),
            ethAmount: ethers.formatEther(p.ethAmount),
            tokenAmount: ethers.formatEther(p.tokenAmount),
          });
        }
        setPurchases(records.reverse());
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  }, [address, viewMode]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const shortenAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const formatDate = (ts: number) => {
    if (ts === 0) return "N/A";
    return new Date(ts * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <section id="history" className="py-24">
      <div className="container mx-auto px-4 max-w-4xl">
        <ScrollReveal className="text-center mb-12">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 gradient-text">
            Transaction History
          </h2>
          <p className="text-muted-foreground text-lg">
            All transactions recorded on-chain. No database required.
          </p>
        </ScrollReveal>

        <ScrollReveal>
          <div className="glass-card p-6">
            {/* Tab buttons */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setViewMode("my")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === "my"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                My Purchases
              </button>
              <button
                onClick={() => setViewMode("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                All Transactions
              </button>
            </div>

            {!address ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Connect wallet to view transaction history
                </p>
                <button
                  onClick={connect}
                  className="gradient-primary px-6 py-3 rounded-lg font-semibold text-sm text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  Connect Wallet
                </button>
              </div>
            ) : loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading from blockchain...</p>
              </div>
            ) : purchases.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {viewMode === "my"
                    ? "No purchases found for your wallet"
                    : "No transactions recorded yet"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {viewMode === "all" && (
                        <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                          Wallet
                        </th>
                      )}
                      <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                        Round
                      </th>
                      <th className="text-right py-3 px-2 text-muted-foreground font-medium">
                        ETH
                      </th>
                      <th className="text-right py-3 px-2 text-muted-foreground font-medium">
                        Tokens
                      </th>
                      <th className="text-right py-3 px-2 text-muted-foreground font-medium">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((p, i) => (
                      <tr key={i} className="border-b border-border/30 last:border-0">
                        {viewMode === "all" && (
                          <td className="py-3 px-2 text-foreground font-mono">
                            {shortenAddress(p.user)}
                          </td>
                        )}
                        <td className="py-3 px-2">
                          <span className="bg-primary/20 text-primary text-xs font-semibold px-2 py-1 rounded-full">
                            {ROUND_NAMES[p.round] || `Round ${p.round}`}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right text-foreground">
                          {parseFloat(p.ethAmount).toFixed(4)}
                        </td>
                        <td className="py-3 px-2 text-right text-primary font-medium">
                          {parseFloat(p.tokenAmount).toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-3 px-2 text-right text-muted-foreground">
                          {formatDate(p.timestamp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default HistorySection;
