import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";
import tokenIcon from "@/assets/token-icon.png";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroBg} alt="" width={1920} height={1080} className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-24 pb-16 text-center">
        <motion.div
          className="mb-8 inline-block animate-float"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <img src={tokenIcon} alt="ICO Token" width={120} height={120} className="mx-auto drop-shadow-2xl" />
        </motion.div>

        <motion.h1
          className="font-display text-5xl md:text-7xl font-bold mb-6 glow-text"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <span className="gradient-text">ICO Token</span>
          <br />
          <span className="text-foreground">Presale is Live</span>
        </motion.h1>

        <motion.p
          className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          225M total supply. 16.5M allocated for ICO across 4 rounds.
          Early investors get the best price with structured vesting.
        </motion.p>

        <motion.div
          className="flex flex-wrap justify-center gap-6 md:gap-12 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
        >
          <StatItem label="Total Supply" value="225M" />
          <StatItem label="Rounds" value="4" />
          <StatItem label="Starting Price" value="0.067 ETH" />
        </motion.div>

        <motion.div
          className="flex flex-wrap justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.8 }}
        >
          <a href="#buy" className="gradient-primary px-8 py-4 rounded-xl font-display font-bold text-lg text-primary-foreground hover:opacity-90 transition-opacity animate-pulse-glow">
            Buy Tokens Now
          </a>
          <a href="#rounds" className="border border-primary/30 bg-primary/5 px-8 py-4 rounded-xl font-display font-semibold text-lg text-primary hover:bg-primary/10 transition-colors">
            View Rounds
          </a>
        </motion.div>
      </div>
    </section>
  );
};

const StatItem = ({ label, value }: { label: string; value: string }) => (
  <div className="text-center">
    <div className="font-display text-2xl md:text-3xl font-bold gradient-text">{value}</div>
    <div className="text-muted-foreground text-sm mt-1">{label}</div>
  </div>
);

export default HeroSection;
