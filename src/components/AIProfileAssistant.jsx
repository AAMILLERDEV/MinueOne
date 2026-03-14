import React, { useState } from 'react';
import { minus1 } from '@/api/minus1Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, RefreshCw, Check, Lock, Wand2, MessageSquare, Target, Briefcase, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

export default function AIProfileAssistant({ profile, setProfile, isPremium = false, onUpgrade }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('sections'); // 'sections' | 'draft'
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [suggestions, setSuggestions] = useState(null);

  // Draft generator state
  const [draftInputs, setDraftInputs] = useState({ background: '', goals: '', expertise: '', company_idea: '' });
  const [draftResult, setDraftResult] = useState(null);

  const generateFullDraft = async () => {
    if (!isPremium) { onUpgrade?.(); return; }
    setLoading(true);
    setDraftResult(null);
    try {
      const result = await minus1.integrations.Core.InvokeLLM({
        prompt: `You are an expert profile writer for Minus1, a startup networking platform. Generate a compelling draft profile for a ${profile.profile_type || 'user'}.

User Inputs:
- Background/Experience: ${draftInputs.background || 'Not provided'}
- Goals on the platform: ${draftInputs.goals || 'Not provided'}
- Key Expertise/Skills: ${draftInputs.expertise || 'Not provided'}
- Company/Idea (if any): ${draftInputs.company_idea || 'Not provided'}
- Name: ${profile.display_name || 'Not provided'}
- Location: ${profile.location || 'Not provided'}
- Profile Type: ${profile.profile_type || 'founder'}

Generate:
1. A compelling 80-120 word professional bio that tells their story, highlights what makes them unique, and what they're looking for
2. 6-8 highly relevant primary skills (technical + soft skills matching their background)
3. 5-7 tags/interests that reflect their niche, style, or focus areas (e.g. "deep tech", "bootstrapped", "first-time founder")
4. If founder: a crisp 1-2 sentence problem statement based on their idea

Make it specific, human, and compelling — not generic. Reflect their actual background.`,
        response_json_schema: {
          type: "object",
          properties: {
            bio: { type: "string" },
            primary_skills: { type: "array", items: { type: "string" } },
            tags: { type: "array", items: { type: "string" } },
            problem_statement: { type: "string" }
          }
        }
      });
      setDraftResult(result);
    } catch (e) {
      console.error('Draft generation error:', e);
    } finally {
      setLoading(false);
    }
  };

  const applyDraft = () => {
    if (!draftResult) return;
    setProfile(p => ({
      ...p,
      bio: draftResult.bio || p.bio,
      primary_skills: draftResult.primary_skills || p.primary_skills,
      tags: draftResult.tags || p.tags,
      ...(draftResult.problem_statement && { problem_statement: draftResult.problem_statement }),
    }));
    setDraftResult(null);
    setIsOpen(false);
  };

  const sections = [
    { 
      id: 'bio', 
      label: 'Professional Bio', 
      icon: MessageSquare,
      prompt: 'bio and professional summary',
      field: 'bio'
    },
    { 
      id: 'problem', 
      label: 'Problem Statement', 
      icon: Target,
      prompt: 'startup problem statement',
      field: 'problem_statement',
      showFor: ['founder']
    },
    { 
      id: 'skills', 
      label: 'Skills & Expertise', 
      icon: Briefcase,
      prompt: 'key skills and expertise',
      field: 'primary_skills',
      isArray: true
    },
    { 
      id: 'thesis', 
      label: 'Investment Thesis', 
      icon: Target,
      prompt: 'investment thesis',
      field: 'investment_thesis',
      showFor: ['investor']
    }
  ];

  const filteredSections = sections.filter(s => 
    !s.showFor || s.showFor.includes(profile.profile_type)
  );

  const generateContent = async (section) => {
    if (!isPremium) {
      onUpgrade?.();
      return;
    }

    setActiveSection(section.id);
    setLoading(true);
    setSuggestions(null);

    try {
      const context = `
Profile Type: ${profile.profile_type}
Name: ${profile.display_name || 'Not provided'}
Location: ${profile.location || 'Not provided'}
Current Bio: ${profile.bio || 'Not provided'}
Industry/Focus: ${profile.investment_industries?.join(', ') || profile.focus_areas?.join(', ') || 'Not specified'}
Skills: ${profile.primary_skills?.join(', ') || 'Not specified'}
Stage: ${profile.stage || 'Not specified'}
User's additional context: ${userInput || 'None provided'}
      `;

      const response = await minus1.integrations.Core.InvokeLLM({
        prompt: `You are helping a ${profile.profile_type} create their profile for a startup matching platform called Minus1.

Context about the user:
${context}

Generate 3 different options for their ${section.prompt}. Each option should have a different tone/approach:
1. Professional and concise
2. Engaging and personable  
3. Bold and confident

${section.isArray ? 'For skills, return an array of 5-8 relevant skills for each option.' : 'Keep each option between 50-150 words.'}

Make it compelling for potential co-founders, investors, or collaborators.`,
        response_json_schema: {
          type: "object",
          properties: {
            options: {
              type: "array",
              items: section.isArray ? {
                type: "object",
                properties: {
                  tone: { type: "string" },
                  content: { type: "array", items: { type: "string" } }
                }
              } : {
                type: "object",
                properties: {
                  tone: { type: "string" },
                  content: { type: "string" }
                }
              }
            }
          }
        }
      });

      setSuggestions(response.options);
    } catch (error) {
      console.error('AI generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = (option, section) => {
    if (section.isArray) {
      setProfile(p => ({ ...p, [section.field]: option.content }));
    } else {
      setProfile(p => ({ ...p, [section.field]: option.content }));
    }
    setSuggestions(null);
    setActiveSection(null);
    setUserInput('');
  };

  if (!isOpen) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(true)}
        className={`w-full p-4 rounded-xl border-2 border-dashed transition-all ${
          isPremium 
            ? 'border-purple-300 bg-purple-50 hover:border-purple-400' 
            : 'border-slate-200 bg-slate-50 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isPremium ? 'bg-purple-100' : 'bg-slate-100'
          }`}>
            {isPremium ? (
              <Sparkles className="w-5 h-5 text-purple-600" />
            ) : (
              <Lock className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div className="text-left flex-1">
            <p className={`font-medium ${isPremium ? 'text-purple-900' : 'text-slate-700'}`}>
              AI Profile Assistant
            </p>
            <p className="text-sm text-slate-500">
              {isPremium ? 'Generate a full profile draft or get section suggestions' : 'Upgrade to Premium for AI assistance'}
            </p>
          </div>
          {!isPremium && <Badge className="bg-amber-500">Premium</Badge>}
        </div>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-purple-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-slate-900">AI Profile Assistant</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>Close</Button>
      </div>

      {!isPremium ? (
        <div className="p-4 text-center py-6">
          <Lock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 mb-4">Upgrade to Premium to unlock AI assistance</p>
          <Button onClick={onUpgrade} className="bg-gradient-to-r from-amber-500 to-orange-500">Upgrade Now</Button>
        </div>
      ) : (
        <>
          {/* Mode Toggle */}
          <div className="p-4 pb-0 flex gap-2">
            <button
              onClick={() => { setMode('draft'); setSuggestions(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${mode === 'draft' ? 'bg-purple-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-purple-300'}`}
            >
              <Zap className="w-4 h-4" />
              Generate Full Draft
            </button>
            <button
              onClick={() => { setMode('sections'); setDraftResult(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${mode === 'sections' ? 'bg-purple-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-purple-300'}`}
            >
              <Wand2 className="w-4 h-4" />
              Improve Sections
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* DRAFT MODE */}
            {mode === 'draft' && (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">Answer a few questions and AI will generate your full bio, skills, and tags.</p>
                
                <div>
                  <Label className="text-xs">Your background & experience</Label>
                  <Textarea
                    value={draftInputs.background}
                    onChange={e => setDraftInputs(d => ({ ...d, background: e.target.value }))}
                    placeholder="e.g. 8 years in B2B SaaS, previously VP Sales at a Series B startup..."
                    className="mt-1 h-16 bg-white text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Key expertise or skills</Label>
                  <Input
                    value={draftInputs.expertise}
                    onChange={e => setDraftInputs(d => ({ ...d, expertise: e.target.value }))}
                    placeholder="e.g. Go-to-market, product strategy, React, ML..."
                    className="mt-1 bg-white text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">What are you looking for on Minus1?</Label>
                  <Input
                    value={draftInputs.goals}
                    onChange={e => setDraftInputs(d => ({ ...d, goals: e.target.value }))}
                    placeholder="e.g. Technical co-founder for my fintech idea..."
                    className="mt-1 bg-white text-sm"
                  />
                </div>
                {profile.profile_type === 'founder' && (
                  <div>
                    <Label className="text-xs">Your startup idea (optional)</Label>
                    <Input
                      value={draftInputs.company_idea}
                      onChange={e => setDraftInputs(d => ({ ...d, company_idea: e.target.value }))}
                      placeholder="e.g. AI-powered expense management for SMBs..."
                      className="mt-1 bg-white text-sm"
                    />
                  </div>
                )}

                <Button
                  onClick={generateFullDraft}
                  disabled={loading || !draftInputs.background}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating...</> : <><Sparkles className="w-4 h-4 mr-2" />Generate My Profile</>}
                </Button>

                <AnimatePresence>
                  {draftResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3 bg-white rounded-xl border border-purple-200 p-4"
                    >
                      <p className="text-sm font-semibold text-purple-900">Your AI-generated profile draft:</p>
                      
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">Bio</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{draftResult.bio}</p>
                      </div>
                      
                      {draftResult.problem_statement && (
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-1">Problem Statement</p>
                          <p className="text-sm text-slate-700">{draftResult.problem_statement}</p>
                        </div>
                      )}

                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {draftResult.primary_skills?.map((s, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">Tags & Interests</p>
                        <div className="flex flex-wrap gap-1">
                          {draftResult.tags?.map((t, i) => (
                            <Badge key={i} className="text-xs bg-purple-100 text-purple-700 border-0">{t}</Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => { setDraftResult(null); generateFullDraft(); }} disabled={loading}>
                          <RefreshCw className="w-3 h-3 mr-1" />Regenerate
                        </Button>
                        <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={applyDraft}>
                          <Check className="w-3 h-3 mr-1" />Apply to Profile
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* SECTIONS MODE */}
            {mode === 'sections' && (
              <>
                <div>
                  <p className="text-sm text-slate-600 mb-2">Tell the AI about yourself (helps generate better content):</p>
                  <Textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="E.g., I have 10 years in fintech, previously founded a payments startup that was acquired..."
                    className="h-20 bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {filteredSections.map(section => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    return (
                      <button
                        key={section.id}
                        onClick={() => generateContent(section)}
                        disabled={loading && activeSection !== section.id}
                        className={`p-3 rounded-lg border text-left transition-all ${isActive ? 'border-purple-400 bg-purple-100' : 'border-slate-200 bg-white hover:border-purple-300'}`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-purple-600' : 'text-slate-500'}`} />
                          <span className="text-sm font-medium">{section.label}</span>
                        </div>
                        {isActive && loading && <Loader2 className="w-4 h-4 animate-spin text-purple-600 mt-2" />}
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {suggestions && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-700">Choose a suggestion:</p>
                        <Button size="sm" variant="ghost" onClick={() => generateContent(filteredSections.find(s => s.id === activeSection))} disabled={loading}>
                          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />Regenerate
                        </Button>
                      </div>
                      {suggestions.map((option, index) => {
                        const section = filteredSections.find(s => s.id === activeSection);
                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white rounded-lg border border-slate-200 p-3 hover:border-purple-300 transition-all"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline" className="text-xs">{option.tone}</Badge>
                              <Button size="sm" onClick={() => applySuggestion(option, section)} className="bg-purple-600 hover:bg-purple-700 h-7">
                                <Check className="w-3 h-3 mr-1" />Use This
                              </Button>
                            </div>
                            {section?.isArray ? (
                              <div className="flex flex-wrap gap-1">
                                {option.content.map((item, i) => <Badge key={i} variant="secondary" className="text-xs">{item}</Badge>)}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-600">{option.content}</p>
                            )}
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}