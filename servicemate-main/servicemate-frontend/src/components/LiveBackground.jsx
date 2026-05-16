import { motion } from 'framer-motion';

const LiveBackground = ({ children }) => {
  return (
    <div className="theme-background relative min-h-screen w-full overflow-hidden">
      <div className="theme-background-overlay absolute inset-0" />
      <div className="theme-grid absolute inset-0" />

      <motion.div
        animate={{ x: [0, 90, 0], y: [0, 50, 0], opacity: [0.18, 0.34, 0.18] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
        className="theme-orb-primary absolute left-[-8%] top-[-12%] h-[640px] w-[640px] rounded-full blur-[140px]"
      />
      <motion.div
        animate={{ x: [0, -70, 0], y: [0, 90, 0], opacity: [0.08, 0.24, 0.08] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        className="theme-orb-secondary absolute bottom-[-18%] right-[-8%] h-[560px] w-[560px] rounded-full blur-[120px]"
      />
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.06, 0.14, 0.06] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="theme-orb-tertiary absolute left-[40%] top-[18%] h-[380px] w-[380px] rounded-full blur-[120px]"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default LiveBackground;
