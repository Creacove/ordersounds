
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
  const [selectedLicenseTypes, setSelectedLicenseTypes] = useState<string[]>(['basic']);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const [beatDetails, setBeatDetails] = useState<BeatDetails>({
    title: "",
    description: "",
    genre: "",
    trackType: "",
    bpm: 90,
    key: "Not Sure",
    priceLocal: 10000,
    priceDiaspora: 25,
    basicLicensePriceLocal: 5000,
    basicLicensePriceDiaspora: 15,
    premiumLicensePriceLocal: 10000,
    premiumLicensePriceDiaspora: 25,
    exclusiveLicensePriceLocal: 30000,
    exclusiveLicensePriceDiaspora: 75,
    status: "draft",
    licenseType: "basic",
    licenseTerms: "",
    customLicensePriceLocal: 15000,
    customLicensePriceDiaspora: 40,
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

  const handleFullTrackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      // Initialize progress at 0 for this file
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
      
      // Clear preview file as it will be auto-generated
      setPreviewFile(null);
      setPreviewUrl(null);
      
      try {
        // Upload the file immediately
        toast.info("Uploading full track...");

        // Track upload progress with the updated uploadFile function
        const url = await uploadFile(file, 'beats', 'full-tracks', (progress) => {
          console.log(`Upload progress for ${file.name}: ${progress}%`);
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
        });
        
        setUploadedFileUrl(url);
        toast.success("Full track uploaded");

        // Generate preview
        toast.info("Processing audio and generating preview...");
        await generatePreview(url);
      } catch (error) {
        console.error("Error uploading file:", error);
        toast.error("Failed to upload file. Please try again.");
      }
    }
  };
  
  const generatePreview = async (fileUrl: string) => {
    try {
      setProcessingFiles(true);
      setPreviewUrl(null);
      setPreviewFile(null);
      
      // Call the process-audio edge function
      const { data, error } = await supabase.functions.invoke('process-audio', {
        body: { 
          fullTrackUrl: fileUrl,
          requiresWav: selectedLicenseTypes.includes('premium') || selectedLicenseTypes.includes('exclusive')
        }
      });
      
      if (error) {
        console.error("Error processing audio:", error);
        const errorMessage = error.message || "Failed to process audio. Please try again.";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      if (data && data.publicUrl) {
        // Set the preview URL
        console.log("Preview generated successfully:", data.publicUrl);
        setPreviewUrl(data.publicUrl);
        toast.success("Audio processing complete");
        return data.publicUrl;
      } else {
        console.error("No preview URL returned from processing");
        toast.error("Failed to generate audio preview");
        throw new Error("No preview URL returned from processing");
      }
    } catch (error) {
      console.error("Error in audio processing:", error);
      toast.error("Failed to process audio. Please try again.");
      throw error;
    } finally {
      setProcessingFiles(false);
    }
  };

  const handlePreviewUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Preview file must be less than 10MB");
        return;
      }
      
      // Validate file type
      if (file.type !== "audio/mpeg" && !file.name.endsWith('.mp3')) {
        toast.error("Preview file must be in MP3 format");
        return;
      }
      
      setPreviewFile(file);
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
      
      // Upload the preview file immediately
      uploadPreviewFile(file);
    }
  };
  
  const uploadPreviewFile = async (file: File) => {
    try {
      toast.info("Uploading preview...");
      
      // Use the updated uploadFile function with progress tracking
      const url = await uploadFile(file, 'beats', 'previews', (progress) => {
        setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
      });
      
      setPreviewUrl(url);
      toast.success("Preview uploaded");
    } catch (error) {
      console.error("Error uploading preview:", error);
      toast.error("Failed to upload preview. Please try again.");
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
      
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        toast.error("Cover image must be JPG, PNG, or GIF format");
        return;
      }
      
      setImageFile(file);
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
      
      // Show preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Upload the image file immediately
      uploadImageFile(file);
    }
  };
  
  const uploadImageFile = async (file: File) => {
    try {
      toast.info("Uploading cover image...");
      
      // Use the updated uploadFile function with progress tracking
      await uploadFile(file, 'covers', 'beats', (progress) => {
        setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
      });
      
      toast.success("Cover image uploaded");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload cover image. Please try again.");
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
    
    if (!uploadedFile && !uploadedFileUrl) {
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
    
    // Preview is required
    if (!previewUrl && !previewFile) {
      toast.error("Preview track is required. Please try re-uploading the full track or upload a separate preview");
      return false;
    }
    
    const totalPercentage = collaborators.reduce((sum, c) => sum + c.percentage, 0);
    if (totalPercentage !== 100) {
      toast.error("Collaborator percentages must sum to 100%");
      return false;
    }
    
    return true;
  };

  const regeneratePreview = async () => {
    if (!uploadedFileUrl) {
      toast.error("Please upload a full track first");
      return;
    }
    
    try {
      await generatePreview(uploadedFileUrl);
    } catch (error) {
      console.error("Failed to regenerate preview:", error);
      toast.error("Failed to regenerate preview. Please try again.");
    }
  };

  const handleStemsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size
      if (file.size > 100 * 1024 * 1024) {
        toast.error("Stems file must be less than 100MB");
        return;
      }
      
      // Validate file type
      if (file.type !== "application/zip" && !file.name.endsWith('.zip')) {
        toast.error("Stems file must be a ZIP archive");
        return;
      }
      
      setStems(file);
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
      
      // Upload the stems file immediately
      uploadStemsFile(file);
    }
  };
  
  const uploadStemsFile = async (file: File) => {
    try {
      toast.info("Uploading stems...");
      
      // Use the updated uploadFile function with progress tracking
      await uploadFile(file, 'beats', 'stems', (progress) => {
        setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
      });
      
      toast.success("Stems uploaded");
    } catch (error) {
      console.error("Error uploading stems:", error);
      toast.error("Failed to upload stems. Please try again.");
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
    previewUrl, setPreviewUrl,
    uploadProgress,
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
    handleStemsUpload,
    regeneratePreview,
    licenseOptions,
    uploadedFileUrl
  };
};
