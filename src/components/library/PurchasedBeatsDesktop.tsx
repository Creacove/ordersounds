
import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DownloadIcon, Play, Pause } from 'lucide-react';
import { Beat } from '@/types';
import { usePlayer } from '@/context/PlayerContext';

interface PurchasedBeatsDesktopProps {
  beats: Beat[];
  purchaseDetails: Record<string, { licenseType: string, purchaseDate: string }>;
  onDownload: (beat: Beat) => void;
}

export function PurchasedBeatsDesktop({ beats, purchaseDetails, onDownload }: PurchasedBeatsDesktopProps) {
  const { isPlaying, currentBeat, playBeat } = usePlayer();

  const handlePlayBeat = (beat: Beat) => {
    if (currentBeat?.id === beat.id) {
      if (isPlaying) {
        playBeat(null);
      } else {
        playBeat(beat);
      }
    } else {
      playBeat(beat);
    }
  };

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[400px]">Beat</TableHead>
            <TableHead>Producer</TableHead>
            <TableHead>License</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {beats.map((beat) => (
            <TableRow key={beat.id}>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div 
                    className="relative h-10 w-10 flex-shrink-0 rounded-md overflow-hidden cursor-pointer group"
                    onClick={() => handlePlayBeat(beat)}
                  >
                    <img
                      src={beat.cover_image_url}
                      alt={beat.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      {isPlaying && currentBeat?.id === beat.id ? (
                        <Pause className="h-4 w-4 text-white" />
                      ) : (
                        <Play className="h-4 w-4 ml-0.5 text-white" />
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">{beat.title}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>{beat.producer_name}</TableCell>
              <TableCell className="capitalize">
                {purchaseDetails[beat.id]?.licenseType || 'Basic'} License
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDownload(beat)}
                  className="flex items-center gap-1"
                >
                  <DownloadIcon className="h-4 w-4" />
                  Download
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
