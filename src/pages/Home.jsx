import React, { useEffect, useState } from 'react';
import { minus1 } from '@/api/minus1Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Users, Shield, Rocket } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuthenticated = await minus1.auth.isAuthenticated();
      
      if (isAuthenticated) {
        const user = await minus1.auth.me();
        const profiles = await minus1.entities.Profile.filter({ user_id: user.id });
        
        if (profiles.length && profiles[0].is_complete) {
          navigate(createPageUrl('Discover'));
        } else {
          navigate(createPageUrl('Onboarding'));
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetStarted = () => {
    minus1.auth.redirectToLogin(createPageUrl('Onboarding'));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-900">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-lg mx-auto px-4 py-12 min-h-screen flex flex-col">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent">
            Minus1
          </h1>
          <p className="text-blue-200 mt-2">Find your perfect match</p>
        </motion.div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-1 flex flex-col justify-center text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
            className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-blue-500/30"
          >
            <Sparkles className="w-12 h-12 text-white" />
          </motion.div>

          <h2 className="text-3xl font-bold mb-4">
            Where Founders Meet
            <br />
            Their Perfect Match
          </h2>
          
          <p className="text-blue-200 mb-8 max-w-sm mx-auto">
            Connect with co-founders, investors, accelerators, and service providers to bring your vision to life.
          </p>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10"
            >
              <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-xs text-blue-200">Find Partners</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10"
            >
              <Shield className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
              <p className="text-xs text-blue-200">Stay Safe</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10"
            >
              <Rocket className="w-6 h-6 text-sky-400 mx-auto mb-2" />
              <p className="text-xs text-blue-200">Grow Fast</p>
            </motion.div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="space-y-4"
        >
          <Button 
            onClick={handleGetStarted}
            className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-lg shadow-blue-500/30"
          >
            Get Started
          </Button>
          
          <p className="text-center text-sm text-blue-300">
            Already have an account?{' '}
            <button 
              onClick={() => minus1.auth.redirectToLogin(createPageUrl('Discover'))}
              className="text-white font-medium hover:underline"
            >
              Sign in
            </button>
          </p>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-xs text-blue-400 mt-8"
        >
          Connecting entrepreneurs worldwide
        </motion.p>
      </div>
    </div>
  );
}