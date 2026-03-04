import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, Loader2, Sparkles, Crown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import ReactMarkdown from 'react-markdown';

const SUGGESTED_PROMPTS = [
  "Who should I reach out to first?",
  "How do I approach an investor cold?",
  "What's the best way to pitch to accelerators?",
  "Help me write an intro message for a co-founder",
];

export default function NetworkingChatPanel({ isOpen, onClose, myProfile, allProfiles, isPremium }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0 && isPremium) {
      setMessages([{
        role: 'assistant',
        content: `Hi ${myProfile?.display_name?.split(' ')[0] || 'there'}! 👋 I'm your AI networking advisor.\n\nI know your profile and can help you craft outreach messages, plan your networking strategy, or analyze specific connections. What would you like help with?`
      }]);
    }
  }, [isOpen]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;

    setInput('');
    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const contextSummary = {
        my_profile: {
          name: myProfile?.display_name,
          type: myProfile?.profile_type,
          stage: myProfile?.stage,
          skills: myProfile?.primary_skills,
          help_needed: myProfile?.help_needed,
          problem_statement: myProfile?.problem_statement,
          location: myProfile?.location,
          bio: myProfile?.bio?.substring(0, 200),
        },
        available_profiles_count: allProfiles.length,
        profile_types_available: [...new Set(allProfiles.map(p => p.profile_type))],
      };

      const history = newMessages.slice(-6).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n');

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a smart, friendly AI networking advisor on the Minus1 startup platform. You help users network strategically, craft outreach messages, and build meaningful connections in the startup ecosystem.

User's profile context:
${JSON.stringify(contextSummary, null, 2)}

Conversation history:
${history}

Respond helpfully and specifically. If they ask for a message draft, write a complete, personalized message they can send. Keep responses concise but actionable. Use markdown formatting where helpful.`,
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I ran into an issue. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-w-lg mx-auto"
            style={{ height: '80vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">AI Networking Advisor</p>
                  <p className="text-xs text-slate-500">Powered by advanced AI</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {!isPremium ? (
              <div className="flex flex-col items-center justify-center h-3/4 px-6 text-center">
                <Crown className="w-10 h-10 text-amber-500 mb-3" />
                <h3 className="font-semibold text-slate-900 mb-2">Premium Feature</h3>
                <p className="text-sm text-slate-500">Upgrade to chat with your AI networking advisor.</p>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: 'calc(80vh - 140px)' }}>
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
                      {msg.role === 'assistant' && (
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Sparkles className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                        msg.role === 'user'
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-100 text-slate-900'
                      }`}>
                        {msg.role === 'assistant' ? (
                          <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                            {msg.content}
                          </ReactMarkdown>
                        ) : (
                          <p>{msg.content}</p>
                        )}
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex justify-start gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="bg-slate-100 rounded-2xl px-4 py-3">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      </div>
                    </div>
                  )}

                  {/* Suggested prompts */}
                  {messages.length <= 1 && !loading && (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-400 text-center">Try asking:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {SUGGESTED_PROMPTS.map((p, i) => (
                          <button
                            key={i}
                            onClick={() => sendMessage(p)}
                            className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1.5 hover:bg-blue-100 transition-colors"
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-slate-100 flex gap-2">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Ask your networking advisor..."
                    className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading}
                    className="bg-blue-600 hover:bg-blue-700 rounded-xl"
                    size="icon"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}