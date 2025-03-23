import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Upload, X, Plus, FileAudio, Image, Play, Pause, Info, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { uploadBeat } from "@/lib/beatStorage";

export default function UploadBeat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("details");
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [beatDetails, setBeatDetails] = useState({
    title: "",
    description: "",
    genre: "",
    trackType: "",
    bpm: 90,
    key: "",
    priceLocal: 10000, // NGN
    priceDiaspora: 25, // USD
    status: "draft" as "draft" | "published",
  });

  const [collaborators, setCollaborators] = useState([
    { id: 1, name: user?.name || "", email: user?.email || "", role: "Producer", percentage: 100 }
  ]);

  const handleBeatChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setBeatDetails({
      ...beatDetails,
      [name]: value,
    });
  };

  const handleFullTrackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
      toast.success("Full track uploaded");
    }
  };

  const handlePreviewUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPreviewFile(e.target.files[0]);
      toast.success("Preview track uploaded");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      toast.success("Cover image uploaded");
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim() !== '') {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
        setTagInput('');
      } else {
        toast.error("Tag already exists");
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleAddCollaborator = () => {
    if (collaborators.length >= 5) {
      toast.error("Maximum 5 collaborators allowed");
      return;
    }
    
    setCollaborators([
      ...collaborators,
      { id: Date.now(), name: "", email: "", role: "", percentage: 0 }
    ]);
  };

  const handleRemoveCollaborator = (id: number) => {
    if (collaborators.length <= 1) {
      toast.error("At least one collaborator is required");
      return;
    }
    
    const removedCollaborator = collaborators.find(c => c.id === id);
    const remainingCollaborators = collaborators.filter(c => c.id !== id);
    
    if (removedCollaborator && remainingCollaborators.length > 0) {
      const percentageToDistribute = removedCollaborator.percentage;
      const equalShare = percentageToDistribute / remainingCollaborators.length;
      
      const updatedCollaborators = remainingCollaborators.map(c => ({
        ...c,
        percentage: Math.round(c.percentage + equalShare)
      }));
      
      setCollaborators(updatedCollaborators);
    }
  };

  const handleCollaboratorChange = (id: number, field: string, value: string | number) => {
    setCollaborators(prev => 
      prev.map(c => 
        c.id === id ? { ...c, [field]: value } : c
      )
    );
  };

  const validateForm = () => {
    if (!beatDetails.title) {
      toast.error("Beat title is required");
      return false;
    }
    
    if (!uploadedFile) {
      toast.error("Full track file is required");
      return false;
    }
    
    if (!previewFile) {
      toast.error("Preview track is required");
      return false;
    }
    
    if (!imageFile) {
      toast.error("Cover image is required");
      return false;
    }
    
    if (!beatDetails.genre) {
      toast.error("Genre is required");
      return false;
    }
    
    if (!beatDetails.trackType) {
      toast.error("Track type is required");
      return false;
    }
    
    const totalPercentage = collaborators.reduce((sum, c) => sum + c.percentage, 0);
    if (totalPercentage !== 100) {
      toast.error("Collaborator percentages must sum to 100%");
      return false;
    }
    
    return true;
  };

  const handlePublish = async () => {
    if (!validateForm()) return;
    if (!user) {
      toast.error("You must be logged in to publish a beat");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const beatData = {
        title: beatDetails.title,
        description: beatDetails.description || "",
        genre: beatDetails.genre,
        track_type: beatDetails.trackType,
        bpm: beatDetails.bpm,
        tags: tags,
        price_local: beatDetails.priceLocal,
        price_diaspora: beatDetails.priceDiaspora,
        status: "published" as const,
      };
      
      if (!uploadedFile || !previewFile || !imageFile) {
        throw new Error("Missing required files");
      }
      
      const result = await uploadBeat(
        beatData,
        uploadedFile,
        previewFile,
        imageFile,
        user.id,
        user.producer_name || user.name,
        collaborators
      );
      
      if (result.success) {
        toast.success("Beat published successfully!");
        navigate("/producer/beats");
      } else {
        throw new Error(result.error || "Failed to upload beat");
      }
    } catch (error) {
      console.error("Error publishing beat:", error);
      toast.error(error instanceof Error ? error.message : "Error publishing beat");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) return;
    if (!user) {
      toast.error("You must be logged in to save a beat");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const beatData = {
        title: beatDetails.title,
        description: beatDetails.description || "",
        genre: beatDetails.genre,
        track_type: beatDetails.trackType,
        bpm: beatDetails.bpm,
        tags: tags,
        price_local: beatDetails.priceLocal,
        price_diaspora: beatDetails.priceDiaspora,
        status: "draft" as const,
      };
      
      if (!uploadedFile || !previewFile || !imageFile) {
        throw new Error("Missing required files");
      }
      
      const result = await uploadBeat(
        beatData,
        uploadedFile,
        previewFile,
        imageFile,
        user.id,
        user.producer_name || user.name,
        collaborators
      );
      
      if (result.success) {
        toast.success("Beat saved as draft");
        navigate("/producer/beats");
      } else {
        throw new Error(result.error || "Failed to save beat");
      }
    } catch (error) {
      console.error("Error saving beat draft:", error);
      toast.error(error instanceof Error ? error.message : "Error saving beat");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextTab = () => {
    if (activeTab === "details") setActiveTab("files");
    else if (activeTab === "files") setActiveTab("pricing");
    else if (activeTab === "pricing") setActiveTab("royalties");
  };

  const prevTab = () => {
    if (activeTab === "royalties") setActiveTab("pricing");
    else if (activeTab === "pricing") setActiveTab("files");
    else if (activeTab === "files") setActiveTab("details");
  };

  return (
    <MainLayout>
      <div className="container py-8 max-w-4xl">
        <Card className="overflow-hidden">
          <CardHeader className="bg-card">
            <CardTitle>Upload a New Beat</CardTitle>
            <CardDescription>
              Fill in the details below to upload your beat to the marketplace
            </CardDescription>
          </CardHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start p-0 bg-transparent border-b rounded-none">
              <TabsTrigger 
                value="details" 
                className="rounded-none flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                1. Beat Details
              </TabsTrigger>
              <TabsTrigger 
                value="files" 
                className="rounded-none flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                2. Files & Media
              </TabsTrigger>
              <TabsTrigger 
                value="pricing" 
                className="rounded-none flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                3. Pricing
              </TabsTrigger>
              <TabsTrigger 
                value="royalties" 
                className="rounded-none flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                4. Royalty Splits
              </TabsTrigger>
            </TabsList>

            <CardContent className="p-6">
              <TabsContent value="details" className="mt-0 animate-fade-in">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="title">Beat Title *</Label>
                      <Input 
                        id="title" 
                        name="title"
                        value={beatDetails.title}
                        onChange={handleBeatChange}
                        placeholder="Give your beat a catchy title" 
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea 
                        id="description" 
                        name="description"
                        value={beatDetails.description}
                        onChange={handleBeatChange}
                        placeholder="Describe your beat... What inspired you?" 
                        rows={4}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="genre">Genre *</Label>
                        <Select 
                          name="genre" 
                          onValueChange={(value) => setBeatDetails({...beatDetails, genre: value})}
                          value={beatDetails.genre}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select genre" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="afrobeat">Afrobeat</SelectItem>
                            <SelectItem value="amapiano">Amapiano</SelectItem>
                            <SelectItem value="hiphop">Hip Hop</SelectItem>
                            <SelectItem value="rnb">R&B</SelectItem>
                            <SelectItem value="pop">Pop</SelectItem>
                            <SelectItem value="highlife">Highlife</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="trackType">Track Type *</Label>
                        <Select 
                          name="trackType" 
                          onValueChange={(value) => setBeatDetails({...beatDetails, trackType: value})}
                          value={beatDetails.trackType}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">Single</SelectItem>
                            <SelectItem value="mix">Mix</SelectItem>
                            <SelectItem value="loop">Loop</SelectItem>
                            <SelectItem value="sample">Sample</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="bpm">BPM</Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            id="bpm"
                            min={40}
                            max={200}
                            step={1}
                            defaultValue={[90]}
                            value={[beatDetails.bpm]}
                            onValueChange={(value) => setBeatDetails({...beatDetails, bpm: value[0]})}
                            className="flex-1"
                          />
                          <span className="w-12 text-center font-medium">{beatDetails.bpm}</span>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="key">Key (optional)</Label>
                        <Select 
                          name="key" 
                          onValueChange={(value) => setBeatDetails({...beatDetails, key: value})}
                          value={beatDetails.key}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select key" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="C">C</SelectItem>
                            <SelectItem value="C#">C#</SelectItem>
                            <SelectItem value="D">D</SelectItem>
                            <SelectItem value="D#">D#</SelectItem>
                            <SelectItem value="E">E</SelectItem>
                            <SelectItem value="F">F</SelectItem>
                            <SelectItem value="F#">F#</SelectItem>
                            <SelectItem value="G">G</SelectItem>
                            <SelectItem value="G#">G#</SelectItem>
                            <SelectItem value="A">A</SelectItem>
                            <SelectItem value="A#">A#</SelectItem>
                            <SelectItem value="B">B</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="tags">Tags (Enter to add)</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <button 
                              onClick={() => handleRemoveTag(tag)} 
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <X size={12} />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <Input 
                        id="tags" 
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        placeholder="Add tags (e.g. afrobeat, dance)" 
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="files" className="mt-0 animate-fade-in">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-1">Cover Image *</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload a high quality square image (recommended size: 1000x1000px)
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <Image className="h-12 w-12 text-muted-foreground mb-2" />
                            <p className="text-sm font-medium">Drag and drop or click to upload</p>
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
                                <FileAudio className="h-8 w-8 text-primary" />
                                <div className="flex-1 overflow-hidden">
                                  <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                                  </p>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setUploadedFile(null)}
                                >
                                  <X size={16} />
                                </Button>
                              </>
                            ) : (
                              <>
                                <FileAudio className="h-8 w-8 text-muted-foreground" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">Upload full track</p>
                                  <p className="text-xs text-muted-foreground">MP3, WAV (max 50MB)</p>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => document.getElementById("fullTrack")?.click()}
                                >
                                  Upload
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
                                  className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                                  onClick={() => setIsPlaying(!isPlaying)}
                                >
                                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                                </button>
                                <div className="flex-1 overflow-hidden">
                                  <p className="text-sm font-medium truncate">{previewFile.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {(previewFile.size / (1024 * 1024)).toFixed(2)} MB
                                  </p>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setPreviewFile(null)}
                                >
                                  <X size={16} />
                                </Button>
                              </>
                            ) : (
                              <>
                                <FileAudio className="h-8 w-8 text-muted-foreground" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">Upload preview</p>
                                  <p className="text-xs text-muted-foreground">30-60 sec preview</p>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => document.getElementById("previewTrack")?.click()}
                                >
                                  Upload
                                </Button>
                                <input 
                                  id="previewTrack" 
                                  type="file" 
                                  className="hidden" 
                                  accept="audio/*"
                                  onChange={handlePreviewUpload}
                                />
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pricing" className="mt-0 animate-fade-in">
                <div className="space-y-6">
                  <div className="bg-muted/30 rounded-lg p-4 flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium">Dual Pricing</h3>
                      <p className="text-xs text-muted-foreground">
                        Set different prices for local (NGN) and international (USD) customers. 
                        The platform will automatically show the right currency based on the user's location.
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="priceLocal">Local Price (NGN) *</Label>
                      <div className="flex items-center mt-1.5">
                        <div className="bg-muted flex items-center justify-center h-10 px-3 rounded-l-md border-y border-l">
                          ₦
                        </div>
                        <Input
                          id="priceLocal"
                          name="priceLocal"
                          type="number"
                          value={beatDetails.priceLocal}
                          onChange={(e) => setBeatDetails({...beatDetails, priceLocal: parseInt(e.target.value) || 0})}
                          className="rounded-l-none"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Recommended: ₦8,000 - ₦15,000 for basic license
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="priceDiaspora">International Price (USD) *</Label>
                      <div className="flex items-center mt-1.5">
                        <div className="bg-muted flex items-center justify-center h-10 px-3 rounded-l-md border-y border-l">
                          $
                        </div>
                        <Input
                          id="priceDiaspora"
                          name="priceDiaspora"
                          type="number"
                          value={beatDetails.priceDiaspora}
                          onChange={(e) => setBeatDetails({...beatDetails, priceDiaspora: parseInt(e.target.value) || 0})}
                          className="rounded-l-none"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Recommended: $20 - $35 for basic license
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <Label htmlFor="status">Beat Status</Label>
                        <p className="text-xs text-muted-foreground">
                          Draft beats are not visible in the marketplace
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Draft</span>
                        <Switch 
                          id="status"
                          checked={beatDetails.status === "published"}
                          onCheckedChange={(checked) => 
                            setBeatDetails({
                              ...beatDetails, 
                              status: checked ? "published" : "draft"
                            })
                          }
                        />
                        <span className="text-sm">Published</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="royalties" className="mt-0 animate-fade-in">
                <div className="space-y-6">
                  <div className="bg-muted/30 rounded-lg p-4 flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium">Royalty Splits</h3>
                      <p className="text-xs text-muted-foreground">
                        Add collaborators who contributed to this beat and specify their percentage split.
                        The total must add up to 100%.
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {collaborators.map((collaborator, index) => (
                      <div key={collaborator.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium">
                            {index === 0 ? 'Primary Producer' : `Collaborator ${index}`}
                          </h4>
                          {index > 0 && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleRemoveCollaborator(collaborator.id)}
                            >
                              <X size={16} />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <Label htmlFor={`name-${collaborator.id}`}>Name</Label>
                            <Input
                              id={`name-${collaborator.id}`}
                              value={collaborator.name}
                              onChange={(e) => handleCollaboratorChange(collaborator.id, 'name', e.target.value)}
                              disabled={index === 0}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`email-${collaborator.id}`}>Email</Label>
                            <Input
                              id={`email-${collaborator.id}`}
                              type="email"
                              value={collaborator.email}
                              onChange={(e) => handleCollaboratorChange(collaborator.id, 'email', e.target.value)}
                              disabled={index === 0}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`role-${collaborator.id}`}>Role</Label>
                            <Select
                              value={collaborator.role}
                              onValueChange={(value) => handleCollaboratorChange(collaborator.id, 'role', value)}
                              disabled={index === 0}
                            >
                              <SelectTrigger id={`role-${collaborator.id}`}>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Producer">Producer</SelectItem>
                                <SelectItem value="Co-Producer">Co-Producer</SelectItem>
                                <SelectItem value="Sound Engineer">Sound Engineer</SelectItem>
                                <SelectItem value="Composer">Composer</SelectItem>
                                <SelectItem value="Instrumentalist">Instrumentalist</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor={`percentage-${collaborator.id}`}>
                              Percentage (%)
                            </Label>
                            <div className="flex items-center gap-4">
                              <Slider
                                id={`percentage-${collaborator.id}`}
                                min={0}
                                max={100}
                                step={1}
                                value={[collaborator.percentage]}
                                onValueChange={(value) => handleCollaboratorChange(collaborator.id, 'percentage', value[0])}
                                className="flex-1"
                              />
                              <span className="w-12 text-center font-medium">
                                {collaborator.percentage}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <Button 
                      variant="outline" 
                      className="w-full gap-2"
                      onClick={handleAddCollaborator}
                    >
                      <Plus size={16} />
                      <span>Add Collaborator</span>
                    </Button>
                  </div>
                  
                  <div className="bg-card p-4 rounded-lg">
                    <h4 className="text-sm font-medium mb-3">Royalty Split Summary</h4>
                    <div className="space-y-2">
                      {collaborators.map((collaborator) => (
                        <div key={collaborator.id} className="flex items-center justify-between">
                          <span className="text-sm">{collaborator.name || 'Unnamed'}</span>
                          <span className="text-sm font-medium">{collaborator.percentage}%</span>
                        </div>
                      ))}
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total</span>
                        <span className="text-sm font-bold">
                          {collaborators.reduce((sum, c) => sum + c.percentage, 0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </CardContent>

            <CardFooter className="flex justify-between p-6 border-t bg-card">
              <div>
                {activeTab !== "details" && (
                  <Button variant="outline" onClick={prevTab} disabled={isSubmitting}>
                    Previous
                  </Button>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleSaveDraft} 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save as Draft"
                  )}
                </Button>
                {activeTab !== "royalties" ? (
                  <Button onClick={nextTab} disabled={isSubmitting}>
                    Continue
                  </Button>
                ) : (
                  <Button onClick={handlePublish} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      "Publish Beat"
                    )}
                  </Button>
                )}
              </div>
            </CardFooter>
          </Tabs>
        </Card>
      </div>
    </MainLayout>
  );
}
