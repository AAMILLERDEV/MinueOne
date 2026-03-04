import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Mail, Loader2, Send, Crown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function DirectMessageButton({ 
  myProfile, 
  targetProfile, 
  onUpgrade 
}) {
  const [showDialog, setShowDialog] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Only premium founders and collaborators can direct message
  const canDirectMessage = myProfile?.is_premium && 
    ['founder', 'collaborator'].includes(myProfile?.profile_type);

  const handleSend = async () => {
    if (!message.trim()) return;
    
    setSending(true);
    try {
      await base44.entities.DirectMessage.create({
        from_profile_id: myProfile.id,
        to_profile_id: targetProfile.id,
        content: message
      });
      setSent(true);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  if (!canDirectMessage) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={onUpgrade}
        className="text-amber-600 border-amber-200 hover:bg-amber-50"
      >
        <Crown className="w-4 h-4 mr-1" />
        Upgrade to DM
      </Button>
    );
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setShowDialog(true)}
        className="text-blue-600 border-blue-200 hover:bg-blue-50"
      >
        <Mail className="w-4 h-4 mr-1" />
        Direct Message
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-500" />
              Message {targetProfile?.display_name}
            </DialogTitle>
            <DialogDescription>
              Send a direct message without matching first
            </DialogDescription>
          </DialogHeader>

          {sent ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Send className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Message Sent!</h3>
              <p className="text-sm text-slate-500">
                {targetProfile?.display_name} will be notified
              </p>
              <Button onClick={() => { setShowDialog(false); setSent(false); }} className="mt-4">
                Done
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Introduce yourself to ${targetProfile?.display_name}...`}
                className="h-32"
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleSend} 
                  disabled={!message.trim() || sending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>
                      <Send className="w-4 h-4 mr-1" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}