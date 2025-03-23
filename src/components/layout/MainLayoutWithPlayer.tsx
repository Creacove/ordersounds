
import React from 'react';
import { MainLayout } from './MainLayout';
import { PersistentPlayer } from '../player/PersistentPlayer';
import { usePlayer } from '@/context/PlayerContext';

interface MainLayoutWithPlayerProps {
  children: React.ReactNode;
}

export function MainLayoutWithPlayer({ children }: MainLayoutWithPlayerProps) {
  const { currentBeat } = usePlayer();
  
  // Add padding at the bottom if the player is visible to ensure content doesn't get hidden
  return (
    <MainLayout>
      <div className={currentBeat ? 'pb-28' : ''}>
        {children}
      </div>
      {/* Always render the player but it will be hidden if no current beat */}
      <PersistentPlayer />
    </MainLayout>
  );
}
