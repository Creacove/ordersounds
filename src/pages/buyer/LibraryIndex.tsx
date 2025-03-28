import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LibraryIndex() {
  const [playlists, setPlaylists] = useState([]);
  const navigate = useNavigate();

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Your Library</h1>
      
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Your Playlists</h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/buyer/library/create-playlist')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Playlist
            </Button>
          </div>
          
          {playlists.length === 0 ? (
            <div className="text-center py-12 border rounded-md bg-muted/20">
              <h3 className="text-lg font-medium mb-2">No playlists yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first playlist to organize your favorite beats.
              </p>
              <Button 
                variant="default" 
                onClick={() => navigate('/buyer/library/create-playlist')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Playlist
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {playlists.map((playlist) => (
                <div 
                  key={playlist.id} 
                  className="border rounded-md p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => navigate(`/buyer/library/playlists/${playlist.id}`)}
                >
                  <div className="aspect-square bg-muted rounded-md mb-3 flex items-center justify-center text-4xl">
                    🎵
                  </div>
                  <h3 className="font-medium truncate">{playlist.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {playlist.beats.length} {playlist.beats.length === 1 ? 'beat' : 'beats'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
