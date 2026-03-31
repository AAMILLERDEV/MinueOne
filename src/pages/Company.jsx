import React, { useState, useEffect, useCallback } from 'react';
import { minus1 } from '@/api/minus1Client';
import { supabase } from '@/api/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, Building2, ClipboardList, ChevronDown, ChevronUp,
  Lock, Plus, Check, Circle, Pencil, Trash2, Link, CalendarDays,
  User, ChevronRight, X, Save, Users, Crown, UserPlus, Globe,
  Briefcase, ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  CHECKLIST_TEMPLATE, STAGE_LABELS, ITEM_STATUSES,
  getStatusConfig, stageCompletionRatio, isStageUnlocked,
} from '@/lib/checklistTemplate';
import TeamLinkManager from '@/components/team/TeamLinkManager';

// ── Constants ─────────────────────────────────────────────────────────────────

const VIEWABLE_STAGES = [1, 2];

const INDUSTRY_OPTIONS = [
  'SaaS', 'Fintech', 'Healthtech', 'Edtech', 'E-commerce', 'Marketplace',
  'Developer Tools', 'AI / ML', 'Crypto / Web3', 'Climate Tech', 'Consumer',
  'Enterprise', 'Media', 'Hardware', 'Other',
];

const STAGE_OPTIONS = [
  'Idea', 'Pre-seed', 'Seed', 'Series A', 'Series B+', 'Bootstrapped',
];

const MAX_COMPANIES = 3;

// ── Small shared components ────────────────────────────────────────────────────

function StatusDot({ status, customLabel, small = false }) {
  const cfg = getStatusConfig(status);
  const size = small ? 'w-2 h-2' : 'w-2.5 h-2.5';
  return (
    <span className="flex items-center gap-1.5">
      <span className={`${size} rounded-full flex-shrink-0 ${cfg.dot}`} />
      <span className={`text-xs font-medium ${cfg.color}`}>
        {status === 'custom' && customLabel ? customLabel : cfg.label}
      </span>
    </span>
  );
}

function ProgressBar({ ratio }) {
  const pct = Math.round(ratio * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-slate-400 w-8 text-right">{pct}%</span>
    </div>
  );
}

function MemberAvatar({ profile, size = 'md' }) {
  const dim = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';
  const txt = size === 'sm' ? 'text-[9px]' : 'text-xs';
  return (
    <div className={`${dim} rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0`}
      title={profile?.display_name}>
      {profile?.avatar_url
        ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
        : <span className={`${txt} font-bold text-slate-500`}>{profile?.display_name?.[0]}</span>}
    </div>
  );
}

// ── ChecklistItem ─────────────────────────────────────────────────────────────

