import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";
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
  if (num >= 1_000) return (num / 1_000_000).toFixed(4) + "M";
  return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

const RoundsSection = () => {
  const [currentRound, setCurrentRound] = useState(0);
  const [roundsSold, setRoundsSold] = useState<Record<number, string>>({});
  const [contractReady, setContractReady] = useState(true);

  const fetchRounds = useCallback(async () => {
    if (!isContractConfigured()) {
      setContractReady(false);
      return;
    }
    setContractReady(true);

    // Build a read-only provider: prefer MetaMask, fallback to RPC
    let provider: ethers.Provider | null = null;
    const eth = (window as any).ethereum;
    if (eth) {
      provider = new ethers.BrowserProvider(eth);
    } else {
      const rpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL;
      if (rpcUrl) {
        provider = new ethers.JsonRpcProvider(rpcUrl);
      }
    }
    if (!provider) return;

    try {
      const contract = getICOTokenContract(provider);
      const round = await contract.getCurrentRound();
      setCurrentRound(Number(round));

      const sold: Record<number, string> = {};
      for (let i = 0; i < 4; i++) {
        const info = await contract.getRoundInfo(i);
        sold[i] = ethers.formatEther(info.tokensSold);
      }
      setRoundsSold(sold);
    } catch (err) {
      // Silent fail - use defaults
    }
  }, []);

  useEffect(() => {
    fetchRounds();
    const interval = setInterval(fetchRounds, 15000);
    return () => clearInterval(interval);
  }, [fetchRounds]);

  const rounds = [0, 1, 2, 3].map((i) => {
    const sold = parseFloat(roundsSold[i] || "0");
    const total = parseInt(ROUND_TOKENS[i].replace(/,/g, ""), 10);

    return {
      name: ROUND_NAMES[i],
      price: `${ROUND_PRICES[i]} ETH`,
      tokens: Number(ROUND_TOKENS[i]).toLocaleString(),
      sold,
      total,
      vesting: ROUND_HAS_VESTING[i] ? "3mo cliff + 24mo linear" : "No vesting",
      status:
        i < currentRound
          ? "completed"
          : i === currentRound
            ? "active"
            : "upcoming",
    };
  });

  return (
    <section id="rounds" className="py-24">
      <div className="container mx-auto px-4">
        <ScrollReveal className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 gradient-text">
            Sale Rounds
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Four structured rounds with increasing prices. Early participants
            get the best rates.
          </p>
          {!contractReady && (
            <p className="text-yellow-500 text-sm mt-2">
              Live data will appear after contract deployment.
            </p>
          )}
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {rounds.map((round, i) => {
            const isActive = round.status === "active";
            const isCompleted = round.status === "completed";
            const progress =
              round.total > 0 ? (round.sold / round.total) * 100 : 0;

            return (
              <StaggerItem key={i}>
                <div
                  className={`${isActive ? "glass-card-active" : isCompleted ? "glass-card opacity-90" : "glass-card opacity-70"} p-6 relative overflow-hidden hover-scale`}
                >
                  {isActive && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-primary/20 text-primary text-xs font-semibold px-3 py-1 rounded-full border border-primary/30">
                        LIVE
                      </span>
                    </div>
                  )}
                  {isCompleted && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-green-500/20 text-green-400 text-xs font-semibold px-3 py-1 rounded-full border border-green-500/30">
                        COMPLETED
                      </span>
                    </div>
                  )}

                  <div className="text-muted-foreground text-sm font-medium mb-1">
                    Round {i + 1}
                  </div>
                  <h3 className="font-display text-2xl font-bold text-foreground mb-4">
                    {round.name}
                  </h3>

                  <div className="space-y-3 mb-6">
                    <InfoRow label="Price" value={round.price} highlight />
                    <InfoRow label="Allocation" value={round.tokens} />
                    <InfoRow label="Vesting" value={round.vesting} />
                  </div>

                  <div className="mb-2">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-primary font-semibold">
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full gradient-primary rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {formatTokenAmount(round.sold.toString())} /{" "}
                    {round.total.toLocaleString()} tokens
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
};

const InfoRow = ({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground text-sm">{label}</span>
    <span
      className={
        highlight
          ? "text-primary font-semibold text-sm"
          : "text-foreground text-sm font-medium"
      }
    >
      {value}
    </span>
  </div>
);

export default RoundsSection;
