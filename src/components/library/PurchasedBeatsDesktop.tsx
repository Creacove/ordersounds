
import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DownloadIcon, Play, Pause, ChevronDown } from 'lucide-react';
import { Beat } from '@/types';
import { usePlayer } from '@/context/PlayerContext';
import { Badge } from '@/components/ui/badge';

interface PurchasedBeatsDesktopProps {
  beats: Beat[];
  purchaseDetails: Record<string, { licenseType: string, purchaseDate: string }>;
  onDownload: (beat: Beat, downloadType?: 'track' | 'stems') => void;
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
                  <div className="flex flex-col">
                    <div className="font-medium">{beat.title}</div>
                    {beat.stems_url && (
                      <Badge variant="secondary" className="text-xs w-fit mt-1">
                        Stems Available
                      </Badge>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>{beat.producer_name}</TableCell>
              <TableCell className="capitalize">
                {purchaseDetails[beat.id]?.licenseType || 'Basic'} License
              </TableCell>
              <TableCell className="text-right">
                {beat.stems_url ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <DownloadIcon className="h-4 w-4" />
                        Download
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onDownload(beat, 'track')}>
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        Download Track
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDownload(beat, 'stems')}>
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        Download Stems
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownload(beat, 'track')}
                    className="flex items-center gap-1"
                  >
                    <DownloadIcon className="h-4 w-4" />
                    Download
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
