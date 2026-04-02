import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { ScrollReveal } from "./ScrollReveal";
import { useWallet } from "@/lib/wallet";
import {
  getICOTokenContract,
  getICOStorageContract,
  getReadOnlyProvider,
  isContractConfigured,
  ALLOCATION_CATEGORIES,
} from "@/lib/contract";

const VestingSection = () => {
  const { address, signer, provider, connect, isCorrectNetwork } = useWallet();
  const [vestingData, setVestingData] = useState({
    totalTokens: "0",
    claimedTokens: "0",
    claimableTokens: "0",
    startTime: 0,
  });
  const [allocData, setAllocData] = useState({
    totalAllocated: "0",
    totalClaimed: "0",
    totalClaimable: "0",
    allocations: [] as Array<{
      categoryName: string;
      totalTokens: string;
      claimedTokens: string;
      claimable: string;
    }>,
  });
  const [isClaiming, setIsClaiming] = useState(false);
  const [isClaimingAlloc, setIsClaimingAlloc] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [contractReady, setContractReady] = useState(true);

  const fetchVesting = useCallback(async () => {
    if (!address || !isContractConfigured()) {
      setContractReady(!!isContractConfigured());
      return;
    }
    setContractReady(true);

    let readProvider: ethers.Provider | null = provider;
    if (!readProvider) readProvider = getReadOnlyProvider();
    if (!readProvider) return;

    try {
      const tokenContract = getICOTokenContract(readProvider);
      const storageContract = getICOStorageContract(readProvider);

      // ICO vesting
      const vesting = await storageContract.getVesting(address);
      const claimable = await tokenContract.getClaimableTokens(address);

      setVestingData({
        totalTokens: ethers.formatEther(vesting.totalTokens),
        claimedTokens: ethers.formatEther(vesting.claimedTokens),
        claimableTokens: ethers.formatEther(claimable),
        startTime: Number(vesting.startTime),
      });

      // Allocation data
      const allocClaimable = await tokenContract.getAllocationClaimable(address);
      const userAllocs = await storageContract.getUserAllocations(address);

      let totalAlloc = 0n;
      let totalClaimed = 0n;
      const allocDetails: Array<{
        categoryName: string;
        totalTokens: string;
        claimedTokens: string;
        claimable: string;
      }> = [];

      for (let i = 0; i < userAllocs.length; i++) {
        const a = userAllocs[i];
        const catIdx = Number(a.category);
        totalAlloc += a.totalTokens;
        totalClaimed += a.claimedTokens;
        allocDetails.push({
          categoryName: ALLOCATION_CATEGORIES[catIdx]?.name || `Category ${catIdx}`,
          totalTokens: ethers.formatEther(a.totalTokens),
          claimedTokens: ethers.formatEther(a.claimedTokens),
          claimable: "0", // computed below per-category
        });
      }

      setAllocData({
        totalAllocated: ethers.formatEther(totalAlloc),
        totalClaimed: ethers.formatEther(totalClaimed),
        totalClaimable: ethers.formatEther(allocClaimable),
        allocations: allocDetails,
      });
    } catch (err) {
      console.error("Failed to fetch vesting:", err);
    }
  }, [address, provider]);

  useEffect(() => {
    fetchVesting();
    const interval = setInterval(fetchVesting, 15000);
    return () => clearInterval(interval);
  }, [fetchVesting]);

  const handleClaimICO = async () => {
    if (!signer) return;
    setIsClaiming(true);
    setTxHash("");
    try {
      const contract = getICOTokenContract(signer);
      const tx = await contract.claim();
      setTxHash(tx.hash);
      await tx.wait();
      await fetchVesting();
    } catch (err: any) {
      alert(err?.reason || err?.message || "Transaction failed");
    } finally {
      setIsClaiming(false);
    }
  };

  const handleClaimAllocation = async () => {
    if (!signer) return;
    setIsClaimingAlloc(true);
    setTxHash("");
    try {
      const contract = getICOTokenContract(signer);
      const tx = await contract.claimAllocation();
      setTxHash(tx.hash);
      await tx.wait();
      await fetchVesting();
    } catch (err: any) {
      alert(err?.reason || err?.message || "Transaction failed");
    } finally {
      setIsClaimingAlloc(false);
    }
  };

  const totalTokens = parseFloat(vestingData.totalTokens);
  const claimedTokens = parseFloat(vestingData.claimedTokens);
  const claimableTokens = parseFloat(vestingData.claimableTokens);
  const vestedTokens = claimedTokens + claimableTokens;
  const vestedPct =
    totalTokens > 0 ? ((vestedTokens / totalTokens) * 100).toFixed(1) : "0";

  const allocTotal = parseFloat(allocData.totalAllocated);
  const allocClaimed = parseFloat(allocData.totalClaimed);
  const allocClaimable = parseFloat(allocData.totalClaimable);

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { maximumFractionDigits: 2 });

  return (
    <section id="vesting" className="py-24">
      <div className="container mx-auto px-4">
        <ScrollReveal className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 gradient-text">
            Vesting & Claims
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Claim your vested tokens. ICO tokens vest over 24 months after a 3-month cliff.
            Internal allocations have category-specific schedules.
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* ICO Vesting Card */}
          <ScrollReveal direction="left">
            <div className="glass-card-active p-8 h-full">
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                ICO Purchase Vesting
              </h3>
              <p className="text-muted-foreground text-xs mb-6">
                PreSeed / Seed / Strategic rounds
              </p>

              <div className="space-y-4 mb-8">
                <ClaimRow label="Total Purchased" value={`${fmt(totalTokens)} ICO`} />
                <ClaimRow label="Total Vested" value={`${fmt(vestedTokens)} ICO`} />
                <ClaimRow label="Already Claimed" value={`${fmt(claimedTokens)} ICO`} />
                <div className="border-t border-border pt-4">
                  <ClaimRow
                    label="Claimable Now"
                    value={`${fmt(claimableTokens)} ICO`}
                    highlight
                  />
                </div>
              </div>

              <div className="mb-8">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Vesting Progress</span>
                  <span className="text-primary font-semibold">{vestedPct}%</span>
                </div>
                <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full gradient-primary rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(parseFloat(vestedPct), 100)}%` }}
                  />
                </div>
              </div>

              {txHash && (
                <div className="mb-4 text-xs text-center text-muted-foreground truncate">
                  Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                </div>
              )}

              {!address ? (
                <button
                  onClick={connect}
                  className="w-full gradient-primary py-4 rounded-xl font-display font-bold text-lg text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  Connect Wallet
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
                  Switch to Sepolia
                </button>
              ) : (
                <button
                  onClick={handleClaimICO}
                  disabled={isClaiming || claimableTokens <= 0}
                  className="w-full gradient-primary py-4 rounded-xl font-display font-bold text-lg text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isClaiming
                    ? "Claiming..."
                    : claimableTokens > 0
                      ? "Claim ICO Tokens"
                      : "No ICO Tokens to Claim"}
                </button>
              )}
            </div>
          </ScrollReveal>

          {/* Allocation Vesting Card */}
          <ScrollReveal direction="right">
            <div className="glass-card p-8 h-full">
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                Allocation Claims
              </h3>
              <p className="text-muted-foreground text-xs mb-6">
                Team / Advisors / Ecosystem / Treasury / Partnerships
              </p>

              {allocData.allocations.length > 0 ? (
                <div className="space-y-4 mb-8">
                  {allocData.allocations.map((a, i) => (
                    <div key={i} className="bg-secondary/30 rounded-lg p-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-foreground font-medium">{a.categoryName}</span>
                        <span className="text-primary font-semibold">
                          {fmt(parseFloat(a.totalTokens))} ICO
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Claimed: {fmt(parseFloat(a.claimedTokens))}</span>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-border pt-4">
                    <ClaimRow
                      label="Total Allocated"
                      value={`${fmt(allocTotal)} ICO`}
                    />
                    <ClaimRow
                      label="Total Claimed"
                      value={`${fmt(allocClaimed)} ICO`}
                    />
                    <ClaimRow
                      label="Claimable Now"
                      value={`${fmt(allocClaimable)} ICO`}
                      highlight
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No allocations for this wallet
                </div>
              )}

              {address && isCorrectNetwork && allocClaimable > 0 && (
                <button
                  onClick={handleClaimAllocation}
                  disabled={isClaimingAlloc}
                  className="w-full gradient-primary py-4 rounded-xl font-display font-bold text-lg text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isClaimingAlloc ? "Claiming..." : "Claim Allocation Tokens"}
                </button>
              )}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

const ClaimRow = ({
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
          ? "text-primary font-bold"
          : "text-foreground font-medium text-sm"
      }
    >
      {value}
    </span>
  </div>
);

export default VestingSection;
