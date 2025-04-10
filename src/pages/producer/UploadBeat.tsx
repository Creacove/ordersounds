
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { uploadBeat } from "@/lib/beatStorage";
import { DetailTab } from "@/components/upload/DetailTab";
import { FilesTab } from "@/components/upload/FilesTab";
import { LicensingTab } from "@/components/upload/LicensingTab";
import { PricingTab } from "@/components/upload/PricingTab";
import { RoyaltiesTab } from "@/components/upload/RoyaltiesTab";
import { useBeatUpload } from "@/hooks/useBeatUpload";

export default function UploadBeat() {
  // Define the new order of tabs
  const tabOrder = ["details", "licensing", "files", "pricing", "royalties"];

  const { 
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
    selectedLicenseTypes, stems, setStems,
    processingFiles,
    previewUrl,
    validateForm, handleLicenseTypeChange,
    handleCollaboratorChange, handleRemoveCollaborator, handleAddCollaborator,
    handleRemoveTag, handleAddTag,
    handleBeatChange, handleImageUpload, handlePreviewUpload, handleFullTrackUpload,
    processAudio, regeneratePreview, licenseOptions
  } = useBeatUpload();
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const nextTab = () => {
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex < tabOrder.length - 1) {
      // Validate current tab before proceeding
      if (validateCurrentTab()) {
        setActiveTab(tabOrder[currentIndex + 1]);
      }
    }
  };

  const prevTab = () => {
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabOrder[currentIndex - 1]);
    }
  };

  // Validate the current tab before moving to next
  const validateCurrentTab = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (activeTab === "details") {
      if (!beatDetails.title) {
        newErrors.title = "Beat title is required";
      }
      if (!beatDetails.genre) {
        newErrors.genre = "Genre is required";
      }
      if (!beatDetails.trackType) {
        newErrors.trackType = "Track type is required";
      }
    } else if (activeTab === "licensing") {
      if (selectedLicenseTypes.length === 0) {
        newErrors.licenseType = "At least one license type is required";
      }
      if (selectedLicenseTypes.includes('custom') && !beatDetails.licenseTerms) {
        newErrors.licenseTerms = "Custom license terms are required";
      }
    } else if (activeTab === "files") {
      if (!imageFile) {
        newErrors.coverImage = "Cover image is required";
      }
      if (!uploadedFile) {
        newErrors.fullTrack = "Full track is required";
      }
      
      // Check if WAV is required but MP3 was provided
      const requiresWavFormat = selectedLicenseTypes.includes('premium') || 
                              selectedLicenseTypes.includes('exclusive');
      if (requiresWavFormat && uploadedFile && 
          uploadedFile.type !== "audio/wav" && 
          !uploadedFile.name.endsWith('.wav')) {
        newErrors.fullTrack = "Premium and exclusive licenses require WAV format";
      }
    } else if (activeTab === "pricing") {
      // Check that license prices are set
      selectedLicenseTypes.forEach(license => {
        if (license === 'basic' && (!beatDetails.basicLicensePriceLocal || !beatDetails.basicLicensePriceDiaspora)) {
          newErrors.basicPrice = "Basic license prices are required";
        }
        if (license === 'premium' && (!beatDetails.premiumLicensePriceLocal || !beatDetails.premiumLicensePriceDiaspora)) {
          newErrors.premiumPrice = "Premium license prices are required";
        }
        if (license === 'exclusive' && (!beatDetails.exclusiveLicensePriceLocal || !beatDetails.exclusiveLicensePriceDiaspora)) {
          newErrors.exclusivePrice = "Exclusive license prices are required";
        }
        if (license === 'custom' && (!beatDetails.customLicensePriceLocal || !beatDetails.customLicensePriceDiaspora)) {
          newErrors.customPrice = "Custom license prices are required";
        }
      });
    } else if (activeTab === "royalties") {
      const totalPercentage = collaborators.reduce((sum, c) => sum + c.percentage, 0);
      if (totalPercentage !== 100) {
        newErrors.royalties = "Collaborator percentages must sum to 100%";
      }
      
      // Check that all collaborators have required fields
      collaborators.forEach((c, index) => {
        if (!c.name) {
          newErrors[`collaborator_${index}_name`] = "Name is required";
        }
        if (!c.role) {
          newErrors[`collaborator_${index}_role`] = "Role is required";
        }
      });
    }
    
    // If there are errors, show them and prevent moving to next tab
    if (Object.keys(newErrors).length > 0) {
      setValidationErrors(newErrors);
      
      // Show the first error as a toast
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError);
      
      return false;
    }
    
    // Clear errors for this tab
    setValidationErrors({});
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
      console.log('Publishing beat with license types:', selectedLicenseTypes);
      console.log('License prices:', {
        basic: {
          local: beatDetails.basicLicensePriceLocal,
          diaspora: beatDetails.basicLicensePriceDiaspora
        },
        premium: {
          local: beatDetails.premiumLicensePriceLocal,
          diaspora: beatDetails.premiumLicensePriceDiaspora
        },
        exclusive: {
          local: beatDetails.exclusiveLicensePriceLocal,
          diaspora: beatDetails.exclusiveLicensePriceDiaspora
        },
        custom: {
          local: beatDetails.customLicensePriceLocal,
          diaspora: beatDetails.customLicensePriceDiaspora
        }
      });
      
      // Generate preview if needed
      let previewTrackUrl = '';
      if (!previewFile && uploadedFile) {
        // Process the full track to generate preview
        const uploadResult = await uploadFile(uploadedFile, 'beats', 'full-tracks');
        if (uploadResult) {
          previewTrackUrl = await processAudio(uploadResult);
          if (!previewTrackUrl) {
            throw new Error("Failed to process audio and generate preview");
          }
        }
      }
      
      const beatData = {
        title: beatDetails.title,
        description: beatDetails.description || "",
        genre: beatDetails.genre,
        track_type: beatDetails.trackType,
        bpm: beatDetails.bpm,
        key: beatDetails.key,
        tags: tags,
        basic_license_price_local: selectedLicenseTypes.includes('basic') ? beatDetails.basicLicensePriceLocal : 0,
        basic_license_price_diaspora: selectedLicenseTypes.includes('basic') ? beatDetails.basicLicensePriceDiaspora : 0,
        premium_license_price_local: selectedLicenseTypes.includes('premium') ? beatDetails.premiumLicensePriceLocal : 0,
        premium_license_price_diaspora: selectedLicenseTypes.includes('premium') ? beatDetails.premiumLicensePriceDiaspora : 0,
        exclusive_license_price_local: selectedLicenseTypes.includes('exclusive') ? beatDetails.exclusiveLicensePriceLocal : 0,
        exclusive_license_price_diaspora: selectedLicenseTypes.includes('exclusive') ? beatDetails.exclusiveLicensePriceDiaspora : 0,
        custom_license_price_local: selectedLicenseTypes.includes('custom') ? beatDetails.customLicensePriceLocal : undefined,
        custom_license_price_diaspora: selectedLicenseTypes.includes('custom') ? beatDetails.customLicensePriceDiaspora : undefined,
        status: "published" as const,
        license_type: selectedLicenseTypes.join(','),
        license_terms: beatDetails.licenseTerms
      };

      console.log('Beat data to upload:', beatData);
      
      if (!uploadedFile || !imageFile) {
        throw new Error("Missing required files");
      }

      if (collaborators[0].id === 1) {
        collaborators[0].name = user.name;
        collaborators[0].email = user.email || '';
      }
      
      const result = await uploadBeat(
        beatData,
        uploadedFile,
        previewFile,
        imageFile,
        stems,
        user.id,
        user.producer_name || user.name,
        collaborators,
        selectedLicenseTypes
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
      const primaryLicenseType = selectedLicenseTypes[0] || "basic";
      
      // Generate preview if needed
      let previewTrackUrl = '';
      if (!previewFile && uploadedFile) {
        // Process the full track to generate preview
        const uploadResult = await uploadFile(uploadedFile, 'beats', 'full-tracks');
        if (uploadResult) {
          previewTrackUrl = await processAudio(uploadResult);
        }
      }
      
      const beatData = {
        title: beatDetails.title,
        description: beatDetails.description || "",
        genre: beatDetails.genre,
        track_type: beatDetails.trackType,
        bpm: beatDetails.bpm,
        key: beatDetails.key,
        tags: tags,
        basic_license_price_local: selectedLicenseTypes.includes('basic') ? beatDetails.basicLicensePriceLocal : 0,
        basic_license_price_diaspora: selectedLicenseTypes.includes('basic') ? beatDetails.basicLicensePriceDiaspora : 0,
        premium_license_price_local: selectedLicenseTypes.includes('premium') ? beatDetails.premiumLicensePriceLocal : 0,
        premium_license_price_diaspora: selectedLicenseTypes.includes('premium') ? beatDetails.premiumLicensePriceDiaspora : 0,
        exclusive_license_price_local: selectedLicenseTypes.includes('exclusive') ? beatDetails.exclusiveLicensePriceLocal : 0,
        exclusive_license_price_diaspora: selectedLicenseTypes.includes('exclusive') ? beatDetails.exclusiveLicensePriceDiaspora : 0,
        custom_license_price_local: selectedLicenseTypes.includes('custom') ? beatDetails.customLicensePriceLocal : undefined,
        custom_license_price_diaspora: selectedLicenseTypes.includes('custom') ? beatDetails.customLicensePriceDiaspora : undefined,
        status: "draft" as const,
        license_type: selectedLicenseTypes.join(','),
        license_terms: beatDetails.licenseTerms
      };
      
      if (!uploadedFile || !imageFile) {
        throw new Error("Missing required files");
      }

      if (collaborators[0].id === 1) {
        collaborators[0].name = user.name;
        collaborators[0].email = user.email || '';
      }
      
      const result = await uploadBeat(
        beatData,
        uploadedFile,
        previewFile,
        imageFile,
        stems,
        user.id,
        user.producer_name || user.name,
        collaborators,
        selectedLicenseTypes
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

  // This function is used to upload files in the background
  const uploadFile = async (file: File, bucketName: string, folder: string) => {
    // Helper function to upload a file to Supabase Storage
    return new Promise<string | null>(async (resolve, reject) => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const filePath = `${folder}/${Date.now()}_${file.name}`;
        
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file, { 
            cacheControl: '3600',
            upsert: false
          });
        
        if (error) {
          console.error(`Error uploading file to ${bucketName}/${filePath}:`, error);
          reject(error);
          return;
        }
        
        // Get public URL for the file
        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(data.path);
        
        resolve(publicUrlData.publicUrl);
      } catch (err) {
        console.error('Error in uploadFile:', err);
        reject(err);
      }
    });
  };

  // Show better error messages for required fields
  useEffect(() => {
    if (validationErrors.title) {
      setActiveTab("details");
    } else if (validationErrors.licenseType || validationErrors.licenseTerms) {
      setActiveTab("licensing");
    } else if (validationErrors.coverImage || validationErrors.fullTrack) {
      setActiveTab("files");
    } else if (validationErrors.basicPrice || validationErrors.premiumPrice || 
              validationErrors.exclusivePrice || validationErrors.customPrice) {
      setActiveTab("pricing");
    } else if (validationErrors.royalties || Object.keys(validationErrors).some(key => key.startsWith("collaborator_"))) {
      setActiveTab("royalties");
    }
  }, [validationErrors]);

  return (
    <MainLayout>
      <div className="container py-4 sm:py-8 max-w-full sm:max-w-4xl px-2 sm:px-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-card p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl">Upload a New Beat</CardTitle>
            <CardDescription className="text-sm">
              Fill in the details below to upload your beat to the marketplace
            </CardDescription>
          </CardHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start p-0 bg-transparent border-b rounded-none overflow-x-auto flex-nowrap">
              <TabsTrigger 
                value="details" 
                className="rounded-none flex-1 min-w-[6rem] data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs sm:text-sm"
              >
                1. Details
              </TabsTrigger>
              <TabsTrigger 
                value="licensing" 
                className="rounded-none flex-1 min-w-[6rem] data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs sm:text-sm"
              >
                2. Licensing
              </TabsTrigger>
              <TabsTrigger 
                value="files" 
                className="rounded-none flex-1 min-w-[6rem] data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs sm:text-sm"
              >
                3. Files
              </TabsTrigger>
              <TabsTrigger 
                value="pricing" 
                className="rounded-none flex-1 min-w-[6rem] data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs sm:text-sm"
              >
                4. Pricing
              </TabsTrigger>
              <TabsTrigger 
                value="royalties" 
                className="rounded-none flex-1 min-w-[6rem] data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs sm:text-sm"
              >
                5. Royalties
              </TabsTrigger>
            </TabsList>

            <CardContent className="p-4 sm:p-6">
              <TabsContent value="details" className="mt-0 animate-fade-in">
                <DetailTab 
                  beatDetails={beatDetails}
                  handleBeatChange={handleBeatChange}
                  setBeatDetails={setBeatDetails}
                  tags={tags}
                  tagInput={tagInput}
                  setTagInput={setTagInput}
                  handleAddTag={handleAddTag}
                  handleRemoveTag={handleRemoveTag}
                />
              </TabsContent>

              <TabsContent value="licensing" className="mt-0 animate-fade-in">
                <LicensingTab 
                  beatDetails={beatDetails}
                  handleBeatChange={handleBeatChange}
                  licenseOptions={licenseOptions}
                  handleLicenseTypeChange={handleLicenseTypeChange}
                  selectedLicenseTypes={selectedLicenseTypes}
                />
              </TabsContent>

              <TabsContent value="files" className="mt-0 animate-fade-in">
                <FilesTab 
                  imagePreview={imagePreview}
                  handleImageUpload={handleImageUpload}
                  uploadedFile={uploadedFile}
                  setUploadedFile={setUploadedFile}
                  handleFullTrackUpload={handleFullTrackUpload}
                  previewFile={previewFile}
                  setPreviewFile={setPreviewFile}
                  isPlaying={isPlaying}
                  setIsPlaying={setIsPlaying}
                  selectedLicenseTypes={selectedLicenseTypes}
                  stems={stems}
                  setStems={setStems}
                  processingFiles={processingFiles}
                  uploadProgress={uploadProgress}
                  regeneratePreview={regeneratePreview}
                  previewUrl={previewUrl}
                />
              </TabsContent>

              <TabsContent value="pricing" className="mt-0 animate-fade-in">
                <PricingTab 
                  beatDetails={beatDetails}
                  setBeatDetails={setBeatDetails}
                  selectedLicenseTypes={selectedLicenseTypes}
                />
              </TabsContent>

              <TabsContent value="royalties" className="mt-0 animate-fade-in">
                <RoyaltiesTab 
                  collaborators={collaborators}
                  handleRemoveCollaborator={handleRemoveCollaborator}
                  handleCollaboratorChange={handleCollaboratorChange}
                  handleAddCollaborator={handleAddCollaborator}
                />
              </TabsContent>
            </CardContent>
            
            <CardFooter className="flex justify-between p-4 sm:p-6 border-t">
              <div className="flex gap-2">
                {activeTab !== "details" && (
                  <Button variant="outline" onClick={prevTab}>
                    Previous
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {activeTab !== "royalties" ? (
                  <Button onClick={nextTab}>
                    Next
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSaveDraft} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save as Draft'
                      )}
                    </Button>
                    <Button onClick={handlePublish} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        'Publish Beat'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardFooter>
          </Tabs>
        </Card>
      </div>
    </MainLayout>
  );
}
