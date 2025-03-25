
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileAudio, Image, Play, Pause, Upload, X } from "lucide-react";

type FilesTabProps = {
  imagePreview: string | null;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadedFile: File | null;
  setUploadedFile: React.Dispatch<React.SetStateAction<File | null>>;
  handleFullTrackUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  previewFile: File | null;
  setPreviewFile: React.Dispatch<React.SetStateAction<File | null>>;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
};

export const FilesTab = ({
  imagePreview,
  handleImageUpload,
  uploadedFile,
  setUploadedFile,
  handleFullTrackUpload,
  previewFile,
  setPreviewFile,
  isPlaying,
  setIsPlaying
}: FilesTabProps) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-medium mb-1">Cover Image *</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-4">
          Upload a high quality square image (recommended size: 1000x1000px)
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div 
            className={`border-2 border-dashed rounded-lg p-4 text-center ${
              imagePreview ? "border-primary/50" : "border-muted hover:border-muted-foreground/50"
            } transition-colors cursor-pointer`}
            onClick={() => document.getElementById("coverImage")?.click()}
          >
            {imagePreview ? (
              <div className="relative aspect-square rounded-md overflow-hidden">
                <img 
                  src={imagePreview} 
                  alt="Cover preview" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <p className="text-white text-sm">Click to change</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4">
                <Image className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Click to upload</p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG or GIF, max 5MB</p>
              </div>
            )}
            <input 
              id="coverImage" 
              type="file" 
              className="hidden" 
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Full Track *</h4>
              <div 
                className={`border rounded-lg p-3 flex items-center gap-3 ${
                  uploadedFile ? "bg-primary/5 border-primary/30" : "border-muted"
                } transition-colors`}
              >
                {uploadedFile ? (
                  <>
                    <FileAudio className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs sm:text-sm font-medium truncate">{uploadedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedFile(null);
                      }}
                    >
                      <X size={16} />
                    </Button>
                  </>
                ) : (
                  <>
                    <FileAudio className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-medium">Upload full track</p>
                      <p className="text-xs text-muted-foreground">MP3, WAV (max 50MB)</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => document.getElementById("fullTrack")?.click()}
                      className="px-2 sm:px-3"
                    >
                      <span className="hidden sm:inline">Upload</span>
                      <Upload className="h-4 w-4 sm:ml-2 sm:hidden" />
                    </Button>
                    <input 
                      id="fullTrack" 
                      type="file" 
                      className="hidden" 
                      accept="audio/*"
                      onChange={handleFullTrackUpload}
                    />
                  </>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-1">Preview Track *</h4>
              <div 
                className={`border rounded-lg p-3 flex items-center gap-3 ${
                  previewFile ? "bg-primary/5 border-primary/30" : "border-muted"
                } transition-colors`}
              >
                {previewFile ? (
                  <>
                    <button
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs sm:text-sm font-medium truncate">{previewFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(previewFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewFile(null);
                      }}
                    >
                      <X size={16} />
                    </Button>
                  </>
                ) : (
                  <>
                    <FileAudio className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-medium">Upload preview</p>
                      <p className="text-xs text-muted-foreground">30-60 sec preview</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => document.getElementById("previewTrack")?.click()}
                      className="px-2 sm:px-3"
                    >
                      <span className="hidden sm:inline">Upload</span>
                      <Upload className="h-4 w-4 sm:ml-2 sm:hidden" />
                    </Button>
                    <input 
                      id="previewTrack" 
                      type="file" 
                      className="hidden" 
                      accept="audio/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setPreviewFile(e.target.files[0]);
                        }
                      }}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
