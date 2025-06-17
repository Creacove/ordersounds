
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { FileUploadInput } from './FileUploadInput';
import { Upload, Music, Image, FileArchive, Play, Pause, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileOrUrl } from '@/lib/storage';

interface FilesTabProps {
  imagePreview: string | null;
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  uploadedFile: FileOrUrl | null;
  setUploadedFile: React.Dispatch<React.SetStateAction<FileOrUrl | null>>;
  handleFullTrackUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  previewFile: FileOrUrl | null;
  setPreviewFile: React.Dispatch<React.SetStateAction<FileOrUrl | null>>;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  selectedLicenseTypes: string[];
  stems: FileOrUrl | null;
  setStems: React.Dispatch<React.SetStateAction<FileOrUrl | null>>;
  processingFiles: { [key: string]: boolean };
  uploadProgress: { [key: string]: number };
  regeneratePreview: () => void;
  previewUrl: string | null;
  setPreviewUrl: React.Dispatch<React.SetStateAction<string | null>>;
  handlePreviewUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleStemsUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  uploadError: string | null;
  stemsUrl?: string | null;
}

export function FilesTab({
  imagePreview,
  handleImageUpload,
  uploadedFile,
  handleFullTrackUpload,
  previewFile,
  isPlaying,
  setIsPlaying,
  selectedLicenseTypes,
  stems,
  processingFiles,
  uploadProgress,
  regeneratePreview,
  previewUrl,
  handlePreviewUpload,
  handleStemsUpload,
  uploadError,
  stemsUrl
}: FilesTabProps) {
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
              onChange={handleImageUpload}
              aria-label="Upload cover image"
            />
            {imagePreview && (
              <div className="mt-2">
                <img src={imagePreview} alt="Cover preview" className="w-20 h-20 object-cover rounded" />
              </div>
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
              onChange={handleFullTrackUpload}
              aria-label="Upload full track"
            />
            {uploadedFile && (
              <p className="text-sm text-muted-foreground">
                Track uploaded successfully
              </p>
            )}
            {processingFiles.fullTrack && (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Processing...</span>
                {uploadProgress.fullTrack > 0 && (
                  <Progress value={uploadProgress.fullTrack} className="w-24" />
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="preview-track-upload" className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              Preview Track
            </Label>
            <div className="flex gap-2">
              <FileUploadInput
                id="preview-track-upload"
                name="previewTrack"
                accept="audio/*"
                onChange={handlePreviewUpload}
                aria-label="Upload preview track"
              />
              {uploadedFile && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={regeneratePreview}
                  disabled={processingFiles.preview}
                >
                  {processingFiles.preview ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    'Auto Generate'
                  )}
                </Button>
              )}
            </div>
            {(previewFile || previewUrl) && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <span className="text-sm text-muted-foreground">Preview ready</span>
              </div>
            )}
          </div>

          {selectedLicenseTypes.includes('premium') && (
            <div className="space-y-2">
              <Label htmlFor="stems-upload" className="flex items-center gap-2">
                <FileArchive className="h-4 w-4" />
                Stems (ZIP file)
              </Label>
              <FileUploadInput
                id="stems-upload"
                name="stems"
                accept=".zip,.rar"
                onChange={handleStemsUpload}
                aria-label="Upload stems archive"
              />
              {(stems || stemsUrl) && (
                <p className="text-sm text-muted-foreground">
                  Stems uploaded successfully
                </p>
              )}
            </div>
          )}

          {uploadError && (
            <div className="text-sm text-red-500 mt-2">
              {uploadError}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
