import React, { useState, useEffect, useRef } from 'react';
import { minus1 } from '@/api/minus1Client';
import { supabase } from '@/api/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useUnread } from '@/lib/UnreadContext';
import {
  Users, Plus, ArrowLeft, Send, Loader2, Check,
  MessageCircle, Trash2, Crown, UserPlus,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/**
 * GroupChatPanel — embedded team list + group chat for the Matches "Group Chat" tab.
 * Props:
 *   myProfile — the current user's profile (passed from Matches, avoids re-fetch)
 */
export default function GroupChatPanel({ myProfile }) {
  const navigate = useNavigate();
  const { unreadByTeam, markTeamRead } = useUnread();
  const messagesEndRef = useRef(null);
  const realtimeRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [msgInput, setMsgInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [profilesCache, setProfilesCache] = useState({});
  const [startingChat, setStartingChat] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [creating, setCreating] = useState(false);

  const [showInvite, setShowInvite] = useState(false);
  const [matchedProfiles, setMatchedProfiles] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [inviteStatus, setInviteStatus] = useState({});

  const selectedTeam = teams.find(t => t.team.id === selectedTeamId) ?? null;

  useEffect(() => { loadTeams(); }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (realtimeRef.current) {
      supabase.removeChannel(realtimeRef.current);
      realtimeRef.current = null;
    }
    if (!selectedTeamId) return;

    const channel = supabase
      .channel(`group_chat:${selectedTeamId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'team_group_messages',
        filter: `team_id=eq.${selectedTeamId}`,
      }, (payload) => {
        setMessages(prev =>
          prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new]
        );
        markTeamRead(selectedTeamId);
      })
      .subscribe();

    realtimeRef.current = channel;
    return () => { supabase.removeChannel(channel); realtimeRef.current = null; };
  }, [selectedTeamId]);

  const loadTeams = async () => {
    try {
      const { data: memberships } = await supabase
        .from('team_members').select('team_id').eq('profile_id', myProfile.id);

      const teamIds = (memberships ?? []).map(m => m.team_id);
      if (!teamIds.length) { setLoading(false); return; }

      const { data: teamsData } = await supabase
        .from('teams').select('*').in('id', teamIds)
        .is('company_id', null)          // standalone group chats only
        .order('created_at', { ascending: false });

      const { data: allMembers } = await supabase
        .from('team_members')
        .select('*, profiles(id, display_name, avatar_url, profile_type)')
        .in('team_id', teamIds);

      setTeams((teamsData ?? []).map(team => ({
        team,
        members: (allMembers ?? [])
          .filter(m => m.team_id === team.id)
          .map(m => ({ profile: m.profiles, role: m.role, memberId: m.id }))
          .filter(m => m.profile),
      })));
    } catch (err) {
      console.error('Error loading teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (teamId) => {
    setLoadingMsgs(true);
    try {
      const { data } = await supabase
        .from('team_group_messages').select('*').eq('team_id', teamId).order('created_at', { ascending: true });
      setMessages(data ?? []);

      const senderIds = [...new Set((data ?? []).map(m => m.sender_profile_id))];
      if (senderIds.length) {
        const { data: profiles } = await supabase
          .from('profiles').select('id, display_name, avatar_url').in('id', senderIds);
        const map = {};
        (profiles ?? []).forEach(p => { map[p.id] = p; });
        setProfilesCache(prev => ({ ...prev, ...map }));
      }
    } finally {
      setLoadingMsgs(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) return;
    setCreating(true);
    try {
      const { data: team } = await supabase
        .from('teams').insert({ name: teamName.trim(), owner_profile_id: myProfile.id, company_id: null }).select().single();
      await supabase.from('team_members').insert({ team_id: team.id, profile_id: myProfile.id, role: 'owner' });
      setShowCreate(false);
      setTeamName('');
      await loadTeams();
    } finally {
      setCreating(false);
    }
  };

  const handleSelectTeam = (teamId) => {
    setSelectedTeamId(teamId);
    setMessages([]);
    setShowMembers(false);
    markTeamRead(teamId);
    loadMessages(teamId);
    const team = teams.find(t => t.team.id === teamId);
    if (team) {
      const map = {};
      team.members.forEach(m => { if (m.profile) map[m.profile.id] = m.profile; });
      setProfilesCache(prev => ({ ...prev, ...map }));
    }
  };

  const handleSendMessage = async () => {
    if (!msgInput.trim() || sendingMsg || !selectedTeamId) return;
    const content = msgInput.trim();
    setSendingMsg(true);
    setMsgInput('');
    try {
      const { data: created } = await supabase
        .from('team_group_messages')
        .insert({ team_id: selectedTeamId, sender_profile_id: myProfile.id, content })
        .select().single();
      if (created) {
        setMessages(prev => prev.some(m => m.id === created.id) ? prev : [...prev, created]);
        setProfilesCache(prev => ({ [myProfile.id]: myProfile, ...prev }));
      }
    } catch (err) {
      setMsgInput(content);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleIndividualChat = async (profile) => {
    setStartingChat(profile.id);
    try {
      const [out, inc] = await Promise.all([
        minus1.entities.Match.filter({ from_profile_id: myProfile.id, to_profile_id: profile.id }),
        minus1.entities.Match.filter({ from_profile_id: profile.id, to_profile_id: myProfile.id }),
      ]);
      const existing = [...out, ...inc].find(m => m.status === 'matched');
      const matchId = existing
        ? existing.id
        : (await minus1.entities.Match.create({ from_profile_id: myProfile.id, to_profile_id: profile.id, status: 'matched' })).id;
      navigate(`${createPageUrl('Chat')}?matchId=${matchId}`);
    } finally {
      setStartingChat(null);
    }
  };

  const handleLeaveOrDelete = async (team) => {
    const isOwner = team.owner_profile_id === myProfile.id;
    if (isOwner) {
      await supabase.from('teams').delete().eq('id', team.id);
    } else {
      await supabase.from('team_members').delete().eq('team_id', team.id).eq('profile_id', myProfile.id);
    }
    setSelectedTeamId(null);
    await loadTeams();
  };

  const handleOpenInvite = async (team) => {
    setShowInvite(true);
    setInviteStatus({});
    setLoadingMatches(true);
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
      const otherIds = Object.keys(matchMap);
      if (!otherIds.length) { setMatchedProfiles([]); setLoadingMatches(false); return; }

      const currentMemberIds = new Set(
        (teams.find(t => t.team.id === team.id)?.members ?? []).map(m => m.profile.id)
      );
      const { data: profiles } = await supabase
        .from('profiles').select('id, display_name, avatar_url, profile_type').in('id', otherIds);

      setMatchedProfiles(
        (profiles ?? []).filter(p => !currentMemberIds.has(p.id)).map(p => ({ ...p, matchId: matchMap[p.id] }))
      );
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleAddToTeam = async (profile, team) => {
    setInviteStatus(prev => ({ ...prev, [profile.id]: 'adding' }));
    try {
      await supabase.from('team_members').insert({ team_id: team.id, profile_id: profile.id, role: 'member' });
      if (profile.matchId) {
        await supabase.from('messages').insert({
          match_id: profile.matchId, sender_profile_id: myProfile.id,
          content: `👋 I've added you to "${team.name}" on Minus1! Head to Matches → Group Chat to join.`,
        });
      }
      setInviteStatus(prev => ({ ...prev, [profile.id]: 'added' }));
      setMatchedProfiles(prev => prev.filter(p => p.id !== profile.id));
      loadTeams();
    } catch {
      setInviteStatus(prev => ({ ...prev, [profile.id]: null }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  // ── Chat detail view ──────────────────────────────────────────────────────
  if (selectedTeam) {
    const { team, members } = selectedTeam;
    const isOwner = team.owner_profile_id === myProfile.id;

    return (
      <div className="flex flex-col" style={{ height: 'calc(100vh - 160px)' }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 flex-shrink-0">
          <button onClick={() => setSelectedTeamId(null)} className="text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 truncate">{team.name}</p>
            <p className="text-xs text-slate-400">{members.length} member{members.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => handleOpenInvite(team)} className="text-slate-500 hover:text-purple-600" title="Invite">
            <UserPlus className="w-5 h-5" />
          </button>
          <button onClick={() => setShowMembers(v => !v)} className="text-slate-500 hover:text-slate-800" title="Members">
            <Users className="w-5 h-5" />
          </button>
        </div>

        {/* Members panel */}
        {showMembers && (
          <div className="bg-white border-b border-slate-200 px-4 py-3 flex-shrink-0">
            <div className="flex flex-wrap gap-3">
              {members.map(({ profile, role }) => (
                <div key={profile.id} className="flex flex-col items-center gap-1 group">
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={profile.avatar_url} />
                      <AvatarFallback className="text-sm">{profile.display_name?.[0]}</AvatarFallback>
                    </Avatar>
                    {role === 'owner' && <Crown className="w-3 h-3 text-amber-500 absolute -top-1 -right-1" />}
                  </div>
                  <p className="text-xs text-slate-600 text-center max-w-[56px] truncate">{profile.display_name}</p>
                  {profile.id !== myProfile.id && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleIndividualChat(profile)} disabled={startingChat === profile.id} className="text-xs text-blue-600 hover:underline">
                        {startingChat === profile.id ? '…' : 'Chat'}
                      </button>
                      <span className="text-slate-300">·</span>
                      <button onClick={() => navigate(`${createPageUrl('PublicProfile')}?profileId=${profile.id}`)} className="text-xs text-slate-500 hover:underline">
                        Profile
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-3 pt-2 border-t border-slate-100">
              <button onClick={() => handleLeaveOrDelete(team)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                <Trash2 className="w-3 h-3" />
                {isOwner ? 'Delete team' : 'Leave team'}
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
          {loadingMsgs ? (
            <div className="flex justify-center pt-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
          ) : messages.length === 0 ? (
            <div className="text-center pt-8 text-slate-400">
              <p className="text-sm">No messages yet.</p>
              <p className="text-xs mt-1">Be the first to say something!</p>
            </div>
          ) : (
            messages.map(msg => {
              const isMe = msg.sender_profile_id === myProfile.id;
              const sender = profilesCache[msg.sender_profile_id];
              return (
                <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={sender?.avatar_url} />
                    <AvatarFallback className="text-xs">{sender?.display_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className={`max-w-[72%] flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && <span className="text-xs text-slate-500 px-1">{sender?.display_name}</span>}
                    <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'}`}>
                      {msg.content}
                    </div>
                    <span className="text-xs text-slate-400 px-1">{timeAgo(msg.created_at)}</span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2 px-4 py-3 bg-white border-t border-slate-200 flex-shrink-0">
          <Input
            value={msgInput}
            onChange={e => setMsgInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder={`Message ${team.name}…`}
            className="flex-1 h-10"
          />
          <Button size="sm" disabled={!msgInput.trim() || sendingMsg} onClick={handleSendMessage} className="bg-blue-600 hover:bg-blue-700 h-10 px-4">
            {sendingMsg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>

        {/* Invite dialog */}
        <Dialog open={showInvite} onOpenChange={setShowInvite}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-purple-600" />Add to {team.name}</DialogTitle>
            </DialogHeader>
            <div className="mt-2 space-y-3">
              {loadingMatches ? (
                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
              ) : matchedProfiles.length === 0 ? (
                <div className="text-center py-6 text-slate-500">
                  <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">No matches to add.</p>
                  <p className="text-xs mt-1 text-slate-400">All your matches are already in this team, or you have no matches yet.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {matchedProfiles.map(profile => {
                    const status = inviteStatus[profile.id];
                    return (
                      <div key={profile.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarImage src={profile.avatar_url} />
                          <AvatarFallback className="text-sm">{profile.display_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{profile.display_name}</p>
                          <p className="text-xs text-slate-500 capitalize">{profile.profile_type?.replace('_', ' ')}</p>
                        </div>
                        <Button
                          size="sm" disabled={status === 'adding' || status === 'added'}
                          onClick={() => handleAddToTeam(profile, team)}
                          className={status === 'added' ? 'bg-green-600 hover:bg-green-600' : 'bg-purple-600 hover:bg-purple-700'}
                        >
                          {status === 'adding' ? <Loader2 className="w-4 h-4 animate-spin" /> : status === 'added' ? <><Check className="w-4 h-4 mr-1" />Added</> : 'Add'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ── Team list view ────────────────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" />
          <h2 className="text-base font-semibold text-slate-900">Group Chats</h2>
        </div>
        <Button size="sm" onClick={() => { setTeamName(''); setShowCreate(true); }} className="bg-purple-600 hover:bg-purple-700 gap-1.5 h-8 text-xs">
          <Plus className="w-3.5 h-3.5" />New
        </Button>
      </div>

      {teams.length === 0 ? (
        <div className="text-center py-10 text-slate-500 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto">
            <Users className="w-7 h-7 text-purple-300" />
          </div>
          <div>
            <p className="font-semibold text-slate-700 text-sm">No group chats yet</p>
            <p className="text-xs mt-1 text-slate-400">Create a team and invite your matches.</p>
          </div>
          <Button size="sm" onClick={() => { setTeamName(''); setShowCreate(true); }} className="bg-purple-600 hover:bg-purple-700 gap-1.5">
            <Plus className="w-3.5 h-3.5" />New
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {teams.map(({ team, members }) => {
            const isOwner = team.owner_profile_id === myProfile.id;
            const unreadData = unreadByTeam[team.id];
            const unreadCount = unreadData?.count ?? 0;
            const hasUnread = unreadCount > 0;
            return (
              <button
                key={team.id}
                onClick={() => handleSelectTeam(team.id)}
                className={`w-full text-left rounded-2xl border shadow-sm p-4 hover:shadow-md transition-all ${hasUnread ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:border-purple-200'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <p className={`truncate text-sm ${hasUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-900'}`}>{team.name}</p>
                      {isOwner && <Crown className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                    </div>
                    {hasUnread && (
                      <p className="text-xs text-blue-600 font-medium mb-1.5 truncate max-w-[200px]">{unreadData.preview}</p>
                    )}
                    <div className="flex -space-x-1.5">
                      {members.slice(0, 5).map(({ profile }) => (
                        <Avatar key={profile.id} className="w-6 h-6 border-2 border-white">
                          <AvatarImage src={profile.avatar_url} />
                          <AvatarFallback className="text-[10px] bg-purple-100 text-purple-700">{profile.display_name?.[0]}</AvatarFallback>
                        </Avatar>
                      ))}
                      {members.length > 5 && (
                        <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
                          <span className="text-[10px] text-slate-500">+{members.length - 5}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="relative flex-shrink-0">
                    <MessageCircle className={`w-4 h-4 ${hasUnread ? 'text-blue-500' : 'text-slate-300'}`} />
                    {hasUnread && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center px-0.5">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Create Team Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="w-5 h-5 text-purple-600" />Create a new group chat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Group name</label>
              <Input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="e.g. Acme Inc." onKeyDown={e => e.key === 'Enter' && handleCreateTeam()} autoFocus />
              <p className="text-xs text-slate-400 mt-1">Use your company name.</p>
            </div>
            <Button className="w-full bg-purple-600 hover:bg-purple-700" disabled={!teamName.trim() || creating} onClick={handleCreateTeam}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Group Chat'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
