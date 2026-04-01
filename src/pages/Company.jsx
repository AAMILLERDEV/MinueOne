import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNotifications } from '@/lib/NotificationsContext';
import { minus1 } from '@/api/minus1Client';
import { supabase } from '@/api/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, Building2, ClipboardList, ChevronDown, ChevronUp,
  Lock, Plus, Check, Circle, Pencil, Trash2, Link, CalendarDays,
  User, ChevronRight, X, Save, Users, Crown, UserPlus, Globe,
  Briefcase, ArrowLeft, Send, MessageCircle, Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  STAGE_LABELS, ITEM_STATUSES,
  getStatusConfig, stageCompletionRatio, isStageUnlocked,
} from '@/lib/checklistTemplate';

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
    <div className={`rounded-xl border transition-all ${expanded ? 'border-slate-300 bg-white shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={cycleStatus}
          title="Cycle status"
          className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
            ${item.status === 'complete' ? 'bg-green-500 border-green-500' : item.status === 'in_progress' ? 'border-amber-400 bg-amber-50' : 'border-slate-300 hover:border-slate-400'}`}
        >
          {item.status === 'complete' && <Check className="w-3 h-3 text-white" />}
          {item.status === 'in_progress' && <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />}
        </button>
        <span className={`flex-1 text-xs font-medium leading-snug tracking-[-0.01em] ${
          item.status === 'complete' ? 'line-through text-slate-400' :
          item.status === 'in_progress' ? 'text-slate-700' : 'text-slate-800'
        }`}>
          {item.title}
        </span>
        {assignee && <MemberAvatar profile={assignee} size="sm" />}
        <button onClick={() => setExpanded(v => !v)} className="text-slate-300 hover:text-slate-500 flex-shrink-0 transition-colors">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
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

