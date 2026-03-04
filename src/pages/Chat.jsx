import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft, Send, Shield, Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import MeetingScheduler from '@/components/MeetingScheduler';
import { canContactProfile, CorporateContactBlockedBanner, isCorporateProfile } from '@/components/CorporatePaywall';

export default function Chat() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [myProfile, setMyProfile] = useState(null);
  const [match, setMatch] = useState(null);
  const [otherProfile, setOtherProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const messagesEndRef = useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const matchId = urlParams.get('matchId');

  useEffect(() => {
    loadData();
  }, [matchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadData = async () => {
    if (!matchId) {
      navigate(createPageUrl('Matches'));
      return;
    }

    try {
      const user = await base44.auth.me();
      const myProfiles = await base44.entities.Profile.filter({ user_id: user.id });
      
      if (!myProfiles.length) {
        navigate(createPageUrl('Onboarding'));
        return;
      }
      
      setMyProfile(myProfiles[0]);
      
      // Load match
      const allMatches = await base44.entities.Match.filter({ status: 'matched' });
      const foundMatch = allMatches.find(m => m.id === matchId);
      
      if (!foundMatch) {
        navigate(createPageUrl('Matches'));
        return;
      }
      
      setMatch(foundMatch);
      
      // Load other profile
      const otherId = foundMatch.from_profile_id === myProfiles[0].id 
        ? foundMatch.to_profile_id 
        : foundMatch.from_profile_id;
      
      const allProfiles = await base44.entities.Profile.list();
      const other = allProfiles.find(p => p.id === otherId);
      setOtherProfile(other);
      
      // Load messages
      const allMessages = await base44.entities.Message.filter({ match_id: matchId }, 'created_date');
      setMessages(allMessages);
      
    } catch (error) {
      console.error('Error loading chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    
    setSending(true);
    try {
      await base44.entities.Message.create({
        match_id: matchId,
        sender_profile_id: myProfile.id,
        content: newMessage.trim()
      });
      
      setNewMessage('');
      loadData(); // Reload messages
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(createPageUrl('Matches'))}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
          {otherProfile?.avatar_url ? (
            <img 
              src={otherProfile.avatar_url} 
              alt={otherProfile.display_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
              {otherProfile?.display_name?.[0]}
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <h2 className="font-semibold text-slate-900">{otherProfile?.display_name}</h2>
          {otherProfile?.location && (
            <p className="text-xs text-slate-500">{otherProfile.location}</p>
          )}
        </div>
        
        {match?.nda_sent && (
          <Badge variant="outline" className="border-amber-200 text-amber-700">
            <Shield className="w-3 h-3 mr-1" />
            NDA Requested
          </Badge>
        )}
        
        {/* Meeting button for paid users */}
        {(myProfile?.is_premium || ['pro', 'business', 'enterprise'].includes(myProfile?.subscription_tier)) && (
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setShowScheduler(true)}
          >
            <Calendar className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">
              Start the conversation! Say hello to {otherProfile?.display_name}.
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isMe = message.sender_profile_id === myProfile?.id;
            
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  isMe 
                    ? 'bg-blue-600 text-white rounded-br-md' 
                    : 'bg-white text-slate-900 rounded-bl-md shadow-sm'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                    {new Date(message.created_date).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Contact blocked banner for corporate profiles */}
      {!canContactProfile(myProfile, otherProfile) && (
        <div className="px-4 py-2">
          <CorporateContactBlockedBanner otherProfileType={otherProfile?.profile_type} />
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-slate-200 p-4">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={!canContactProfile(myProfile, otherProfile)}
          />
          <Button 
            onClick={handleSend}
            disabled={!newMessage.trim() || sending || !canContactProfile(myProfile, otherProfile)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Meeting Scheduler Modal */}
      <MeetingScheduler
        isOpen={showScheduler}
        onClose={() => setShowScheduler(false)}
        matchId={matchId}
        myProfile={myProfile}
        otherProfile={otherProfile}
        onScheduled={() => loadData()}
      />
    </div>
  );
}