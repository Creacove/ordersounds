import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { uploadBeat } from "@/lib/beatStorage";
import { FileOrUrl, isFile } from "@/lib/storage";
import { DetailTab } from "@/components/upload/DetailTab";
import { FilesTab } from "@/components/upload/FilesTab";
import { LicensingTab } from "@/components/upload/LicensingTab";
import { PricingTab } from "@/components/upload/PricingTab";
import { RoyaltiesTab } from "@/components/upload/RoyaltiesTab";
import { useBeatUpload } from "@/hooks/useBeatUpload";
import { ScrollToTop } from "@/components/utils/ScrollToTop";
import { uploadImage } from "@/lib/imageStorage";
import { supabase } from "@/integrations/supabase/client";
import { isBeatPublished } from "@/services/beats";

export default function UploadBeat() {
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
    selectedLicenseTypes, setSelectedLicenseTypes, stems, setStems,
    processingFiles,
    previewUrl, setPreviewUrl,
    validateForm, handleLicenseTypeChange,
    handleCollaboratorChange, handleRemoveCollaborator, handleAddCollaborator,
    handleRemoveTag, handleAddTag,
    handleBeatChange, handleImageUpload, handlePreviewUpload, handleFullTrackUpload,
    handleStemsUpload, regeneratePreview, licenseOptions, uploadedFileUrl,
    uploadProgress,
    uploadError
  } = useBeatUpload();
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [beatId, setBeatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const editBeatId = queryParams.get('edit');
    
    if (editBeatId) {
      setBeatId(editBeatId);
      setIsEditMode(true);
      loadBeatDetails(editBeatId);
    }
  }, [location]);

  const loadBeatDetails = async (id: string) => {
    try {
      setIsLoading(true);
      
      const { data: beatData, error } = await supabase
        .from('beats')
        .select(`
          id, title, description, genre, track_type, bpm, key,
          producer_id, audio_file, audio_preview, cover_image, 
          tags, status, license_type, license_terms, stems_url,
          basic_license_price_local, basic_license_price_diaspora,
          premium_license_price_local, premium_license_price_diaspora,
          exclusive_license_price_local, exclusive_license_price_diaspora,
          custom_license_price_local, custom_license_price_diaspora
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (!beatData) {
        toast.error("Beat not found");
        navigate('/producer/beats');
        return;
      }
      
      setBeatDetails({
        title: beatData.title || '',
        description: beatData.description || '',
        genre: beatData.genre || '',
        trackType: beatData.track_type || '',
        bpm: beatData.bpm || 0,
        key: beatData.key || '',
        priceLocal: 10000, // Default values
        priceDiaspora: 25,
        status: beatData.status as "draft" | "published" || 'draft',
        licenseType: beatData.license_type?.split(',')[0] || 'basic',
        licenseTerms: beatData.license_terms || '',
        basicLicensePriceLocal: beatData.basic_license_price_local || 0,
        basicLicensePriceDiaspora: beatData.basic_license_price_diaspora || 0,
        premiumLicensePriceLocal: beatData.premium_license_price_local || 0,
        premiumLicensePriceDiaspora: beatData.premium_license_price_diaspora || 0,
        exclusiveLicensePriceLocal: beatData.exclusive_license_price_local || 0,
        exclusiveLicensePriceDiaspora: beatData.exclusive_license_price_diaspora || 0,
        customLicensePriceLocal: beatData.custom_license_price_local || 0,
        customLicensePriceDiaspora: beatData.custom_license_price_diaspora || 0,
      });
      
      if (beatData.tags && Array.isArray(beatData.tags)) {
        setTags(beatData.tags);
      }
      
      if (beatData.license_type) {
        const licenseTypes = beatData.license_type.split(',');
        setSelectedLicenseTypes(licenseTypes);
      }
      
      if (beatData.audio_file) {
        setPreviewUrl(beatData.audio_preview || null);
        
        if (setUploadedFile) {
          setUploadedFile({ url: beatData.audio_file });
        }
      }
      
      if (beatData.cover_image) {
        setImagePreview(beatData.cover_image);
        setImageFile({ url: beatData.cover_image });
      }
      
      const { data: royaltyData, error: royaltyError } = await supabase
        .from('royalty_splits')
        .select('*')
        .eq('beat_id', id);
      
      if (!royaltyError && royaltyData) {
        const mappedCollaborators = royaltyData.map((royalty, index) => ({
          id: index + 1,
          name: royalty.party_name || '',
          role: royalty.party_role || '',
          email: royalty.party_email || '',
          percentage: royalty.percentage || 0
        }));
        
        if (mappedCollaborators.length > 0) {
          setCollaborators(mappedCollaborators);
        }
      }
      
      toast.success("Beat details loaded successfully");
    } catch (error) {
      console.error('Error loading beat details:', error);
      toast.error("Failed to load beat details");
    } finally {
      setIsLoading(false);
    }
  };

  const nextTab = () => {
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex < tabOrder.length - 1) {
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
      if (!uploadedFile && !uploadedFileUrl) {
        newErrors.fullTrack = "Full track is required";
      }
      
      const requiresWavFormat = selectedLicenseTypes.includes('premium') || 
                              selectedLicenseTypes.includes('exclusive');
      
      if (requiresWavFormat && uploadedFile && isFile(uploadedFile)) {
        const fileType = uploadedFile.type;
        const fileName = uploadedFile.name;
        
        if (fileType !== "audio/wav" && !fileName.endsWith('.wav')) {
          newErrors.fullTrack = "Premium and exclusive licenses require WAV format";
        }
      }
    } else if (activeTab === "pricing") {
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
      
      collaborators.forEach((c, index) => {
        if (!c.name) {
          newErrors[`collaborator_${index}_name`] = "Name is required";
        }
        if (!c.role) {
          newErrors[`collaborator_${index}_role`] = "Role is required";
        }
      });
    }
    
    if (Object.keys(newErrors).length > 0) {
      setValidationErrors(newErrors);
      
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError);
      
      return false;
    }
    
    setValidationErrors({});
    return true;
  };

  const handlePublish = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      console.log('Publishing beat with license types:', selectedLicenseTypes);
      
      if (!imageFile) {
        toast.error("Cover image is required");
        setActiveTab("files");
        return;
      }
      
      if (!uploadedFile && !uploadedFileUrl) {
        toast.error("Full track file is required");
        setActiveTab("files");
        return;
      }
      
      if (!previewFile && !previewUrl) {
        toast.error("Preview track is required");
        setActiveTab("files");
        return;
      }

      const producerInfo = {
        id: user?.id || 'anonymous-producer',
        name: user?.name || 'Anonymous Producer'
      };
      
      if (user && collaborators[0].id === 1) {
        collaborators[0].name = user.name || 'Producer';
        collaborators[0].email = user.email || '';
      }
      
      toast.loading(isEditMode ? "Updating your beat..." : "Publishing your beat...", { id: "publishing-beat" });
      
      let coverImageUrl = '';
      if (imageFile) {
        if (!isFile(imageFile) && 'url' in imageFile) {
          coverImageUrl = imageFile.url;
          console.log("Using directly provided image URL:", coverImageUrl);
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
        license_terms: beatDetails.licenseTerms || '',
        cover_image: coverImageUrl,
      };
      
      const fullTrackFileOrUrl: FileOrUrl = uploadedFile || { url: uploadedFileUrl };
      
      const stemsFile = stems && isFile(stems) ? stems : null;
      
      let finalPreviewFile: File | null = null;
      if (previewFile && isFile(previewFile)) {
        finalPreviewFile = previewFile;
      }
      
      const previewUrlForUpload = previewUrl || 
        (previewFile && !isFile(previewFile) && 'url' in previewFile ? previewFile.url : '');
      
      let result;
      
      if (isEditMode && beatId) {
        beatData.status = "published";
        
        const { data: updatedBeat, error: updateError } = await supabase
          .from('beats')
          .update(beatData)
          .eq('id', beatId)
          .select()
          .single();
          
        if (updateError) {
          throw new Error(updateError.message);
        }
        
        if (collaborators.length > 0) {
          await supabase
            .from('royalty_splits')
            .delete()
            .eq('beat_id', beatId);
          
          const collaboratorInserts = collaborators.map(c => ({
            beat_id: beatId,
            party_id: c.id.toString().includes('-') ? c.id.toString() : producerInfo.id,
            party_name: c.name || producerInfo.name,
            party_email: c.email || '',
            party_role: c.role || 'Producer',
            percentage: c.percentage
          }));
          
          const { error: collabError } = await supabase
            .from('royalty_splits')
            .insert(collaboratorInserts);
            
          if (collabError) {
            console.error('Error updating collaborators:', collabError);
          }
        }
        
        result = { success: true, beatId };
      } else {
        result = await uploadBeat(
          beatData,
          fullTrackFileOrUrl,
          finalPreviewFile,
          null,
          stemsFile,
          producerInfo.id,
          producerInfo.name,
          collaborators,
          selectedLicenseTypes,
          previewUrlForUpload
        );
      }
      
      if (result.success) {
        toast.success(isEditMode ? "Beat updated successfully!" : "Beat published successfully!", { id: "publishing-beat" });
        navigate("/producer/beats");
      } else {
        throw new Error(result.error || "Failed to upload beat");
      }
    } catch (error) {
      console.error("Error publishing beat:", error);
      toast.error(error instanceof Error ? error.message : "Error publishing beat", { id: "publishing-beat" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      if (!imageFile) {
        toast.error("Cover image is required");
        setActiveTab("files");
        return;
      }
      
      const producerInfo = {
        id: user?.id || 'anonymous-producer',
        name: user?.name || 'Anonymous Producer'
      };
      
      let coverImageUrl = '';
      if (imageFile) {
        if (!isFile(imageFile) && 'url' in imageFile) {
          coverImageUrl = imageFile.url;
          console.log("Using directly provided image URL for draft:", coverImageUrl);
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
        license_terms: beatDetails.licenseTerms || '',
        cover_image: coverImageUrl,
      };
      
      const fullTrackFileOrUrl: FileOrUrl = uploadedFile || { url: uploadedFileUrl };
      
      const stemsFile = stems && isFile(stems) ? stems : null;
      
      let finalPreviewFile: File | null = null;
      if (previewFile && isFile(previewFile)) {
        finalPreviewFile = previewFile;
      }
      
      const previewUrlForUpload = previewUrl || 
        (previewFile && !isFile(previewFile) && 'url' in previewFile ? previewFile.url : '');
      
      let result;
      
      if (isEditMode && beatId) {
        beatData.status = "draft";
        
        const { data: updatedBeat, error: updateError } = await supabase
          .from('beats')
          .update(beatData)
          .eq('id', beatId)
          .select()
          .single();
          
        if (updateError) {
          throw new Error(updateError.message);
        }
        
        if (collaborators.length > 0) {
          await supabase
            .from('royalty_splits')
            .delete()
            .eq('beat_id', beatId);
          
          const collaboratorInserts = collaborators.map(c => ({
            beat_id: beatId,
            party_id: c.id.toString().includes('-') ? c.id.toString() : producerInfo.id,
            party_name: c.name || producerInfo.name,
            party_email: c.email || '',
            party_role: c.role || 'Producer',
            percentage: c.percentage
          }));
          
          const { error: collabError } = await supabase
            .from('royalty_splits')
            .insert(collaboratorInserts);
            
          if (collabError) {
            console.error('Error updating collaborators:', collabError);
          }
        }
        
        result = { success: true, beatId };
      } else {
        result = await uploadBeat(
          beatData,
          fullTrackFileOrUrl,
          finalPreviewFile,
          null,
          stemsFile,
          producerInfo.id,
          producerInfo.name,
          collaborators,
          selectedLicenseTypes,
          previewUrlForUpload
        );
      }
      
      if (result.success) {
        toast.success(isEditMode ? "Beat draft updated" : "Beat saved as draft");
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
      <ScrollToTop />
      <div className="container py-4 sm:py-8 max-w-full sm:max-w-4xl px-2 sm:px-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-card p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl">{isEditMode ? 'Edit Beat' : 'Upload a New Beat'}</CardTitle>
            <CardDescription className="text-sm">
              {isEditMode 
                ? 'Update your beat details and settings' 
                : 'Fill in the details below to upload your beat to the marketplace'}
            </CardDescription>
          </CardHeader>

          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading beat details...</span>
            </div>
          ) : (
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
                    setPreviewUrl={setPreviewUrl}
                    handlePreviewUpload={handlePreviewUpload}
                    handleStemsUpload={handleStemsUpload}
                    uploadError={uploadError}
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
              
              <CardFooter className="flex flex-wrap flex-col-reverse sm:flex-row sm:items-center justify-between p-4 sm:p-6 border-t gap-2 sm:gap-4">
                <div className="flex gap-2 items-center">
                  {activeTab !== "details" && (
                    <Button variant="outline" onClick={prevTab}>
                      Previous
                    </Button>
                  )}
                </div>
                <div className="flex gap-2 items-center ml-auto">
                  {activeTab !== "royalties" ? (
                    <Button onClick={nextTab}>
                      Next
                    </Button>
                  ) : (
                    <>
                      {!isEditMode && (
                        <>
                          <Button
                            variant="outline"
                            type="button"
                            disabled={isSubmitting}
                            onClick={handleSaveDraft}
                          >
                            Save as Draft
                          </Button>
                          <Button
                            type="button"
                            className="bg-primary text-white"
                            disabled={isSubmitting}
                            onClick={handlePublish}
                          >
                            Publish
                          </Button>
                        </>
                      )}

                      {isEditMode && beatDetails.status === "draft" && (
                        <>
                          <Button
                            variant="outline"
                            type="button"
                            disabled={isSubmitting}
                            onClick={handleSaveDraft}
                          >
                            Update as Draft
                          </Button>
                          <Button
                            type="button"
                            className="bg-primary text-white"
                            disabled={isSubmitting}
                            onClick={handlePublish}
                          >
                            Publish
                          </Button>
                        </>
                      )}

                      {isEditMode && beatDetails.status === "published" && (
                        <Button
                          variant="outline"
                          type="button"
                          className="ml-auto"
                          disabled={isSubmitting}
                          onClick={handlePublish}
                        >
                          Update Beat
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardFooter>
            </Tabs>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
