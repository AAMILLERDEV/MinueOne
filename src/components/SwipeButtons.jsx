import React from 'react';
import { motion } from 'framer-motion';
import { X, Heart, RotateCcw } from 'lucide-react';

export default function SwipeButtons({ onPass, onLike, onUndo, canUndo }) {
  return (
    <div className="flex items-center justify-center gap-6 py-6">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onUndo}
        disabled={!canUndo}
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all
          ${canUndo 
            ? 'bg-white text-amber-500 hover:shadow-xl' 
            : 'bg-slate-100 text-slate-300 cursor-not-allowed'
          }`}
      >
        <RotateCcw className="w-5 h-5" />
      </motion.button>
      
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onPass}
        className="w-16 h-16 rounded-full bg-white text-rose-500 flex items-center justify-center shadow-lg hover:shadow-xl transition-all border-2 border-rose-100"
      >
        <X className="w-8 h-8" />
      </motion.button>
      
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onLike}
        className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
      >
        <Heart className="w-8 h-8" />
      </motion.button>
    </div>
  );
}