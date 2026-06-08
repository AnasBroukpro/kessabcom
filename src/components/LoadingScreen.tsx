import React from 'react';
import { motion } from 'motion/react';
import logoV2 from '../assets/marketing/branding/logo-v2.png';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[1000] bg-[#FDFCF8] flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex flex-col items-center gap-8"
      >
        <motion.img
          src={logoV2}
          alt="كسابكوم"
          className="h-12 md:h-16 w-auto object-contain"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />

        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 bg-[#2E7D32] rounded-full"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;
