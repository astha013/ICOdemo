import { forwardRef } from "react";

const allocations = [
  { name: "Treasury", tokens: "90,450,000", pct: 40.2, color: "bg-[hsl(210,70%,55%)]" },
  { name: "Ecosystem", tokens: "45,000,000", pct: 20, color: "bg-[hsl(199,89%,48%)]" },
  { name: "Partnerships", tokens: "40,500,000", pct: 18, color: "bg-[hsl(38,92%,50%)]" },
  { name: "Founders/Team", tokens: "27,000,000", pct: 12, color: "bg-primary" },
  { name: "ICO Sale", tokens: "16,500,000", pct: 7.33, color: "bg-[hsl(142,70%,45%)]" },
  { name: "Advisors", tokens: "5,625,000", pct: 2.5, color: "bg-[hsl(270,70%,60%)]" },
];

const vestingDetails = [
  { name: "Founders/Team", cliff: "12 months", vest: "24 months" },
  { name: "Advisors", cliff: "12 months", vest: "24 months" },
  { name: "Ecosystem", cliff: "1 month", vest: "24 months" },
  { name: "Treasury", cliff: "1 month", vest: "12 months" },
  { name: "Partnerships", cliff: "3 months", vest: "12 months" },
  { name: "ICO (PreSeed/Seed/Strategic)", cliff: "3 months", vest: "24 months" },
  { name: "ICO (Public)", cliff: "None", vest: "Immediate" },
];

const TokenomicsSection = forwardRef<HTMLElement>((_, ref) => {
  return (
    <section id="tokenomics" className="py-24" ref={ref}>
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 gradient-text">Tokenomics</h2>
          <p className="text-muted-foreground text-lg">
            Total Supply: <span className="text-primary font-semibold">225,000,000 ICO</span>
          </p>
        </div>

        {/* Allocation Breakdown */}
        <div className="glass-card p-8 mb-8">
          <h3 className="font-display text-xl font-bold text-foreground mb-6">Allocation Breakdown</h3>
          <div className="flex gap-1 h-8 rounded-full overflow-hidden mb-8">
            {allocations.map((a, i) => (
              <div key={i} className={`${a.color} transition-all duration-1000`} style={{ width: `${a.pct}%` }} title={`${a.name}: ${a.pct}%`} />
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {allocations.map((a, i) => (
              <div key={i} className="text-center p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className={`w-3 h-3 rounded-full ${a.color}`} />
                  <span className="text-sm text-muted-foreground">{a.name}</span>
                </div>
                <div className="font-display font-bold text-foreground">{a.pct}%</div>
                <div className="text-xs text-muted-foreground">{a.tokens} tokens</div>
              </div>
            ))}
          </div>
        </div>

        {/* Vesting Schedule */}
        <div className="glass-card p-8">
          <h3 className="font-display text-xl font-bold text-foreground mb-6">Vesting Schedules</h3>
          <div className="space-y-3">
            {vestingDetails.map((v, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                <span className="text-sm text-foreground font-medium">{v.name}</span>
                <div className="flex gap-4 text-sm">
                  <span className="text-muted-foreground">Cliff: <span className="text-foreground">{v.cliff}</span></span>
                  <span className="text-muted-foreground">Vest: <span className="text-foreground">{v.vest}</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

TokenomicsSection.displayName = "TokenomicsSection";

export default TokenomicsSection;
