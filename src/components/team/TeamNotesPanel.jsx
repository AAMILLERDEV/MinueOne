import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { StickyNote, Plus, Trash2, Share2, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export default function TeamNotesPanel({ myProfile, aboutProfileId, aboutProfileName }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (myProfile && aboutProfileId) {
      loadNotes();
    }
  }, [myProfile, aboutProfileId]);

  const loadNotes = async () => {
    try {
      const myNotes = await base44.entities.TeamNote.filter({
        profile_id: myProfile.id,
        about_profile_id: aboutProfileId
      });
      setNotes(myNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveNote = async () => {
    if (!newNote.trim()) return;

    setSaving(true);
    try {
      const note = await base44.entities.TeamNote.create({
        profile_id: myProfile.id,
        about_profile_id: aboutProfileId,
        content: newNote,
        is_shared: isShared
      });
      
      setNotes(prev => [note, ...prev]);
      setNewNote('');
      setIsShared(false);
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (noteId) => {
    try {
      await base44.entities.TeamNote.delete(noteId);
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <StickyNote className="w-4 h-4 text-amber-600" />
        <h4 className="font-medium text-slate-900">Notes about {aboutProfileName}</h4>
      </div>

      {/* Add Note */}
      <div className="space-y-2">
        <Textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a private note..."
          className="h-20"
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              checked={isShared}
              onCheckedChange={setIsShared}
              id="share-note"
            />
            <label htmlFor="share-note" className="text-xs text-slate-500">
              Share with linked team
            </label>
          </div>
          <Button
            size="sm"
            onClick={saveNote}
            disabled={!newNote.trim() || saving}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
            Add Note
          </Button>
        </div>
      </div>

      {/* Notes List */}
      {notes.length > 0 ? (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {notes.map(note => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-amber-50 rounded-lg border border-amber-100"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-slate-700 flex-1">{note.content}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteNote(note.id)}
                  className="text-slate-400 hover:text-red-500 h-6 w-6 p-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-slate-400">
                  {new Date(note.created_date).toLocaleDateString()}
                </span>
                {note.is_shared && (
                  <Badge variant="outline" className="text-xs h-5">
                    <Share2 className="w-3 h-3 mr-1" />
                    Shared
                  </Badge>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 text-center py-4">
          No notes yet
        </p>
      )}
    </div>
  );
}