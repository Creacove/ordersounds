
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DialogTitle, DialogHeader, DialogDescription } from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';

interface PlaylistData {
  name: string;
  isPublic: boolean;
  coverImage?: string;
}

interface CreatePlaylistFormProps {
  onSubmit: (data: PlaylistData) => Promise<void>;
}

export function CreatePlaylistForm({ onSubmit }: CreatePlaylistFormProps) {
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useIsMobile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), isPublic });
      setName('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader className={isMobile ? "text-center space-y-2" : ""}>
        <DialogTitle>Create new playlist</DialogTitle>
        <DialogDescription>
          Add a name and privacy setting for your new playlist.
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">Playlist name</Label>
          <Input
            id="name"
            placeholder="Enter playlist name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={isMobile ? "h-9" : ""}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="public"
            checked={isPublic}
            onCheckedChange={setIsPublic}
          />
          <Label htmlFor="public">Make playlist public</Label>
        </div>
      </div>
      
      <div className={`flex ${isMobile ? "justify-center" : "justify-end"} gap-2`}>
        <Button 
          type="submit" 
          disabled={!name.trim() || isSubmitting}
          size={isMobile ? "sm" : "default"}
          className={isMobile ? "w-full" : ""}
        >
          {isSubmitting ? 'Creating...' : 'Create Playlist'}
        </Button>
      </div>
    </form>
  );
}
