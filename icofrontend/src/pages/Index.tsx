import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import RoundsSection from "@/components/RoundsSection";
import BuySection from "@/components/BuySection";
import VestingSection from "@/components/VestingSection";
import HistorySection from "@/components/HistorySection";
import TokenomicsSection from "@/components/TokenomicsSection";
import Footer from "@/components/Footer";

const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] } },
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={sectionVariants}>
        <RoundsSection />
      </motion.div>
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={sectionVariants}>
        <BuySection />
      </motion.div>
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={sectionVariants}>
        <VestingSection />
      </motion.div>
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={sectionVariants}>
        <HistorySection />
      </motion.div>
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={sectionVariants}>
        <TokenomicsSection />
      </motion.div>
      <Footer />
    </div>
  );
};

export default Index;
