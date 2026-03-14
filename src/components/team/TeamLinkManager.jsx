import React, { useState, useEffect } from 'react';
import { minus1 } from '@/api/minus1Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Link2, Check, X, Loader2, Search, Lock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const relationshipTypes = [
  { id: 'cofounder', label: 'Co-founder', color: 'bg-purple-100 text-purple-700' },
  { id: 'advisor', label: 'Advisor', color: 'bg-blue-100 text-blue-700' },
  { id: 'team_member', label: 'Team Member', color: 'bg-green-100 text-green-700' },
  { id: 'investor', label: 'Investor', color: 'bg-amber-100 text-amber-700' },
  { id: 'mentor', label: 'Mentor', color: 'bg-cyan-100 text-cyan-700' },
];

export default function TeamLinkManager({ myProfile, isPremium = false, onUpgrade }) {
  const [links, setLinks] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [linkedProfiles, setLinkedProfiles] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState('cofounder');
  const [sendingRequest, setSendingRequest] = useState(null);

  useEffect(() => {
    if (isPremium && myProfile) {
      loadLinks();
    } else {
      setLoading(false);
    }
  }, [myProfile, isPremium]);

  const loadLinks = async () => {
    try {
      const [outgoing, incoming] = await Promise.all([
        minus1.entities.TeamLink.filter({ from_profile_id: myProfile.id }),
        minus1.entities.TeamLink.filter({ to_profile_id: myProfile.id })
      ]);

      const acceptedLinks = [...outgoing, ...incoming].filter(l => l.status === 'accepted');
      const pending = incoming.filter(l => l.status === 'pending');
      
      setLinks(acceptedLinks);
      setPendingRequests(pending);

      // Load linked profile details
      const profileIds = acceptedLinks.map(l => 
        l.from_profile_id === myProfile.id ? l.to_profile_id : l.from_profile_id
      );
      
      if (profileIds.length > 0) {
        const allProfiles = await minus1.entities.Profile.filter({ is_complete: true });
        setLinkedProfiles(allProfiles.filter(p => profileIds.includes(p.id)));
      }
    } catch (error) {
      console.error('Error loading links:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchProfiles = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const profiles = await minus1.entities.Profile.filter({ is_complete: true });
      const existingLinkIds = links.map(l => 
        l.from_profile_id === myProfile.id ? l.to_profile_id : l.from_profile_id
      );

      const filtered = profiles.filter(p => 
        p.id !== myProfile.id &&
        !existingLinkIds.includes(p.id) &&
        p.display_name?.toLowerCase().includes(query.toLowerCase())
      );

      setSearchResults(filtered.slice(0, 5));
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const sendLinkRequest = async (targetProfile) => {
    setSendingRequest(targetProfile.id);
    try {
      await minus1.entities.TeamLink.create({
        from_profile_id: myProfile.id,
        to_profile_id: targetProfile.id,
        relationship_type: selectedRelationship,
        status: 'pending'
      });
      
      setSearchResults(prev => prev.filter(p => p.id !== targetProfile.id));
      setShowAddDialog(false);
      setSearchQuery('');
    } catch (error) {
      console.error('Error sending request:', error);
    } finally {
      setSendingRequest(null);
    }
  };

  const handleRequest = async (link, accept) => {
    try {
      await minus1.entities.TeamLink.update(link.id, {
        status: accept ? 'accepted' : 'declined'
      });
      
      setPendingRequests(prev => prev.filter(l => l.id !== link.id));
      if (accept) loadLinks();
    } catch (error) {
      console.error('Error handling request:', error);
    }
  };

  const removeLink = async (link) => {
    try {
      await minus1.entities.TeamLink.delete(link.id);
      setLinks(prev => prev.filter(l => l.id !== link.id));
      setLinkedProfiles(prev => {
        const removedId = link.from_profile_id === myProfile.id ? link.to_profile_id : link.from_profile_id;
        return prev.filter(p => p.id !== removedId);
      });
    } catch (error) {
      console.error('Error removing link:', error);
    }
  };

  if (!isPremium) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-5 border border-purple-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Lock className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">Team Collaboration</p>
            <p className="text-sm text-slate-500">Link profiles & collaborate</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          Connect your co-founders, advisors, and team members to show a united front to potential matches.
        </p>
        <Button onClick={onUpgrade} className="w-full bg-purple-600 hover:bg-purple-700">
          Upgrade to Unlock
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-slate-900">Team Links</h3>
          <Badge variant="outline">{links.length}</Badge>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
              <UserPlus className="w-4 h-4 mr-1" />
              Add Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Link a Profile</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Relationship Type</label>
                <Select value={selectedRelationship} onValueChange={setSelectedRelationship}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Search Profiles</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchProfiles(e.target.value);
                    }}
                    placeholder="Search by name..."
                    className="pl-9"
                  />
                </div>
              </div>

              {searching && (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map(profile => (
                    <div key={profile.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback>{profile.display_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{profile.display_name}</p>
                        <p className="text-xs text-slate-500 capitalize">{profile.profile_type}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => sendLinkRequest(profile)}
                        disabled={sendingRequest === profile.id}
                      >
                        {sendingRequest === profile.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Link2 className="w-4 h-4 mr-1" />
                            Link
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-amber-600">Pending Requests</p>
          {pendingRequests.map(request => (
            <PendingRequestCard 
              key={request.id}
              request={request}
              onAccept={() => handleRequest(request, true)}
              onDecline={() => handleRequest(request, false)}
            />
          ))}
        </div>
      )}

      {/* Linked Profiles */}
      {linkedProfiles.length > 0 ? (
        <div className="space-y-2">
          {linkedProfiles.map(profile => {
            const link = links.find(l => 
              l.from_profile_id === profile.id || l.to_profile_id === profile.id
            );
            const relType = relationshipTypes.find(r => r.id === link?.relationship_type);

            return (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200"
              >
                <Avatar className="w-12 h-12">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback>{profile.display_name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{profile.display_name}</p>
                  <Badge className={`text-xs ${relType?.color || ''}`}>
                    {relType?.label || link?.relationship_type}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLink(link)}
                  className="text-slate-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </Button>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 text-slate-500">
          <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="text-sm">No linked profiles yet</p>
          <p className="text-xs">Connect with co-founders and team members</p>
        </div>
      )}
    </div>
  );
}

function PendingRequestCard({ request, onAccept, onDecline }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadProfile();
  }, [request]);

  const loadProfile = async () => {
    const profiles = await minus1.entities.Profile.filter({ is_complete: true });
    setProfile(profiles.find(p => p.id === request.from_profile_id));
  };

  if (!profile) return null;

  const relType = relationshipTypes.find(r => r.id === request.relationship_type);

  return (
    <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
      <Avatar className="w-10 h-10">
        <AvatarImage src={profile.avatar_url} />
        <AvatarFallback>{profile.display_name?.[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 truncate">{profile.display_name}</p>
        <p className="text-xs text-slate-500">wants to link as {relType?.label}</p>
      </div>
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={onDecline} className="text-slate-500">
          <X className="w-4 h-4" />
        </Button>
        <Button size="sm" onClick={onAccept} className="bg-green-600 hover:bg-green-700">
          <Check className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}