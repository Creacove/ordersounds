
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { uploadFile } from "@/lib/storage";

export type LicenseOption = {
  value: string;
  label: string;
  description: string;
  terms: string;
};

export type BeatDetails = {
  title: string;
  description: string;
  genre: string;
  trackType: string;
  bpm: number;
  key: string;
  priceLocal: number;
  priceDiaspora: number;
  basicLicensePriceLocal: number;
  basicLicensePriceDiaspora: number;
  premiumLicensePriceLocal: number;
  premiumLicensePriceDiaspora: number;
  exclusiveLicensePriceLocal: number;
  exclusiveLicensePriceDiaspora: number;
  status: "draft" | "published";
  licenseType: string;
  licenseTerms: string;
  customLicensePriceLocal: number;
  customLicensePriceDiaspora: number;
};

export type Collaborator = {
  id: number;
  name: string;
  email: string;
  role: string;
  percentage: number;
};

export const useBeatUpload = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("details");
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [stems, setStems] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingFiles, setProcessingFiles] = useState(false);
  const [selectedLicenseTypes, setSelectedLicenseTypes] = useState<string[]>(['basic']); // Default to basic license
  
  const [beatDetails, setBeatDetails] = useState<BeatDetails>({
    title: "",
    description: "",
    genre: "",
    trackType: "",
    bpm: 90,
    key: "",
    priceLocal: 10000, // NGN
    priceDiaspora: 25, // USD
    basicLicensePriceLocal: 5000, // NGN
    basicLicensePriceDiaspora: 15, // USD
    premiumLicensePriceLocal: 10000, // NGN
    premiumLicensePriceDiaspora: 25, // USD
    exclusiveLicensePriceLocal: 30000, // NGN
    exclusiveLicensePriceDiaspora: 75, // USD
    status: "draft",
    licenseType: "basic", // Default license type
    licenseTerms: "",
    customLicensePriceLocal: 15000, // NGN for custom license
    customLicensePriceDiaspora: 40, // USD for custom license
  });

  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    { id: 1, name: user?.name || "", email: user?.email || "", role: "Producer", percentage: 100 }
  ]);

  const licenseOptions: LicenseOption[] = [
    {
      value: "basic",
      label: "Basic License",
      description: "Non-exclusive rights, limited distribution (up to 5,000 streams/sales). MP3 format only.",
      terms: "This is a non-exclusive license granting the right to use the beat for one single commercial release with up to 5,000 streams/downloads/sales. No broadcasting rights for radio, TV, or similar platforms. Credit must be given to the producer."
    },
    {
      value: "premium",
      label: "Premium License",
      description: "Non-exclusive rights, unlimited distribution, some broadcasting rights. WAV format included.",
      terms: "This is a non-exclusive license granting the right to use the beat for one single commercial release with unlimited streams/downloads/sales. Includes limited broadcasting rights (for online videos, podcasts). Credit must be given to the producer."
    },
    {
      value: "exclusive",
      label: "Exclusive License",
      description: "Full ownership transfer, all rights to the beat (limited to one buyer). WAV + Stems included.",
      terms: "This is an exclusive license transferring full ownership rights to the beat. The producer retains credits as the original creator but transfers all commercial exploitation rights to the buyer. The beat will be removed from all marketplaces after purchase."
    },
    {
      value: "custom",
      label: "Custom License",
      description: "Define your own terms and conditions.",
      terms: ""
    }
  ];

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
      const file = e.target.files[0];
      
      // Validate file size
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File must be less than 50MB");
        return;
      }
      
      // Check if premium/exclusive license requires WAV
      const requiresWavFormat = selectedLicenseTypes.includes('premium') || 
                                selectedLicenseTypes.includes('exclusive');
                                
      if (requiresWavFormat && file.type !== "audio/wav" && !file.name.endsWith('.wav')) {
        toast.error("Premium and exclusive licenses require WAV format");
        return;
      }
      
      setUploadedFile(file);
      
      // Clear preview file as it will be auto-generated
      setPreviewFile(null);
      
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
      
      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Cover image must be less than 5MB");
        return;
      }
      
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

  const handleLicenseTypeChange = (value: string, isChecked: boolean) => {
    if (isChecked) {
      // Add license type
      setSelectedLicenseTypes(prev => [...prev, value]);
      
      // If this is a custom license, update the license terms
      if (value === 'custom') {
        const customOption = licenseOptions.find(option => option.value === 'custom');
        if (customOption) {
          setBeatDetails({
            ...beatDetails,
            licenseTerms: beatDetails.licenseTerms || customOption.terms
          });
        }
      }
    } else {
      // Remove license type
      setSelectedLicenseTypes(prev => prev.filter(type => type !== value));
    }
    
    // Update the primary license type if needed
    if (isChecked && beatDetails.licenseType === '') {
      setBeatDetails({
        ...beatDetails,
        licenseType: value
      });
    } else if (!isChecked && beatDetails.licenseType === value) {
      // If we're unchecking the current primary license, set the first available one
      const newLicenseTypes = selectedLicenseTypes.filter(type => type !== value);
      if (newLicenseTypes.length > 0) {
        setBeatDetails({
          ...beatDetails,
          licenseType: newLicenseTypes[0]
        });
      } else {
        setBeatDetails({
          ...beatDetails,
          licenseType: ''
        });
      }
    }
    
    // If we're changing license types, check if the uploaded file format is compatible
    if (uploadedFile) {
      const requiresWavFormat = (value === 'premium' || value === 'exclusive') && isChecked;
      const hasWav = uploadedFile.type === "audio/wav" || uploadedFile.name.endsWith('.wav');
      
      if (requiresWavFormat && !hasWav) {
        toast.warning("Premium and exclusive licenses require WAV format. Please upload a WAV file.");
      }
    }
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
    
    if (selectedLicenseTypes.length === 0) {
      toast.error("At least one license type is required");
      return false;
    }
    
    if (selectedLicenseTypes.includes('custom') && !beatDetails.licenseTerms) {
      toast.error("Custom license terms are required");
      return false;
    }
    
    // Check for premium/exclusive license requiring WAV format
    const requiresWavFormat = selectedLicenseTypes.includes('premium') || 
                              selectedLicenseTypes.includes('exclusive');
                              
    if (requiresWavFormat && uploadedFile && 
        uploadedFile.type !== "audio/wav" && 
        !uploadedFile.name.endsWith('.wav')) {
      toast.error("Premium and exclusive licenses require WAV format");
      return false;
    }
    
    // Validate stems for exclusive license
    if (selectedLicenseTypes.includes('exclusive') && 
        stems && 
        stems.type !== "application/zip" && 
        !stems.name.endsWith('.zip')) {
      toast.error("Stems must be a ZIP file");
      return false;
    }
    
    const totalPercentage = collaborators.reduce((sum, c) => sum + c.percentage, 0);
    if (totalPercentage !== 100) {
      toast.error("Collaborator percentages must sum to 100%");
      return false;
    }
    
    return true;
  };

  const processAudio = async (fullTrackUrl: string) => {
    try {
      setProcessingFiles(true);
      
      // Call the process-audio edge function
      const { data, error } = await supabase.functions.invoke('process-audio', {
        body: { 
          fullTrackUrl,
          requiresWav: selectedLicenseTypes.includes('premium') || selectedLicenseTypes.includes('exclusive')
        }
      });
      
      if (error) {
        console.error("Error processing audio:", error);
        toast.error("Failed to process audio. Please try again.");
        throw error;
      }
      
      if (data && data.previewUrl) {
        // Download the processed preview to show in UI
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('beats')
          .download(data.previewUrl);
          
        if (downloadError) {
          console.error("Error downloading preview:", downloadError);
          throw downloadError;
        }
        
        // Create a File object from the downloaded blob
        const previewFileObj = new File([fileData], "preview.mp3", { 
          type: "audio/mpeg" 
        });
        
        setPreviewFile(previewFileObj);
        toast.success("Audio processing complete");
        return data.previewUrl;
      }
      
      return null;
    } catch (error) {
      console.error("Error in audio processing:", error);
      toast.error("Failed to process audio");
      return null;
    } finally {
      setProcessingFiles(false);
    }
  };

  return {
    activeTab, setActiveTab,
    beatDetails, setBeatDetails,
    uploadedFile, setUploadedFile,
    previewFile, setPreviewFile,
    imageFile, setImageFile,
    imagePreview, setImagePreview,
    tags, setTags,
    tagInput, setTagInput,
    collaborators, setCollaborators,
    isPlaying, setIsPlaying,
    isSubmitting, setIsSubmitting,
    selectedLicenseTypes, setSelectedLicenseTypes,
    stems, setStems,
    processingFiles, setProcessingFiles,
    validateForm,
    handleLicenseTypeChange,
    handleCollaboratorChange,
    handleRemoveCollaborator,
    handleAddCollaborator,
    handleRemoveTag,
    handleAddTag,
    handleBeatChange,
    handleImageUpload,
    handlePreviewUpload,
    handleFullTrackUpload,
    processAudio,
    licenseOptions
  };
};
