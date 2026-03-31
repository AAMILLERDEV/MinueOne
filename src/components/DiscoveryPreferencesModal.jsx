import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DiscoveryPreferencesEditor from '@/components/DiscoveryPreferencesEditor';

/**
 * DiscoveryPreferencesModal
 *
 * Full-screen gate shown in Discovery when looking_for is unset.
 * Cannot be dismissed without saving at least one preference.
 *
 * Props:
 *   isOpen   — boolean
 *   onSave   — async (orderedTypes: string[]) => void
 */
export default function DiscoveryPreferencesModal({ isOpen, onSave }) {
  const [orderedTypes, setOrderedTypes] = useState([]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!orderedTypes.length) return;
    setSaving(true);
    try {
      await onSave(orderedTypes);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-slate-50 to-slate-100"
        >
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-lg mx-auto px-5 pt-12 pb-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Compass className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  Who are you looking for?
                </h1>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
                  Select the types of people you want to discover, then drag to set your priority.
                  The top type will appear most often in your feed.
                </p>
              </div>

              {/* Editor */}
              <DiscoveryPreferencesEditor
                value={orderedTypes}
                onChange={setOrderedTypes}
              />
            </div>
          </div>

          {/* Sticky save bar */}
          <div className="flex-shrink-0 bg-white border-t border-slate-200 px-5 py-4 safe-area-pb">
            <div className="max-w-lg mx-auto">
              <Button
                onClick={handleSave}
                disabled={orderedTypes.length === 0 || saving}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold py-3 rounded-xl disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {saving ? 'Saving…' : orderedTypes.length === 0
                  ? 'Select at least one type'
                  : `Start Discovering${orderedTypes.length > 1 ? ` (${orderedTypes.length} types)` : ''}`}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
