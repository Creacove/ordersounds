
import React from 'react';
import { MainLayout } from './MainLayout';
import { PersistentPlayer } from '../player/PersistentPlayer';
import { usePlayer } from '@/context/PlayerContext';

interface MainLayoutWithPlayerProps {
  children: React.ReactNode;
}

export function MainLayoutWithPlayer({ children }: MainLayoutWithPlayerProps) {
  const { currentBeat } = usePlayer();
  
  // Add padding at the bottom if the player is visible
  return (
    <MainLayout>
      <div className={currentBeat ? 'pb-24' : ''}>
        {children}
      </div>
      <PersistentPlayer />
    </MainLayout>
  );
}
