
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileAudio, FileUp, Image, Play, Pause, Upload, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

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
  selectedLicenseTypes: string[];
  stems: File | null;
  setStems: React.Dispatch<React.SetStateAction<File | null>>;
  processingFiles: boolean;
  uploadProgress?: { [key: string]: number };
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
  setIsPlaying,
  selectedLicenseTypes,
  stems,
  setStems,
  processingFiles,
  uploadProgress = {}
}: FilesTabProps) => {
  const [validationError, setValidationError] = useState<string | null>(null);
  const hasExclusiveLicense = selectedLicenseTypes.includes('exclusive');
  const hasPremiumLicense = selectedLicenseTypes.includes('premium');
  const requiresWavFormat = hasExclusiveLicense || hasPremiumLicense;

  // Audio player reference
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    return () => {
      if (audioPlayer) {
        audioPlayer.pause();
      }
    };
  }, [audioPlayer]);

  // Get accepted file types based on license type
  const getAcceptedAudioTypes = () => {
    if (requiresWavFormat) {
      return "audio/wav";
    }
    return ".mp3,.wav,audio/*";
  };
  
  // Instructions based on license type
  const getAudioInstructions = () => {
    if (requiresWavFormat) {
      return "WAV format required for premium/exclusive licenses (max 50MB)";
    }
    return "MP3, WAV (max 50MB)";
  };
  
  useEffect(() => {
    // If the user changes from premium/exclusive to basic and has a WAV file,
    // warn them that they may want to change the file
    if (!requiresWavFormat && 
        uploadedFile && 
        uploadedFile.type === "audio/wav") {
      setValidationError("You've selected a basic license but uploaded a WAV file. For basic licenses, MP3 is recommended.");
    } else if (requiresWavFormat && 
              uploadedFile && 
              uploadedFile.type === "audio/mpeg") {
      setValidationError("Premium and exclusive licenses require WAV format. Please upload a WAV file.");
    } else {
      setValidationError(null);
    }
  }, [uploadedFile, requiresWavFormat]);

  const handleStemsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size
      if (file.size > 100 * 1024 * 1024) {
        setValidationError("Stems file must be less than 100MB");
        return;
      }
      
      // Validate file type
      if (file.type !== "application/zip" && !file.name.endsWith('.zip')) {
        setValidationError("Stems file must be a ZIP archive");
        return;
      }
      
      setStems(file);
      setValidationError(null);
    }
  };

  const togglePlayPause = () => {
    if (!previewFile) return;
    
    if (!audioPlayer) {
      const audio = new Audio(URL.createObjectURL(previewFile));
      audio.onended = () => setIsPlaying(false);
      setAudioPlayer(audio);
      audio.play();
      setIsPlaying(true);
    } else {
      if (isPlaying) {
        audioPlayer.pause();
      } else {
        audioPlayer.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 mb-24 sm:mb-16">
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
                        {requiresWavFormat && uploadedFile.type !== "audio/wav" && !uploadedFile.name.endsWith('.wav') && (
                          <span className="text-destructive ml-2">WAV format required</span>
                        )}
                      </p>
                      
                      {uploadProgress[uploadedFile.name] !== undefined && uploadProgress[uploadedFile.name] < 100 && (
                        <Progress 
                          value={uploadProgress[uploadedFile.name]} 
                          className="h-1 mt-1" 
                        />
                      )}
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
                      <p className="text-xs text-muted-foreground">{getAudioInstructions()}</p>
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
                      accept={getAcceptedAudioTypes()}
                      onChange={handleFullTrackUpload}
                    />
                  </>
                )}
              </div>
            </div>
            
            {/* Preview track section now indicates that it will be auto-generated */}
            <div>
              <h4 className="text-sm font-medium mb-1">Preview Track</h4>
              <div 
                className={`border rounded-lg p-3 flex items-center gap-3
                  ${previewFile ? "bg-primary/5 border-primary/30" : "border-muted"} 
                  transition-colors`}
              >
                {previewFile ? (
                  <>
                    <button
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                      onClick={togglePlayPause}
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
                        if (audioPlayer) {
                          audioPlayer.pause();
                          setIsPlaying(false);
                        }
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
                      <p className="text-xs sm:text-sm font-medium">
                        {processingFiles ? "Generating preview..." : "Preview will be auto-generated"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        30-second watermarked MP3 sample
                      </p>
                    </div>
                    {processingFiles && (
                      <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Stems upload for exclusive licenses only */}
            {hasExclusiveLicense && (
              <div>
                <h4 className="text-sm font-medium mb-1">Stems (Optional for Exclusive)</h4>
                <div 
                  className={`border rounded-lg p-3 flex items-center gap-3 ${
                    stems ? "bg-primary/5 border-primary/30" : "border-muted"
                  } transition-colors`}
                >
                  {stems ? (
                    <>
                      <FileUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                      <div className="flex-1 overflow-hidden">
                        <p className="text-xs sm:text-sm font-medium truncate">{stems.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(stems.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        
                        {uploadProgress[stems.name] !== undefined && uploadProgress[stems.name] < 100 && (
                          <Progress 
                            value={uploadProgress[stems.name]} 
                            className="h-1 mt-1" 
                          />
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStems(null);
                        }}
                      >
                        <X size={16} />
                      </Button>
                    </>
                  ) : (
                    <>
                      <FileUp className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm font-medium">Upload stems</p>
                        <p className="text-xs text-muted-foreground">ZIP file, max 100MB</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => document.getElementById("stems")?.click()}
                        className="px-2 sm:px-3"
                      >
                        <span className="hidden sm:inline">Upload</span>
                        <Upload className="h-4 w-4 sm:ml-2 sm:hidden" />
                      </Button>
                      <input 
                        id="stems" 
                        type="file" 
                        className="hidden" 
                        accept=".zip,application/zip,application/x-zip-compressed" 
                        onChange={handleStemsUpload}
                      />
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {validationError && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};
