/**
 * Default checklist template seeded when a company first opens the Checklist tab.
 * Covers Stage 1 (Ideation → Discovery) and Stage 2 (Discovery → Validation).
 * Stages 3-5 are displayed as locked until prior stages reach the completion threshold.
 *
 * Each item is given a stable sort_order so the initial seeding order is predictable.
 * Users can reorder, rename, delete, and add items after seeding.
 */

export const STAGE_UNLOCK_THRESHOLD = 0.5; // Stage N+1 unlocks when N is ≥50% complete

export const STAGE_LABELS = {
  1: { label: 'Stage 1', subtitle: 'Ideation → Discovery', goal: 'Identify a real, valuable problem' },
  2: { label: 'Stage 2', subtitle: 'Discovery → Validation', goal: 'Prove people will use and pay for a solution' },
  3: { label: 'Stage 3', subtitle: 'Validation → Efficiency', goal: 'Build a repeatable, efficient growth engine' },
  4: { label: 'Stage 4', subtitle: 'Efficiency → Scale', goal: 'Turn a working system into a high-growth company' },
  5: { label: 'Stage 5', subtitle: 'Scale → Expansion', goal: 'Become an industry leader' },
};

/** Template items — team_id is injected at seeding time */
export const CHECKLIST_TEMPLATE = [
  // ── Stage 1: Ideation → Discovery ──────────────────────────────────────────
  // Core Progress
  { stage: 1, category: 'Core Progress', title: 'Define the problem clearly', sort_order: 0 },
  { stage: 1, category: 'Core Progress', title: 'Talk to 20–50 target users', sort_order: 1 },
  { stage: 1, category: 'Core Progress', title: 'Identify a specific customer segment', sort_order: 2 },
  { stage: 1, category: 'Core Progress', title: 'Confirm strong pain and genuine interest', sort_order: 3 },

  // Co-founder Alignment
  { stage: 1, category: 'Co-founder Alignment', title: 'Decide if you need a co-founder', sort_order: 10 },
  { stage: 1, category: 'Co-founder Alignment', title: 'Align on vision, roles, and expectations early', sort_order: 11 },
  { stage: 1, category: 'Co-founder Alignment', title: 'Do a short trial project together before committing', sort_order: 12 },

  // Co-founder Agreement
  { stage: 1, category: 'Co-founder Agreement', title: 'Agree on roles and responsibilities', sort_order: 20 },
  { stage: 1, category: 'Co-founder Agreement', title: 'Agree on equity split (even if tentative)', sort_order: 21 },
  { stage: 1, category: 'Co-founder Agreement', title: 'Agree on time commitment expectations', sort_order: 22 },

  // IP Awareness
  { stage: 1, category: 'IP Awareness', title: 'Identify what could become intellectual property (code, brand, data)', sort_order: 30 },
  { stage: 1, category: 'IP Awareness', title: 'Avoid building on unclear ownership (e.g. employer-owned work)', sort_order: 31 },
  { stage: 1, category: 'IP Awareness', title: 'Keep records of who created what', sort_order: 32 },

  // Market & Idea Validation
  { stage: 1, category: 'Market & Idea Validation', title: 'Do not rush to incorporate yet', sort_order: 40 },
  { stage: 1, category: 'Market & Idea Validation', title: 'Do not spend heavily on legal yet', sort_order: 41 },
  { stage: 1, category: 'Market & Idea Validation', title: 'Focus resources on learning, not structure', sort_order: 42 },

  // ── Stage 2: Discovery → Validation ────────────────────────────────────────
  // Core Progress
  { stage: 2, category: 'Core Progress', title: 'Build a minimal viable product (MVP)', sort_order: 0 },
  { stage: 2, category: 'Core Progress', title: 'Get 5–10 active users', sort_order: 1 },
  { stage: 2, category: 'Core Progress', title: 'Iterate quickly based on feedback', sort_order: 2 },
  { stage: 2, category: 'Core Progress', title: 'Test willingness to pay', sort_order: 3 },

  // Formal Co-founder Agreement (Critical)
  { stage: 2, category: 'Formal Co-founder Agreement', title: 'Finalize equity split', sort_order: 10 },
  { stage: 2, category: 'Formal Co-founder Agreement', title: 'Add vesting schedule (e.g. 4 years, 1-year cliff)', sort_order: 11 },
  { stage: 2, category: 'Formal Co-founder Agreement', title: 'Define decision-making structure', sort_order: 12 },
  { stage: 2, category: 'Formal Co-founder Agreement', title: 'Assign IP ownership to the future company', sort_order: 13 },

  // Company Formation
  { stage: 2, category: 'Company Formation', title: 'Decide when to incorporate (taking money, charging customers, or need contracts)', sort_order: 20 },
  { stage: 2, category: 'Company Formation', title: 'Choose legal structure (e.g. Canadian corporation or Delaware C-Corp)', sort_order: 21 },

  // IP Assignment
  { stage: 2, category: 'IP Assignment', title: 'Ensure all founders assign IP to the company', sort_order: 30 },
  { stage: 2, category: 'IP Assignment', title: 'Put IP assignment in writing', sort_order: 31 },

  // Basic Legal Setup
  { stage: 2, category: 'Basic Legal Setup', title: 'Founder agreements signed', sort_order: 40 },
  { stage: 2, category: 'Basic Legal Setup', title: 'NDA templates created if needed (use sparingly)', sort_order: 41 },
  { stage: 2, category: 'Basic Legal Setup', title: 'Basic Terms of Service / Privacy Policy if launching publicly', sort_order: 42 },

  // Equity Planning
  { stage: 2, category: 'Equity Planning', title: 'Set aside an option pool for future hires', sort_order: 50 },
  { stage: 2, category: 'Equity Planning', title: 'Keep cap table simple and clean', sort_order: 51 },
];

/** Status options for checklist items */
export const ITEM_STATUSES = [
  { id: 'not_started', label: 'Not Started', color: 'text-slate-400', bg: 'bg-slate-100', dot: 'bg-slate-300' },
  { id: 'in_progress', label: 'In Progress', color: 'text-amber-600', bg: 'bg-amber-50',  dot: 'bg-amber-400' },
  { id: 'complete',    label: 'Complete',    color: 'text-green-600', bg: 'bg-green-50',  dot: 'bg-green-500' },
  { id: 'custom',      label: 'Custom…',     color: 'text-blue-600',  bg: 'bg-blue-50',   dot: 'bg-blue-400'  },
];

export function getStatusConfig(status) {
  return ITEM_STATUSES.find(s => s.id === status) ?? ITEM_STATUSES[0];
}

/** Calculate stage completion ratio (0–1) */
export function stageCompletionRatio(items, stage) {
  const stageItems = items.filter(i => i.stage === stage);
  if (!stageItems.length) return 0;
  const done = stageItems.filter(i => i.status === 'complete').length;
  return done / stageItems.length;
}

/** Returns true if a stage is unlocked given current item states */
export function isStageUnlocked(items, stage) {
  if (stage <= 2) return true; // Stages 1 & 2 always accessible
  return stageCompletionRatio(items, stage - 1) >= STAGE_UNLOCK_THRESHOLD;
}
