import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Sparkles, MessageCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function MatchModal({ isOpen, onClose, matchedProfile, myProfile }) {
  if (!isOpen || !matchedProfile) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-white rounded-3xl p-8 max-w-sm w-full text-center relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-cyan-50 -z-10" />
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          >
            <X className="w-6 h-6" />
          </button>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center"
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>

          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-2"
          >
            It's a Match!
          </motion.h2>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-slate-600 mb-6"
          >
            You and <span className="font-semibold">{matchedProfile.display_name}</span> both want to connect!
          </motion.p>

          {/* Profile images */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center items-center gap-4 mb-8"
          >
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-100">
              {myProfile?.avatar_url ? (
                <img src={myProfile.avatar_url} alt="You" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-500 font-bold text-2xl">
                  {myProfile?.display_name?.[0] || 'Y'}
                </div>
              )}
            </div>
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-100">
              {matchedProfile.avatar_url ? (
                <img src={matchedProfile.avatar_url} alt={matchedProfile.display_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-cyan-100 flex items-center justify-center text-cyan-500 font-bold text-2xl">
                  {matchedProfile.display_name?.[0] || 'M'}
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
          >
            <Link to={createPageUrl('Matches')}>
              <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white">
                <MessageCircle className="w-4 h-4 mr-2" />
                Send a Message
              </Button>
            </Link>
            <Button variant="ghost" onClick={onClose} className="w-full">
              Keep Browsing
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}