
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CreatePlaylistFormProps {
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
}

export function CreatePlaylistForm({ onSubmit, onCancel }: CreatePlaylistFormProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(name);
      setName('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-6 p-4 bg-card rounded-lg animate-slide-down">
      <h3 className="text-sm font-medium mb-2">Create new playlist</h3>
      <div className="flex gap-2">
        <Input
          placeholder="Playlist name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-grow"
        />
        <Button 
          onClick={handleSubmit} 
          disabled={!name.trim() || isSubmitting}
        >
          Create
        </Button>
        <Button 
          variant="ghost" 
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