function ChecklistItem({ item, members, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ ...item });
  const [saving, setSaving] = useState(false);

  const cfg = getStatusConfig(item.status);
  const assignee = members.find(m => m.profile?.id === item.assignee_profile_id)?.profile;

  const cycleStatus = () => {
    const order = ['not_started', 'in_progress', 'complete'];
    const next = order[(order.indexOf(item.status) + 1) % order.length];
    onUpdate(item.id, { status: next });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(item.id, {
        title: draft.title,
        notes: draft.notes,
        url: draft.url,
        due_date: draft.due_date || null,
        assignee_profile_id: draft.assignee_profile_id || null,
        status: draft.status,
        custom_label: draft.status === 'custom' ? draft.custom_label : null,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`rounded-xl border transition-colors ${expanded ? 'border-slate-300 bg-white shadow-sm' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-center gap-3 px-3 py-2.5">
        <button
          onClick={cycleStatus}
          title="Cycle status"
          className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
            ${item.status === 'complete' ? 'bg-green-500 border-green-500' : item.status === 'in_progress' ? 'border-amber-400' : 'border-slate-300'}`}
        >
          {item.status === 'complete' && <Check className="w-3 h-3 text-white" />}
          {item.status === 'in_progress' && <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />}
        </button>
        <span className={`flex-1 text-sm leading-snug ${item.status === 'complete' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
          {item.title}
        </span>
        {assignee && (
          <MemberAvatar profile={assignee} size="sm" />
        )}
        <button onClick={() => setExpanded(v => !v)} className="text-slate-300 hover:text-slate-500 flex-shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 px-3 py-3 space-y-3">
              {editing ? (
                <div className="space-y-2.5">
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Title</label>
                    <Input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} className="h-8 text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-slate-500 block mb-1">Status</label>
                      <select value={draft.status} onChange={e => setDraft(d => ({ ...d, status: e.target.value }))}
                        className="w-full h-8 text-xs border border-slate-200 rounded-lg px-2 bg-white">
                        {ITEM_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </div>
                    {draft.status === 'custom' && (
                      <div>
                        <label className="text-xs font-medium text-slate-500 block mb-1">Custom label</label>
                        <Input value={draft.custom_label || ''} onChange={e => setDraft(d => ({ ...d, custom_label: e.target.value }))}
                          placeholder="e.g. Blocked" className="h-8 text-xs" />
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-slate-500 block mb-1">Assignee</label>
                      <select value={draft.assignee_profile_id || ''}
                        onChange={e => setDraft(d => ({ ...d, assignee_profile_id: e.target.value || null }))}
                        className="w-full h-8 text-xs border border-slate-200 rounded-lg px-2 bg-white">
                        <option value="">Unassigned</option>
                        {members.map(m => m.profile && (
                          <option key={m.profile.id} value={m.profile.id}>{m.profile.display_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 block mb-1">Due date</label>
                      <Input type="date" value={draft.due_date || ''} onChange={e => setDraft(d => ({ ...d, due_date: e.target.value }))} className="h-8 text-xs" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Notes</label>
                    <Textarea value={draft.notes || ''} onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
                      placeholder="Add context, decisions, or progress notes…" rows={2} className="text-xs resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Link</label>
                    <Input type="url" value={draft.url || ''} onChange={e => setDraft(d => ({ ...d, url: e.target.value }))}
                      placeholder="https://…" className="h-8 text-xs" />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={handleSave} disabled={saving} className="h-7 text-xs bg-blue-600 hover:bg-blue-700">
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Save className="w-3 h-3 mr-1" />Save</>}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setEditing(false); setDraft({ ...item }); }} className="h-7 text-xs">Cancel</Button>
                    <button onClick={() => onDelete(item.id)} className="ml-auto text-red-400 hover:text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <StatusDot status={item.status} customLabel={item.custom_label} />
                    {assignee && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <User className="w-3 h-3" />{assignee.display_name}
                      </span>
                    )}
                    {item.due_date && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />{item.due_date}
                      </span>
                    )}
                  </div>
                  {item.notes && <p className="text-xs text-slate-600 leading-relaxed">{item.notes}</p>}
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 truncate">
                      <Link className="w-3 h-3 flex-shrink-0" /><span className="truncate">{item.url}</span>
                    </a>
                  )}
                  <button onClick={() => { setDraft({ ...item }); setEditing(true); }}
                    className="text-xs text-slate-400 hover:text-blue-600 flex items-center gap-1 pt-0.5">
                    <Pencil className="w-3 h-3" />Edit
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── ChecklistStage ────────────────────────────────────────────────────────────

function ChecklistStage({ stage, items, members, onUpdate, onDelete, onAddItem }) {
  const stageItems = items.filter(i => i.stage === stage);
  const ratio = stageCompletionRatio(items, stage);
  const categories = [...new Set(stageItems.map(i => i.category))];

  const [addingCategory, setAddingCategory] = useState(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);

  const handleAddItem = async (category) => {
    if (!newItemTitle.trim()) return;
    await onAddItem(stage, category, newItemTitle.trim());
    setNewItemTitle('');
    setAddingCategory(null);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !newItemTitle.trim()) return;
    await onAddItem(stage, newCategoryName.trim(), newItemTitle.trim());
    setNewCategoryName('');
    setNewItemTitle('');
    setShowNewCategory(false);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm font-semibold text-slate-900">{STAGE_LABELS[stage]?.label}</p>
            <p className="text-xs text-slate-500">{STAGE_LABELS[stage]?.goal}</p>
          </div>
          <span className="text-sm font-bold text-blue-600">
            {stageItems.filter(i => i.status === 'complete').length}/{stageItems.length}
          </span>
        </div>
        <ProgressBar ratio={ratio} />
      </div>

      {categories.map(category => {
        const catItems = stageItems.filter(i => i.category === category).sort((a, b) => a.sort_order - b.sort_order);
        return (
          <div key={category}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">{category}</p>
            <div className="space-y-1.5">
              {catItems.map(item => (
                <ChecklistItem key={item.id} item={item} members={members} onUpdate={onUpdate} onDelete={onDelete} />
              ))}
              {addingCategory === category ? (
                <div className="flex gap-2 px-1">
                  <Input autoFocus value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddItem(category); if (e.key === 'Escape') setAddingCategory(null); }}
                    placeholder="New item title…" className="h-8 text-xs" />
                  <Button size="sm" onClick={() => handleAddItem(category)} className="h-8 text-xs bg-blue-600 hover:bg-blue-700">Add</Button>
                  <Button size="sm" variant="outline" onClick={() => setAddingCategory(null)} className="h-8 text-xs"><X className="w-3 h-3" /></Button>
                </div>
              ) : (
                <button onClick={() => { setAddingCategory(category); setNewItemTitle(''); }}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-600 px-1 py-1 transition-colors">
                  <Plus className="w-3.5 h-3.5" />Add item
                </button>
              )}
            </div>
          </div>
        );
      })}

      {showNewCategory ? (
        <div className="border border-dashed border-slate-300 rounded-xl p-3 space-y-2">
          <Input autoFocus value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Category name…" className="h-8 text-xs" />
          <Input value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddCategory(); if (e.key === 'Escape') setShowNewCategory(false); }}
            placeholder="First item title…" className="h-8 text-xs" />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddCategory} className="h-7 text-xs bg-blue-600 hover:bg-blue-700">Add category</Button>
            <Button size="sm" variant="outline" onClick={() => setShowNewCategory(false)} className="h-7 text-xs">Cancel</Button>
          </div>
        </div>
      ) : (
        <button onClick={() => { setShowNewCategory(true); setNewCategoryName(''); setNewItemTitle(''); }}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-600 border border-dashed border-slate-200 rounded-xl px-3 py-2 w-full transition-colors">
          <Plus className="w-3.5 h-3.5" />Add category
        </button>
      )}
    </div>
  );
}

// ── CreateCompanyDialog ───────────────────────────────────────────────────────

function CreateCompanyDialog({ open, onOpenChange, myProfile, onCreated }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    website_url: myProfile?.website_url || '',
    industry: myProfile?.industry || '',
    stage: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setForm({
        name: '',
        description: '',
        website_url: myProfile?.website_url || '',
        industry: myProfile?.industry || '',
        stage: '',
      });
      setError('');
    }
  }, [open, myProfile]);

  const handleCreate = async () => {
    if (!form.name.trim()) { setError('Company name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const company = await minus1.entities.Company.create({
        name: form.name.trim(),
        description: form.description.trim() || null,
        website_url: form.website_url.trim() || null,
        industry: form.industry || null,
        stage: form.stage || null,
        created_by_profile_id: myProfile.id,
      });
      // Add creator as owner
      await minus1.entities.CompanyMember.create({
        company_id: company.id,
        profile_id: myProfile.id,
        role: 'owner',
      });
      onCreated(company);
      onOpenChange(false);
    } catch (err) {
      setError(err.message || 'Failed to create company.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create a company</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-1">
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Company name *</label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Acme Inc." className="h-9" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Industry</label>
              <select value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
                className="w-full h-9 text-sm border border-slate-200 rounded-lg px-2 bg-white">
                <option value="">Select…</option>
                {INDUSTRY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Stage</label>
              <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}
                className="w-full h-9 text-sm border border-slate-200 rounded-lg px-2 bg-white">
                <option value="">Select…</option>
                {STAGE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Website</label>
            <Input type="url" value={form.website_url} onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))}
              placeholder="https://…" className="h-9 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Description</label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What does your company do?" rows={2} className="text-sm resize-none" />
          </div>
          {(form.website_url && form.website_url === myProfile?.website_url) ||
           (form.industry && form.industry === myProfile?.industry) ? (
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Check className="w-3 h-3 text-green-500" />Pre-filled from your profile
            </p>
          ) : null}
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button onClick={handleCreate} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create company'}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── CreateTeamDialog ──────────────────────────────────────────────────────────

function CreateTeamDialog({ open, onOpenChange, companyId, companyMembers, matchedProfiles, onCreated, myProfile }) {
  const [name, setName] = useState('');
  const [selectedProfiles, setSelectedProfiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Combine employees + matches, deduplicate
  const allProfiles = [
    ...companyMembers.map(m => ({ ...m.profile, source: 'employee' })),
    ...matchedProfiles.filter(p => !companyMembers.some(m => m.profile?.id === p.id)).map(p => ({ ...p, source: 'match' })),
  ].filter(p => p?.id && p.id !== myProfile?.id);

  useEffect(() => {
    if (open) { setName(''); setSelectedProfiles([]); setError(''); }
  }, [open]);

  const toggleProfile = (id) => {
    setSelectedProfiles(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleCreate = async () => {
    if (!name.trim()) { setError('Team name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const team = await minus1.entities.Team.create({ name: name.trim(), company_id: companyId });
      // Add creator
      await minus1.entities.TeamMember.create({ team_id: team.id, profile_id: myProfile.id, role: 'admin' });
      // Add selected members
      for (const pid of selectedProfiles) {
        await minus1.entities.TeamMember.create({ team_id: team.id, profile_id: pid, role: 'member' });
      }
      onCreated(team);
      onOpenChange(false);
    } catch (err) {
      setError(err.message || 'Failed to create team.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create a team</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-1">
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Team name *</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Engineering, Legal" className="h-9" autoFocus />
          </div>
          {allProfiles.length > 0 && (
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-2">Add members</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {allProfiles.map(p => (
                  <button key={p.id} type="button" onClick={() => toggleProfile(p.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-colors
                      ${selectedProfiles.includes(p.id) ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                    <MemberAvatar profile={p} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{p.display_name}</p>
                      <p className="text-xs text-slate-400">{p.source === 'employee' ? 'Employee' : 'Match'}</p>
                    </div>
                    {selectedProfiles.includes(p.id) && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button onClick={handleCreate} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create team'}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Company page ─────────────────────────────────────────────────────────

export default function Company() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [myProfile, setMyProfile] = useState(null);

  // Companies
  const [companies, setCompanies] = useState([]); // [{ company, members: [{ profile, role }] }]
  const [activeCompanyId, setActiveCompanyId] = useState(null);

  // Tabs
  const [activeTab, setActiveTab] = useState('overview');

  // Teams within active company
  const [companyTeams, setCompanyTeams] = useState([]); // [{ team, members }]
  const [loadingTeams, setLoadingTeams] = useState(false);

  // Checklist
  const [checklistItems, setChecklistItems] = useState([]);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [activeStage, setActiveStage] = useState(1);

  // Matched profiles (for team creation)
  const [matchedProfiles, setMatchedProfiles] = useState([]);

  // Dialogs
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const user = await minus1.auth.me();
      const myProfiles = await minus1.entities.Profile.filter({ user_id: user.id });

      if (!myProfiles.length || !myProfiles[0].is_complete) {
        navigate(createPageUrl('Onboarding'));
        return;
      }

      const profile = myProfiles[0];
      setMyProfile(profile);

      // Load companies + their members
      const { data: memberships } = await supabase
        .from('company_members').select('company_id').eq('profile_id', profile.id);
      const companyIds = (memberships ?? []).map(m => m.company_id);

      if (companyIds.length) {
        const { data: companiesData } = await supabase
          .from('companies').select('*').in('id', companyIds).order('created_at', { ascending: false });
        const { data: allMembers } = await supabase
          .from('company_members')
          .select('*, profiles(id, display_name, avatar_url, profile_type)')
          .in('company_id', companyIds);

        const assembled = (companiesData ?? []).map(company => ({
          company,
          members: (allMembers ?? [])
            .filter(m => m.company_id === company.id)
            .map(m => ({ profile: m.profiles, role: m.role }))
            .filter(m => m.profile),
        }));

        setCompanies(assembled);
        if (assembled.length) setActiveCompanyId(assembled[0].company.id);
      }

      // Load matched profiles for team creation
      const { data: matches } = await supabase
        .from('matches')
        .select('profile_1_id, profile_2_id')
        .or(`profile_1_id.eq.${profile.id},profile_2_id.eq.${profile.id}`)
        .eq('status', 'matched');

      if (matches?.length) {
        const otherIds = matches.map(m => m.profile_1_id === profile.id ? m.profile_2_id : m.profile_1_id);
        const { data: matchedProfs } = await supabase
          .from('profiles').select('id, display_name, avatar_url, profile_type').in('id', otherIds);
        setMatchedProfiles(matchedProfs ?? []);
      }
    } catch (error) {
      console.error('Error loading company data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load teams for active company
  const loadCompanyTeams = useCallback(async (companyId) => {
    if (!companyId) return;
    setLoadingTeams(true);
    try {
      const { data: teamsData } = await supabase
        .from('teams').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
      if (!teamsData?.length) { setCompanyTeams([]); return; }

      const teamIds = teamsData.map(t => t.id);
      const { data: allMembers } = await supabase
        .from('team_members')
        .select('*, profiles(id, display_name, avatar_url, profile_type)')
        .in('team_id', teamIds);

      setCompanyTeams(teamsData.map(team => ({
        team,
        members: (allMembers ?? [])
          .filter(m => m.team_id === team.id)
          .map(m => ({ profile: m.profiles, role: m.role }))
          .filter(m => m.profile),
      })));
    } catch (err) {
      console.error('Error loading teams:', err);
    } finally {
      setLoadingTeams(false);
    }
  }, []);

  // Load checklist for active company
  const loadChecklist = useCallback(async (companyId) => {
    if (!companyId) return;
    setChecklistLoading(true);
    try {
      const { data: items, error } = await supabase
        .from('company_checklist_items')
        .select('*')
        .eq('company_id', companyId)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      if (!items?.length) {
        const seeds = CHECKLIST_TEMPLATE.map(t => ({ ...t, company_id: companyId, is_from_template: true }));
        const { data: seeded } = await supabase.from('company_checklist_items').insert(seeds).select();
        setChecklistItems(seeded ?? []);
      } else {
        setChecklistItems(items);
      }
    } catch (err) {
      console.error('Error loading checklist:', err);
    } finally {
      setChecklistLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'teams' && activeCompanyId) loadCompanyTeams(activeCompanyId);
  }, [activeTab, activeCompanyId, loadCompanyTeams]);

  useEffect(() => {
    if (activeTab === 'checklist' && activeCompanyId) loadChecklist(activeCompanyId);
  }, [activeTab, activeCompanyId, loadChecklist]);

  // ── Checklist actions ──────────────────────────────────────────────────────

  const handleUpdateItem = async (id, updates) => {
    setChecklistItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    await minus1.entities.CompanyChecklistItem.update(id, updates);
  };

  const handleDeleteItem = async (id) => {
    setChecklistItems(prev => prev.filter(i => i.id !== id));
    await minus1.entities.CompanyChecklistItem.delete(id);
  };

  const handleAddItem = async (stage, category, title) => {
    const maxOrder = Math.max(
      0,
      ...checklistItems.filter(i => i.stage === stage && i.category === category).map(i => i.sort_order)
    );
    const newItem = await minus1.entities.CompanyChecklistItem.create({
      company_id: activeCompanyId,
      stage,
      category,
      title,
      status: 'not_started',
      sort_order: maxOrder + 1,
      is_from_template: false,
    });
    setChecklistItems(prev => [...prev, newItem]);
  };

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleCompanyCreated = (company) => {
    if (companies.length >= MAX_COMPANIES) return; // safety guard
    loadData();
    setActiveCompanyId(company.id);
    setActiveTab('overview');
  };

  const handleTeamCreated = () => {
    loadCompanyTeams(activeCompanyId);
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const isFounderOrCollaborator = ['founder', 'collaborator'].includes(myProfile?.profile_type);
  const activeCompanyData = companies.find(c => c.company.id === activeCompanyId);
  const activeCompany = activeCompanyData?.company;
  const members = activeCompanyData?.members ?? [];
  const isOwner = members.some(m => m.profile?.id === myProfile?.id && m.role === 'owner');

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'teams', label: 'Teams' },
    { id: 'checklist', label: 'Checklist' },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-24">
      <div className="max-w-lg mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Company
          </h1>
          {companies.length > 0 && (
            <div className="flex items-center gap-2">
              {/* Company switcher */}
              {companies.length > 1 && (
                <select
                  value={activeCompanyId || ''}
                  onChange={e => { setActiveCompanyId(e.target.value); setActiveTab('overview'); }}
                  className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700"
                >
                  {companies.map(({ company }) => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              )}
              {/* Create additional company */}
              {isFounderOrCollaborator && (
                <div className="flex flex-col items-end gap-0.5">
                  <Button
                    size="sm"
                    onClick={() => setShowCreateCompany(true)}
                    disabled={companies.length >= MAX_COMPANIES}
                    className="bg-blue-600 hover:bg-blue-700 gap-1.5 disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />New
                  </Button>
                  {companies.length >= MAX_COMPANIES && (
                    <p className="text-[10px] text-slate-400">Limit: {MAX_COMPANIES} companies</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Non-founder placeholder */}
        {!isFounderOrCollaborator && companies.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">For Founders & Collaborators</h3>
            <p className="text-slate-500 text-sm">
              The Company tab guides founding teams from idea to launch. Match with a founder or collaborator to get started.
            </p>
          </motion.div>
        ) : companies.length === 0 ? (
          /* No companies yet */
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No company yet</h3>
            <p className="text-slate-500 text-sm mb-5">
              Create your company to track your development journey, manage your team, and stay on top of key milestones.
            </p>
            <Button onClick={() => setShowCreateCompany(true)} className="bg-gradient-to-r from-blue-600 to-cyan-500">
              Create your company
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Active company name (when only one) */}
            {companies.length === 1 && (
              <div className="flex items-center gap-3 mb-4 px-1">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">{activeCompany?.name}</h2>
                  {activeCompany?.industry && (
                    <p className="text-xs text-slate-500">{activeCompany.industry}{activeCompany.stage ? ` · ${activeCompany.stage}` : ''}</p>
                  )}
                </div>
              </div>
            )}

            {/* Tab navigation */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-5">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Overview tab ─────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Company details card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                  {activeCompany?.description && (
                    <p className="text-sm text-slate-600">{activeCompany.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3">
                    {activeCompany?.industry && (
                      <span className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Briefcase className="w-3.5 h-3.5" />{activeCompany.industry}
                      </span>
                    )}
                    {activeCompany?.stage && (
                      <span className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Building2 className="w-3.5 h-3.5" />{activeCompany.stage}
                      </span>
                    )}
                    {activeCompany?.website_url && (
                      <a href={activeCompany.website_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                        <Globe className="w-3.5 h-3.5" />{activeCompany.website_url.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                </div>

                {/* Employees */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      Employees
                      <span className="text-xs font-normal text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">{members.length}</span>
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {members.map(({ profile, role }) => (
                      <div key={profile.id} className="flex items-center gap-3">
                        <MemberAvatar profile={profile} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{profile.display_name}</p>
                          <p className="text-xs text-slate-400 capitalize">{profile.profile_type?.replace('_', ' ')}</p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          role === 'owner' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {role === 'owner' ? 'Owner' : 'Employee'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team Collaboration */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 text-purple-500" />
                    Team Collaboration
                  </h3>
                  <TeamLinkManager
                    myProfile={myProfile}
                    isPremium={myProfile?.is_premium || ['premium', 'pro', 'business', 'enterprise'].includes(myProfile?.subscription_tier)}
                    onUpgrade={() => {}}
                  />
                </div>
              </motion.div>
            )}

            {/* ── Teams tab ────────────────────────────────────────────── */}
            {activeTab === 'teams' && (
              <motion.div key="teams" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">Teams work together on specific goals within your company.</p>
                  {isOwner && (
                    <Button size="sm" onClick={() => setShowCreateTeam(true)} className="bg-blue-600 hover:bg-blue-700 gap-1.5 flex-shrink-0">
                      <Plus className="w-3.5 h-3.5" />New team
                    </Button>
                  )}
                </div>

                {loadingTeams ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  </div>
                ) : companyTeams.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="font-semibold text-slate-800 mb-1">No teams yet</h3>
                    <p className="text-sm text-slate-500 mb-4">Create a team to organise employees and matches around specific work.</p>
                    {isOwner && (
                      <Button size="sm" onClick={() => setShowCreateTeam(true)} className="bg-blue-600 hover:bg-blue-700">
                        Create first team
                      </Button>
                    )}
                  </div>
                ) : (
                  companyTeams.map(({ team, members: tm }) => (
                    <div key={team.id} className="bg-white rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <Users className="w-4.5 h-4.5 text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{team.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex -space-x-1">
                              {tm.slice(0, 5).map(({ profile }) => (
                                <MemberAvatar key={profile.id} profile={profile} size="sm" />
                              ))}
                            </div>
                            <p className="text-xs text-slate-400">{tm.length} member{tm.length !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {/* ── Checklist tab ─────────────────────────────────────────── */}
            {activeTab === 'checklist' && (
              <motion.div key="checklist" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                {checklistLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Stage selector */}
                    <div className="flex gap-1 overflow-x-auto pb-1">
                      {[1, 2, 3, 4, 5].map(stage => {
                        const unlocked = isStageUnlocked(checklistItems, stage);
                        const isActive = activeStage === stage;
                        const hasTemplate = VIEWABLE_STAGES.includes(stage);
                        return (
                          <button
                            key={stage}
                            onClick={() => unlocked && hasTemplate && setActiveStage(stage)}
                            disabled={!unlocked || !hasTemplate}
                            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all
                              ${isActive && unlocked
                                ? 'bg-blue-600 text-white shadow-sm'
                                : unlocked && hasTemplate
                                  ? 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
                                  : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                              }`}
                          >
                            {(!unlocked || !hasTemplate) && <Lock className="w-2.5 h-2.5" />}
                            {STAGE_LABELS[stage]?.label}
                          </button>
                        );
                      })}
                    </div>

                    {activeStage === 1 && isStageUnlocked(checklistItems, 2) && (
                      <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-xs text-green-700 flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 flex-shrink-0" />Stage 2 is now unlocked — great progress!
                      </div>
                    )}
                    {activeStage === 1 && !isStageUnlocked(checklistItems, 2) && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 flex items-center gap-2">
                        <Lock className="w-3 h-3 flex-shrink-0" />Complete 50% of Stage 1 to unlock Stage 2
                      </div>
                    )}

                    <ChecklistStage
                      stage={activeStage}
                      items={checklistItems}
                      members={members}
                      onUpdate={handleUpdateItem}
                      onDelete={handleDeleteItem}
                      onAddItem={handleAddItem}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      <CreateCompanyDialog
        open={showCreateCompany}
        onOpenChange={setShowCreateCompany}
        myProfile={myProfile}
        onCreated={handleCompanyCreated}
      />
      <CreateTeamDialog
        open={showCreateTeam}
        onOpenChange={setShowCreateTeam}
        companyId={activeCompanyId}
        companyMembers={members}
        matchedProfiles={matchedProfiles}
        myProfile={myProfile}
        onCreated={handleTeamCreated}
      />
    </div>
  );
}
