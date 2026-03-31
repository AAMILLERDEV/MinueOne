import React from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import {
  Lightbulb, Briefcase, Building2, Wrench, Banknote, CalendarDays,
  GripVertical, X, Check
} from 'lucide-react';

// All discoverable profile types with display metadata
export const PROFILE_TYPES = [
  {
    id: 'founder',
    label: 'Founders',
    icon: Lightbulb,
    color: 'indigo',
    desc: 'Entrepreneurs building startups and looking for a co-founder',
  },
  {
    id: 'collaborator',
    label: 'Collaborators',
    icon: Briefcase,
    color: 'emerald',
    desc: 'Skilled people open to joining as a co-founder or key hire',
  },
  {
    id: 'investor',
    label: 'Investors',
    icon: Banknote,
    color: 'violet',
    desc: 'Angels and VCs looking to fund early-stage startups',
  },
  {
    id: 'service_provider',
    label: 'Service Providers',
    icon: Wrench,
    color: 'rose',
    desc: 'Legal, marketing, tech, and other startup service experts',
  },
  {
    id: 'accelerator',
    label: 'Accelerators',
    icon: Building2,
    color: 'amber',
    desc: 'Accelerators, innovation centres, and incubators',
  },
  {
    id: 'event_organizer',
    label: 'Event Organizers',
    icon: CalendarDays,
    color: 'cyan',
    desc: 'Founders who run startup events and communities',
  },
];

const COLOR = {
  indigo:  { pill: 'bg-indigo-100 text-indigo-700',  icon: 'bg-indigo-100 text-indigo-600',  ring: 'ring-indigo-400'  },
  emerald: { pill: 'bg-emerald-100 text-emerald-700', icon: 'bg-emerald-100 text-emerald-600', ring: 'ring-emerald-400' },
  violet:  { pill: 'bg-violet-100 text-violet-700',  icon: 'bg-violet-100 text-violet-600',  ring: 'ring-violet-400'  },
  rose:    { pill: 'bg-rose-100 text-rose-700',      icon: 'bg-rose-100 text-rose-600',      ring: 'ring-rose-400'    },
  amber:   { pill: 'bg-amber-100 text-amber-700',    icon: 'bg-amber-100 text-amber-600',    ring: 'ring-amber-400'   },
  cyan:    { pill: 'bg-cyan-100 text-cyan-700',      icon: 'bg-cyan-100 text-cyan-600',      ring: 'ring-cyan-400'    },
};

/** Single draggable row in the priority list */
function PriorityRow({ type, index, onRemove }) {
  const controls = useDragControls();
  const Icon = type.icon;
  const c = COLOR[type.color];

  return (
    <Reorder.Item
      value={type}
      dragListener={false}
      dragControls={controls}
      className="flex items-center gap-3 px-4 py-3 bg-white"
      style={{ touchAction: 'none' }}
    >
      {/* Rank number */}
      <span className="w-5 text-xs font-bold text-slate-400 text-center flex-shrink-0">
        {index + 1}
      </span>

      {/* Icon */}
      <div className={`w-7 h-7 rounded-lg ${c.icon} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-3.5 h-3.5" />
      </div>

      {/* Label */}
      <span className="flex-1 text-sm font-medium text-slate-800">{type.label}</span>

      {/* Drag handle */}
      <div
        onPointerDown={(e) => controls.start(e)}
        className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing flex-shrink-0"
        style={{ touchAction: 'none' }}
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={onRemove}
        className="text-slate-300 hover:text-rose-500 transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </Reorder.Item>
  );
}

/**
 * DiscoveryPreferencesEditor
 *
 * Props:
 *   value      — ordered array of profile type ids (index 0 = highest priority)
 *   onChange   — (newOrderedArray: string[]) => void
 */
export default function DiscoveryPreferencesEditor({ value = [], onChange }) {
  // Build ordered type objects from the value array
  const orderedSelected = value
    .map(id => PROFILE_TYPES.find(t => t.id === id))
    .filter(Boolean);

  const handleToggle = (typeId) => {
    if (value.includes(typeId)) {
      // Remove
      onChange(value.filter(id => id !== typeId));
    } else {
      // Add to end (lowest priority)
      onChange([...value, typeId]);
    }
  };


  return (
    <div className="space-y-5">
      {/* Type selection grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {PROFILE_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = value.includes(type.id);
          const priorityRank = value.indexOf(type.id) + 1; // 0 if not selected
          const c = COLOR[type.color];

          return (
            <button
              key={type.id}
              type="button"
              onClick={() => handleToggle(type.id)}
              className={`relative p-3.5 rounded-xl border-2 text-left transition-all
                ${isSelected
                  ? 'border-slate-800 bg-slate-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
            >
              {/* Priority rank badge */}
              {isSelected && (
                <motion.div
                  key={`rank-${priorityRank}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-slate-900 text-white rounded-full text-[10px] font-bold flex items-center justify-center"
                >
                  {priorityRank}
                </motion.div>
              )}
              <div className={`w-8 h-8 rounded-lg ${c.icon} flex items-center justify-center mb-2`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-sm font-semibold text-slate-900 leading-tight">{type.label}</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-tight">{type.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Priority drag list — only shown when ≥1 type selected */}
      <AnimatePresence>
        {orderedSelected.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Priority Order</p>
                <p className="text-xs text-slate-400">Drag to reorder · Top = shown most</p>
              </div>

              <Reorder.Group
                axis="y"
                values={orderedSelected}
                onReorder={(newOrder) => onChange(newOrder.map(t => t.id))}
                className="divide-y divide-slate-100"
                style={{ listStyle: 'none', padding: 0, margin: 0 }}
              >
                {orderedSelected.map((type, index) => (
                  <PriorityRow
                    key={type.id}
                    type={type}
                    index={index}
                    onRemove={() => handleToggle(type.id)}
                  />
                ))}
              </Reorder.Group>

              {/* Footer hint */}
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
                <p className="text-xs text-slate-400">
                  Higher-ranked types appear more frequently in your Discovery feed.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
