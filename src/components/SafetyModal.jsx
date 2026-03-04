import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Shield, Building2, FileCheck, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function SafetyModal({ isOpen, onClose, onFindAccelerators, isPremium, onSendNDA }) {
  const [showNDAConfirm, setShowNDAConfirm] = useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl p-6 max-w-md w-full relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>

          {!showNDAConfirm ? (
            <>
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-7 h-7 text-amber-600" />
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2">Stay Safe When Connecting</h3>
              
              <div className="space-y-4 my-6">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Protect Your Ideas</p>
                    <p className="text-sm text-slate-600">Be cautious when sharing confidential information. Consider using an NDA before detailed discussions.</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Meet in Safe Spaces</p>
                    <p className="text-sm text-slate-600">Consider meeting at a local Innovation Center or Accelerator for your first in-person meeting.</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Shield className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Verify Credentials</p>
                    <p className="text-sm text-slate-600">Check LinkedIn profiles and references before committing to partnerships.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Button 
                  onClick={onFindAccelerators}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Find Accelerators Near Me
                </Button>
                
                {isPremium && (
                  <Button 
                    onClick={() => setShowNDAConfirm(true)}
                    variant="outline"
                    className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  >
                    <FileCheck className="w-4 h-4 mr-2" />
                    Send NDA Request
                  </Button>
                )}
                
                <Button variant="ghost" onClick={onClose} className="w-full">
                  Got it, thanks
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <FileCheck className="w-7 h-7 text-indigo-600" />
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2">Send NDA Request</h3>
              <p className="text-slate-600 mb-6">
                This will notify your match that you'd like them to sign an NDA before continuing detailed discussions.
              </p>

              <div className="space-y-3">
                <Button 
                  onClick={() => {
                    onSendNDA();
                    setShowNDAConfirm(false);
                    onClose();
                  }}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  Confirm & Send NDA
                </Button>
                <Button variant="ghost" onClick={() => setShowNDAConfirm(false)} className="w-full">
                  Cancel
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}