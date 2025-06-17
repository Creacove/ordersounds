
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { FileUploadInput } from './FileUploadInput';
import { Upload, Music, Image, FileArchive } from 'lucide-react';

interface FilesTabProps {
  files: {
    coverImage: File | null;
    fullTrack: File | null;
    previewTrack: File | null;
    stems: File | null;
  };
  onFileChange: (fileType: string, file: File | null) => void;
}

export function FilesTab({ files, onFileChange }: FilesTabProps) {
  const handleFileChange = (fileType: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    onFileChange(fileType, file);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Files
          </CardTitle>
          <CardDescription>
            Upload your beat files and cover art
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="cover-image-upload" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Cover Image *
            </Label>
            <FileUploadInput
              id="cover-image-upload"
              name="coverImage"
              accept="image/*"
              onChange={handleFileChange('coverImage')}
              aria-label="Upload cover image"
            />
            {files.coverImage && (
              <p className="text-sm text-muted-foreground">
                Selected: {files.coverImage.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="full-track-upload" className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              Full Track *
            </Label>
            <FileUploadInput
              id="full-track-upload"
              name="fullTrack"
              accept="audio/*"
              onChange={handleFileChange('fullTrack')}
              aria-label="Upload full track"
            />
            {files.fullTrack && (
              <p className="text-sm text-muted-foreground">
                Selected: {files.fullTrack.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="preview-track-upload" className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              Preview Track
            </Label>
            <FileUploadInput
              id="preview-track-upload"
              name="previewTrack"
              accept="audio/*"
              onChange={handleFileChange('previewTrack')}
              aria-label="Upload preview track"
            />
            {files.previewTrack && (
              <p className="text-sm text-muted-foreground">
                Selected: {files.previewTrack.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="stems-upload" className="flex items-center gap-2">
              <FileArchive className="h-4 w-4" />
              Stems (ZIP file)
            </Label>
            <FileUploadInput
              id="stems-upload"
              name="stems"
              accept=".zip,.rar"
              onChange={handleFileChange('stems')}
              aria-label="Upload stems archive"
            />
            {files.stems && (
              <p className="text-sm text-muted-foreground">
                Selected: {files.stems.name}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