function ChecklistStage({ stage, items, members, onUpdate, onDelete, onAddItem, defaultCollapsed = false }) {
  const stageItems = items.filter(i => i.stage === stage);
  const ratio = stageCompletionRatio(items, stage);
  const categories = [...new Set(stageItems.map(i => i.category))];

  const [collapsed, setCollapsed] = useState(defaultCollapsed);
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
      <button
        onClick={() => setCollapsed(v => !v)}
        className="w-full bg-white rounded-xl border border-slate-200 p-4 text-left hover:border-slate-300 transition-colors"
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm font-bold text-slate-900 tracking-tight">
              {STAGE_LABELS[stage]?.label}
              <span className="ml-2 text-xs font-normal text-slate-400">{STAGE_LABELS[stage]?.subtitle}</span>
            </p>
            <p className="text-xs text-slate-500 mt-0.5 font-normal">{STAGE_LABELS[stage]?.goal}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-blue-600">
              {stageItems.filter(i => i.status === 'complete').length}/{stageItems.length}
            </span>
            {collapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
          </div>
        </div>
        <ProgressBar ratio={ratio} />
      </button>

      {!collapsed && (
        <>
          {categories.map(category => {
            const catItems = stageItems.filter(i => i.category === category).sort((a, b) => a.sort_order - b.sort_order);
            return (
              <div key={category}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">{category}</p>
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
        </>
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

// ── EditCompanyDialog ─────────────────────────────────────────────────────────

function EditCompanyDialog({ open, onOpenChange, company, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && company) {
      setForm({
        name: company.name ?? '',
        description: company.description ?? '',
        website_url: company.website_url ?? '',
        industry: company.industry ?? '',
        stage: company.stage ?? '',
      });
      setError('');
    }
  }, [open, company]);

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Company name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const { data, error: err } = await supabase
        .from('companies')
        .update({
          name: form.name.trim(),
          description: form.description.trim() || null,
          website_url: form.website_url.trim() || null,
          industry: form.industry || null,
          stage: form.stage || null,
        })
        .eq('id', company.id)
        .select()
        .single();
      if (err) throw err;
      onSaved(data);
      onOpenChange(false);
    } catch (err) {
      setError(err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit company</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-1">
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Company name *</label>
            <Input value={form.name ?? ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-9" autoFocus />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Description</label>
            <Textarea value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="text-sm resize-none" placeholder="What does your company do?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Industry</label>
              <select value={form.industry ?? ''} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
                className="w-full h-9 text-sm border border-slate-200 rounded-lg px-2 bg-white">
                <option value="">Select…</option>
                {INDUSTRY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Stage</label>
              <select value={form.stage ?? ''} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}
                className="w-full h-9 text-sm border border-slate-200 rounded-lg px-2 bg-white">
                <option value="">Select…</option>
                {STAGE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Website</label>
            <Input value={form.website_url ?? ''} onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))} placeholder="https://…" className="h-9" />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save changes'}
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
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      const team = await minus1.entities.Team.create({ name: name.trim(), company_id: companyId, owner_profile_id: myProfile.id, code });
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

// ── TeamDetailPanel ───────────────────────────────────────────────────────────

function TeamDetailPanel({ team: initialTeam, members, myProfile, onBack, onMembersUpdate }) {
  const { createNotification } = useNotifications();
  const [team, setTeam] = useState(initialTeam);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [profilesCache, setProfilesCache] = useState({});
  const [showInvite, setShowInvite] = useState(false);
  const [inviteProfiles, setInviteProfiles] = useState([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteStatus, setInviteStatus] = useState({});
  const [inviteSearch, setInviteSearch] = useState('');
  const [pendingInvites, setPendingInvites] = useState([]);
  const [showPending, setShowPending] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const msgsEndRef = useRef(null);
  const realtimeRef = useRef(null);
  const fileInputRef = useRef(null);
  const isOwner = team.owner_profile_id === myProfile.id;

  useEffect(() => {
    // Clear pending status for the current user when they open the team
    supabase.from('team_members')
      .update({ status: 'active' })
      .eq('team_id', team.id)
      .eq('profile_id', myProfile.id)
      .eq('status', 'pending')
      .then(() => {});
  }, [team.id, myProfile.id]);

  useEffect(() => {
    loadMessages();
    const channel = supabase
      .channel(`team_chat:${team.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'team_group_messages',
        filter: `team_id=eq.${team.id}`,
      }, (payload) => {
        setMessages(prev => prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new]);
      })
      .subscribe();
    realtimeRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [team.id]);

  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    setLoadingMsgs(true);
    try {
      const { data } = await supabase
        .from('team_group_messages').select('*').eq('team_id', team.id).order('created_at', { ascending: true });
      setMessages(data ?? []);
      const senderIds = [...new Set((data ?? []).map(m => m.sender_profile_id))];
      const memberMap = {};
      members.forEach(({ profile }) => { if (profile) memberMap[profile.id] = profile; });
      if (senderIds.length) {
        const { data: profs } = await supabase
          .from('profiles').select('id, display_name, avatar_url').in('id', senderIds);
        (profs ?? []).forEach(p => { memberMap[p.id] = p; });
      }
      setProfilesCache(memberMap);
    } finally {
      setLoadingMsgs(false);
    }
  };

  const handleSend = async () => {
    if (!msgInput.trim() || sending) return;
    const content = msgInput.trim();
    setSending(true);
    setMsgInput('');
    try {
      const { data: msg } = await supabase
        .from('team_group_messages')
        .insert({ team_id: team.id, sender_profile_id: myProfile.id, content })
        .select().single();
      if (msg) {
        setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
        setProfilesCache(prev => ({ ...prev, [myProfile.id]: myProfile }));
      }
    } catch { setMsgInput(content); } finally { setSending(false); }
  };

  const handleOpenInvite = async () => {
    setShowInvite(true);
    setInviteSearch('');
    setShowPending(false);
    setInviteStatus({});
    setPendingInvites([]);
    setInviteLoading(true);
    try {
      // Load existing pending invites from DB
      const { data: pendingRows, error: pendingErr } = await supabase
        .from('team_members')
        .select('profile_id, profiles(id, display_name, avatar_url, profile_type)')
        .eq('team_id', team.id)
        .eq('status', 'pending');
      if (!pendingErr) {
        setPendingInvites((pendingRows ?? []).map(r => r.profiles).filter(Boolean));
      }

      // Load matches available to invite (excluding existing members)
      const { data: matches } = await supabase
        .from('matches')
        .select('id, from_profile_id, to_profile_id')
        .or(`from_profile_id.eq.${myProfile.id},to_profile_id.eq.${myProfile.id}`)
        .eq('status', 'matched');

      const matchMap = {};
      (matches ?? []).forEach(m => {
        const otherId = m.from_profile_id === myProfile.id ? m.to_profile_id : m.from_profile_id;
        matchMap[otherId] = m.id;
      });

      const currentIds = new Set(activeMembers.map(m => m.profile?.id).filter(Boolean));
      const otherIds = Object.keys(matchMap).filter(id => !currentIds.has(id));

      if (otherIds.length) {
        const { data: profs } = await supabase
          .from('profiles').select('id, display_name, avatar_url, profile_type').in('id', otherIds);
        setInviteProfiles((profs ?? []).map(p => ({ ...p, matchId: matchMap[p.id], source: 'match' })));
      } else {
        setInviteProfiles([]);
      }
    } finally {
      setInviteLoading(false);
    }
  };

  const handleAddMember = async (profile) => {
    setInviteStatus(prev => ({ ...prev, [profile.id]: 'adding' }));
    try {
      await supabase.from('team_members').insert({ team_id: team.id, profile_id: profile.id, role: 'member', status: 'pending' });
      if (profile.matchId) {
        await supabase.from('messages').insert({
          match_id: profile.matchId, sender_profile_id: myProfile.id,
          content: `👋 I've added you to the "${team.name}" team on Minus1! Check the Company tab.`,
        });
      }
      await createNotification({
        profileId: profile.id,
        type: 'team_invite',
        title: 'Team invitation',
        body: `${myProfile.display_name} invited you to join "${team.name}"`,
        data: { team_id: team.id, team_name: team.name },
      });
      setInviteStatus(prev => ({ ...prev, [profile.id]: 'added' }));
      setInviteProfiles(prev => prev.filter(p => p.id !== profile.id));
      setPendingInvites(prev => [...prev, profile]);
      onMembersUpdate();
    } catch {
      setInviteStatus(prev => ({ ...prev, [profile.id]: null }));
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const url = await minus1.storage.uploadFile(file, `teams/${team.id}`);
      await supabase.from('teams').update({ photo_url: url }).eq('id', team.id);
      setTeam(prev => ({ ...prev, photo_url: url }));
    } catch (err) {
      console.error('Photo upload failed:', err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const activeMembers = members.filter(m => m.status !== 'pending');

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 overflow-hidden bg-white" style={{ height: 'calc(100vh - 260px)', minHeight: '480px' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 flex-shrink-0">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-4.5 h-4.5" />
        </button>
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
            {team.photo_url
              ? <img src={team.photo_url} className="w-full h-full object-cover" alt="" />
              : <Users className="w-4 h-4 text-slate-400" />}
          </div>
          {isOwner && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700"
              >
                {uploadingPhoto ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Camera className="w-2.5 h-2.5" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 truncate">{team.name}</p>
          <p className="text-xs text-slate-400">{activeMembers.length} member{activeMembers.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={handleOpenInvite}
          className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 transition-colors"
          title="Invite members"
        >
          <UserPlus className="w-4 h-4" />
        </button>
      </div>

      {/* Invite dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-purple-600" />
              Invite to {team.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-1">
            <Input
              autoFocus
              placeholder="Search matches…"
              value={inviteSearch}
              onChange={e => setInviteSearch(e.target.value)}
              className="h-9"
            />

            {/* Pending invites label */}
            {pendingInvites.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowPending(v => !v)}
                  className="w-full flex items-center justify-between px-3 py-2 text-left"
                >
                  <span className="text-xs font-medium text-amber-700">
                    {pendingInvites.length} pending invite{pendingInvites.length !== 1 ? 's' : ''} sent
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-amber-500 transition-transform ${showPending ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showPending && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="border-t border-amber-200 px-3 py-2 space-y-1.5">
                        {pendingInvites.map(p => (
                          <div key={p.id} className="flex items-center gap-2.5">
                            <MemberAvatar profile={p} size="sm" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-700 truncate">{p.display_name}</p>
                              <p className="text-[10px] text-slate-400 capitalize">{p.profile_type?.replace('_', ' ')}</p>
                            </div>
                            <span className="text-[10px] text-amber-600 font-medium flex-shrink-0">Invite sent</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div className="space-y-1.5 max-h-72 overflow-y-auto -mx-1 px-1">
              {inviteLoading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading matches…</span>
                </div>
              ) : (() => {
                const q = inviteSearch.trim().toLowerCase();
                const filtered = inviteProfiles.filter(p =>
                  !q || p.display_name?.toLowerCase().includes(q) || p.profile_type?.toLowerCase().includes(q)
                );
                if (filtered.length === 0) return (
                  <p className="text-sm text-slate-400 text-center py-6">
                    {q ? 'No matches found.' : 'No one left to invite.'}
                  </p>
                );
                return filtered.map(p => (
                  <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-200 bg-white">
                    <MemberAvatar profile={p} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{p.display_name}</p>
                      <p className="text-xs text-slate-400 capitalize">{p.profile_type?.replace('_', ' ')}</p>
                    </div>
                    <button
                      onClick={() => handleAddMember(p)}
                      disabled={inviteStatus[p.id] === 'adding' || inviteStatus[p.id] === 'added'}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex-shrink-0 ${
                        inviteStatus[p.id] === 'added' ? 'bg-green-100 text-green-700' :
                        inviteStatus[p.id] === 'adding' ? 'bg-slate-100 text-slate-400' :
                        'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      {inviteStatus[p.id] === 'added' ? 'Added ✓' : inviteStatus[p.id] === 'adding' ? '…' : 'Add'}
                    </button>
                  </div>
                ));
              })()}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Members strip */}
      <div className="px-4 py-2 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          {activeMembers.map(({ profile, role }) => (
            <div key={profile.id} className="flex flex-col items-center gap-0.5 flex-shrink-0">
              <div className="relative">
                <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                  {profile.avatar_url
                    ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
                    : <span className="text-xs font-bold text-slate-500">{profile.display_name?.[0]}</span>}
                </div>
                {role === 'admin' && <Crown className="w-2.5 h-2.5 text-amber-500 absolute -top-0.5 -right-0.5" />}
              </div>
              <p className="text-[9px] text-slate-400 max-w-[40px] truncate">{profile.display_name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50">
        {loadingMsgs ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="w-8 h-8 text-slate-200 mb-2" />
            <p className="text-sm text-slate-400">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map(msg => {
            const sender = profilesCache[msg.sender_profile_id];
            const isMe = msg.sender_profile_id === myProfile.id;
            return (
              <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                {!isMe && (
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {sender?.avatar_url
                      ? <img src={sender.avatar_url} className="w-full h-full object-cover" alt="" />
                      : <span className="text-xs font-bold text-slate-500">{sender?.display_name?.[0]}</span>}
                  </div>
                )}
                <div className={`max-w-[72%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && sender && (
                    <p className="text-[10px] text-slate-400 mb-0.5 px-1">{sender.display_name}</p>
                  )}
                  <div className={`px-3 py-2 rounded-2xl text-sm leading-snug ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'}`}>
                    {msg.content}
                  </div>
                  <p className="text-[10px] text-slate-300 mt-0.5 px-1">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={msgsEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-slate-200">
        <div className="flex gap-2">
          <input
            value={msgInput}
            onChange={e => setMsgInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={`Message ${team.name}…`}
            className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 bg-slate-50"
          />
          <button
            onClick={handleSend}
            disabled={!msgInput.trim() || sending}
            className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 flex-shrink-0 transition-colors"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Company page ─────────────────────────────────────────────────────────

export default function Company() {
  const navigate = useNavigate();
  const { createNotification } = useNotifications();
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

  // Matched profiles (for team creation)
  const [matchedProfiles, setMatchedProfiles] = useState([]);

  // Selected team detail
  const [selectedCompanyTeamId, setSelectedCompanyTeamId] = useState(null);

  // Dialogs
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showEditCompany, setShowEditCompany] = useState(false);

  // Company member invite
  const [showInviteEmployee, setShowInviteEmployee] = useState(false);
  const [inviteEmpProfiles, setInviteEmpProfiles] = useState([]);
  const [inviteEmpLoading, setInviteEmpLoading] = useState(false);
  const [inviteEmpStatus, setInviteEmpStatus] = useState({});
  const [inviteEmpSearch, setInviteEmpSearch] = useState('');

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
          .map(m => ({ profile: m.profiles, role: m.role, status: m.status ?? 'active' }))
          .filter(m => m.profile),
      })));
    } catch (err) {
      console.error('Error loading teams:', err);
    } finally {
      setLoadingTeams(false);
    }
  }, []);

  // Load checklist for active company — items are stored per team (team_id).
  // Seeding is handled by the DB trigger (seed_team_checklist) on team creation,
  // but we call it here as a fallback for teams that predate the trigger.
  const loadChecklist = useCallback(async (companyId) => {
    if (!companyId) return;
    setChecklistLoading(true);
    try {
      // Get all teams belonging to this company
      const { data: teams } = await supabase
        .from('teams').select('id').eq('company_id', companyId);
      const teamIds = (teams ?? []).map(t => t.id);

      if (!teamIds.length) {
        setChecklistItems([]);
        return;
      }

      // Ensure each team has a full set of checklist rows (idempotent DB function)
      for (const tid of teamIds) {
        await supabase.rpc('seed_team_checklist', { p_team_id: tid });
      }

      // Load all items joined with their template data
      const { data } = await supabase
        .from('company_checklist_items')
        .select('*, checklist_template_items(stage, category, title, sort_order)')
        .in('team_id', teamIds);

      // Flatten template fields so the rest of the UI reads item.stage / item.title etc.
      setChecklistItems((data ?? []).map(row => ({
        ...row,
        stage:      row.checklist_template_items?.stage      ?? row.stage,
        category:   row.checklist_template_items?.category   ?? row.category,
        title:      row.checklist_template_items?.title      ?? row.title,
        sort_order: row.checklist_template_items?.sort_order ?? row.sort_order,
      })));
    } catch (err) {
      console.error('Error loading checklist:', err);
    } finally {
      setChecklistLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'teams' && activeCompanyId) {
      setSelectedCompanyTeamId(null);
      loadCompanyTeams(activeCompanyId);
    }
  }, [activeTab, activeCompanyId, loadCompanyTeams]);

  useEffect(() => {
    if (activeTab === 'checklist' && activeCompanyId) loadChecklist(activeCompanyId);
  }, [activeTab, activeCompanyId, loadChecklist]);

  // ── Checklist actions ──────────────────────────────────────────────────────

  const handleUpdateItem = async (id, updates) => {
    const prev = checklistItems.find(i => i.id === id);
    setChecklistItems(items => items.map(i => i.id === id ? { ...i, ...updates } : i));
    await supabase.from('company_checklist_items').update(updates).eq('id', id);
    if (updates.assignee_profile_id && updates.assignee_profile_id !== prev?.assignee_profile_id
        && updates.assignee_profile_id !== myProfile?.id) {
      const item = checklistItems.find(i => i.id === id);
      await createNotification({
        profileId: updates.assignee_profile_id,
        type: 'checklist_assignment',
        title: 'Checklist item assigned',
        body: `You've been assigned "${item?.title ?? 'a checklist item'}"`,
        data: { item_id: id, company_id: activeCompanyId },
      });
    }
  };

  const handleDeleteItem = async (id) => {
    setChecklistItems(prev => prev.filter(i => i.id !== id));
    await supabase.from('company_checklist_items').delete().eq('id', id);
  };

  const handleAddItem = async (stage, category, title) => {
    // Find a team_id to attach the custom item to
    const { data: teams } = await supabase
      .from('teams').select('id').eq('company_id', activeCompanyId).limit(1);
    const teamId = teams?.[0]?.id;
    if (!teamId) return;
    const maxOrder = checklistItems
      .filter(i => i.stage === stage && i.category === category)
      .reduce((m, i) => Math.max(m, i.sort_order ?? 0), -1);
    const { data } = await supabase
      .from('company_checklist_items')
      .insert({ team_id: teamId, stage, category, title, status: 'not_started', sort_order: maxOrder + 1 })
      .select('*, checklist_template_items(stage, category, title, sort_order)')
      .single();
    if (data) setChecklistItems(prev => [...prev, {
      ...data,
      stage:      data.checklist_template_items?.stage      ?? data.stage,
      category:   data.checklist_template_items?.category   ?? data.category,
      title:      data.checklist_template_items?.title      ?? data.title,
      sort_order: data.checklist_template_items?.sort_order ?? data.sort_order,
    }]);
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

  const handleCompanySaved = (updated) => {
    setCompanies(prev => prev.map(c =>
      c.company.id === updated.id ? { ...c, company: updated } : c
    ));
  };

  const handleOpenInviteEmployee = async () => {
    setShowInviteEmployee(true);
    setInviteEmpSearch('');
    setInviteEmpStatus({});
    setInviteEmpProfiles([]);
    setInviteEmpLoading(true);
    try {
      const { data: matches } = await supabase
        .from('matches')
        .select('id, from_profile_id, to_profile_id')
        .or(`from_profile_id.eq.${myProfile.id},to_profile_id.eq.${myProfile.id}`)
        .eq('status', 'matched');

      const matchMap = {};
      (matches ?? []).forEach(m => {
        const otherId = m.from_profile_id === myProfile.id ? m.to_profile_id : m.from_profile_id;
        matchMap[otherId] = m.id;
      });

      const currentIds = new Set(members.map(m => m.profile?.id).filter(Boolean));
      const otherIds = Object.keys(matchMap).filter(id => !currentIds.has(id));

      if (otherIds.length) {
        const { data: profs } = await supabase
          .from('profiles').select('id, display_name, avatar_url, profile_type').in('id', otherIds);
        setInviteEmpProfiles((profs ?? []).map(p => ({ ...p, matchId: matchMap[p.id] })));
      }
    } finally {
      setInviteEmpLoading(false);
    }
  };

  const handleAddEmployee = async (profile) => {
    setInviteEmpStatus(prev => ({ ...prev, [profile.id]: 'adding' }));
    try {
      await supabase.from('company_members').insert({
        company_id: activeCompanyId, profile_id: profile.id, role: 'member',
      });
      await createNotification({
        profileId: profile.id,
        type: 'team_invite',
        title: 'Company invitation',
        body: `${myProfile.display_name} added you to "${activeCompany?.name}"`,
        data: { company_id: activeCompanyId, company_name: activeCompany?.name },
      });
      setInviteEmpStatus(prev => ({ ...prev, [profile.id]: 'added' }));
      setInviteEmpProfiles(prev => prev.filter(p => p.id !== profile.id));
      // Reload company data to reflect new member
      const { data: updatedMembers } = await supabase
        .from('company_members')
        .select('role, profile_id, profiles(id, display_name, avatar_url, profile_type)')
        .eq('company_id', activeCompanyId);
      setCompanies(prev => prev.map(c =>
        c.company.id === activeCompanyId
          ? { ...c, members: (updatedMembers ?? []).map(m => ({ role: m.role, profile: m.profiles, status: 'active' })) }
          : c
      ));
    } catch {
      setInviteEmpStatus(prev => ({ ...prev, [profile.id]: null }));
    }
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
                  <div className="flex items-center gap-2">
                    {isOwner && (
                      <Button size="sm" onClick={() => setShowCreateTeam(true)} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5">
                        <Plus className="w-3.5 h-3.5" />New team
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => setShowCreateCompany(true)}
                      disabled={companies.length >= MAX_COMPANIES}
                      className="bg-blue-600 hover:bg-blue-700 gap-1.5 disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />New company
                    </Button>
                  </div>
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
                  <div className="flex items-start justify-between">
                    {activeCompany?.description
                      ? <p className="text-sm text-slate-600 flex-1">{activeCompany.description}</p>
                      : <span />}
                    {isOwner && (
                      <button
                        onClick={() => setShowEditCompany(true)}
                        className="ml-2 flex-shrink-0 p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit company info"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
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
                    {isOwner && (
                      <button
                        onClick={handleOpenInviteEmployee}
                        className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Add Member
                      </button>
                    )}
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
              </motion.div>
            )}

            {/* ── Teams tab ────────────────────────────────────────────── */}
            {activeTab === 'teams' && (
              <motion.div key="teams" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                {selectedCompanyTeamId ? (
                  (() => {
                    const teamData = companyTeams.find(t => t.team.id === selectedCompanyTeamId);
                    if (!teamData) return null;
                    return (
                      <TeamDetailPanel
                        team={teamData.team}
                        members={teamData.members}
                        myProfile={myProfile}
                        onBack={() => setSelectedCompanyTeamId(null)}
                        onMembersUpdate={() => loadCompanyTeams(activeCompanyId)}
                      />
                    );
                  })()
                ) : (
                  <>
                    <p className="text-sm text-slate-500">Teams work together on specific goals within your company.</p>

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
                        <button
                          key={team.id}
                          onClick={() => setSelectedCompanyTeamId(team.id)}
                          className="w-full bg-white rounded-2xl border border-slate-200 p-4 text-left hover:border-blue-300 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0">
                              {team.photo_url
                                ? <img src={team.photo_url} className="w-full h-full object-cover" alt="" />
                                : <Users className="w-4 h-4 text-slate-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 truncate">{team.name}</p>
                              {(() => {
                                const activeCount = tm.filter(m => m.status !== 'pending');
                                return (
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="flex -space-x-1">
                                      {activeCount.slice(0, 5).map(({ profile }) => (
                                        <MemberAvatar key={profile.id} profile={profile} size="sm" />
                                      ))}
                                    </div>
                                    <p className="text-xs text-slate-400">{activeCount.length} member{activeCount.length !== 1 ? 's' : ''}</p>
                                  </div>
                                );
                              })()}
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                          </div>
                        </button>
                      ))
                    )}
                  </>
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
                    {/* Viewable stages — collapsible */}
                    {VIEWABLE_STAGES.map((stage, idx) => (
                      <ChecklistStage
                        key={stage}
                        stage={stage}
                        items={checklistItems}
                        members={members}
                        onUpdate={handleUpdateItem}
                        onDelete={handleDeleteItem}
                        onAddItem={handleAddItem}
                        defaultCollapsed={idx > 0}
                      />
                    ))}

                    {/* Locked future stages */}
                    {[3, 4, 5].map(stage => (
                      <div key={stage} className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex items-center justify-between opacity-60">
                        <div>
                          <p className="text-sm font-semibold text-slate-500 flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5" />{STAGE_LABELS[stage]?.label}
                            <span className="text-xs font-normal">{STAGE_LABELS[stage]?.subtitle}</span>
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">{STAGE_LABELS[stage]?.goal}</p>
                        </div>
                      </div>
                    ))}
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
      {activeCompany && (
        <EditCompanyDialog
          open={showEditCompany}
          onOpenChange={setShowEditCompany}
          company={activeCompany}
          onSaved={handleCompanySaved}
        />
      )}

      {/* Invite Employee Dialog */}
      <Dialog open={showInviteEmployee} onOpenChange={setShowInviteEmployee}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add member to {activeCompany?.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-3">
            <Input
              placeholder="Search matches…"
              value={inviteEmpSearch}
              onChange={e => setInviteEmpSearch(e.target.value)}
              className="h-9"
            />
            <div className="max-h-72 overflow-y-auto space-y-1 -mx-1 px-1">
              {inviteEmpLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                </div>
              ) : (() => {
                const q = inviteEmpSearch.trim().toLowerCase();
                const filtered = inviteEmpProfiles.filter(p =>
                  !q || p.display_name?.toLowerCase().includes(q) || p.profile_type?.toLowerCase().includes(q)
                );
                if (!filtered.length) return (
                  <p className="text-sm text-slate-400 text-center py-8">
                    {inviteEmpProfiles.length === 0 ? 'No matches available to add' : 'No results'}
                  </p>
                );
                return filtered.map(p => {
                  const st = inviteEmpStatus[p.id];
                  return (
                    <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50">
                      <MemberAvatar profile={p} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{p.display_name}</p>
                        <p className="text-xs text-slate-400 capitalize">{p.profile_type?.replace('_', ' ')}</p>
                      </div>
                      <button
                        onClick={() => handleAddEmployee(p)}
                        disabled={!!st}
                        className={`flex-shrink-0 flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                          st === 'added' ? 'bg-green-100 text-green-700' :
                          st === 'adding' ? 'bg-slate-100 text-slate-400' :
                          'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {st === 'adding' ? <Loader2 className="w-3 h-3 animate-spin" /> :
                         st === 'added' ? <Check className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                        {st === 'added' ? 'Added' : st === 'adding' ? 'Adding…' : 'Add'}
                      </button>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
