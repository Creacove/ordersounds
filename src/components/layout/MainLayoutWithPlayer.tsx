
import React from 'react';
import { MainLayout } from './MainLayout';
import { PersistentPlayer } from '../player/PersistentPlayer';
import { usePlayer } from '@/context/PlayerContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface MainLayoutWithPlayerProps {
  children: React.ReactNode;
}

export function MainLayoutWithPlayer({ children }: MainLayoutWithPlayerProps) {
  const { currentBeat } = usePlayer();
  const isMobile = useIsMobile();
  
  // Add padding at the bottom to ensure content doesn't get hidden
  // On mobile, we need extra space for both player and bottom nav
  return (
    <MainLayout>
      <div className={currentBeat ? (isMobile ? 'pb-40' : 'pb-28') : (isMobile ? 'pb-16' : '')}>
        {children}
      </div>
      {/* Always render the player but with fixed positioning at the bottom */}
      <PersistentPlayer />
    </MainLayout>
  );
}
