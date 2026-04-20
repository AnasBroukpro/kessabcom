import React from 'react';
import { motion } from 'motion/react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[1000] bg-white flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          duration: 0.8,
          ease: "easeOut"
        }}
        className="flex flex-col items-center gap-6"
      >
        <motion.img 
          src="https://i.ibb.co/kVrLBVqF/Gemini-Generated-Image-6nvuob6nvuob6nvu-removebg-preview.webp" 
          alt="كسابكوم" 
          className="w-64 h-64 object-contain"
          referrerPolicy="no-referrer"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        <div className="flex flex-col items-center gap-2">
          <p className="text-[#757575] font-bold tracking-widest uppercase text-xs">منكم وإليكم</p>
        </div>
        <div className="flex gap-1.5 mt-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 bg-[#2E7D32] rounded-full"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;
