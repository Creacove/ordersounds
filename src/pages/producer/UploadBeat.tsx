
import { useState } from "react";
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
    selectedLicenseTypes,
    validateForm, handleLicenseTypeChange,
    handleCollaboratorChange, handleRemoveCollaborator, handleAddCollaborator,
    handleRemoveTag, handleAddTag,
    handleBeatChange, handleImageUpload, handlePreviewUpload, handleFullTrackUpload,
    licenseOptions
  } = useBeatUpload();
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const nextTab = () => {
    if (activeTab === "details") setActiveTab("files");
    else if (activeTab === "files") setActiveTab("licensing");
    else if (activeTab === "licensing") setActiveTab("pricing");
    else if (activeTab === "pricing") setActiveTab("royalties");
  };

  const prevTab = () => {
    if (activeTab === "royalties") setActiveTab("pricing");
    else if (activeTab === "pricing") setActiveTab("licensing");
    else if (activeTab === "licensing") setActiveTab("files");
    else if (activeTab === "files") setActiveTab("details");
  };

  const handlePublish = async () => {
    if (!validateForm()) return;
    if (!user) {
      toast.error("You must be logged in to publish a beat");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Set a primary license type if multiple are selected
      const primaryLicenseType = selectedLicenseTypes[0] || "basic";
      
      const beatData = {
        title: beatDetails.title,
        description: beatDetails.description || "",
        genre: beatDetails.genre,
        track_type: beatDetails.trackType,
        bpm: beatDetails.bpm,
        key: beatDetails.key,
        tags: tags,
        price_local: beatDetails.priceLocal,
        price_diaspora: beatDetails.priceDiaspora,
        basic_license_price_local: selectedLicenseTypes.includes('basic') ? beatDetails.basicLicensePriceLocal : 0,
        basic_license_price_diaspora: selectedLicenseTypes.includes('basic') ? beatDetails.basicLicensePriceDiaspora : 0,
        premium_license_price_local: selectedLicenseTypes.includes('premium') ? beatDetails.premiumLicensePriceLocal : 0,
        premium_license_price_diaspora: selectedLicenseTypes.includes('premium') ? beatDetails.premiumLicensePriceDiaspora : 0,
        exclusive_license_price_local: selectedLicenseTypes.includes('exclusive') ? beatDetails.exclusiveLicensePriceLocal : 0,
        exclusive_license_price_diaspora: selectedLicenseTypes.includes('exclusive') ? beatDetails.exclusiveLicensePriceDiaspora : 0,
        status: "published" as const,
        license_type: selectedLicenseTypes.join(','),
        license_terms: beatDetails.licenseTerms
      };
      
      if (!uploadedFile || !previewFile || !imageFile) {
        throw new Error("Missing required files");
      }

      // Make sure the first collaborator is the uploader
      if (collaborators[0].id === 1) {
        collaborators[0].name = user.name;
        collaborators[0].email = user.email || '';
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
      // Set a primary license type if multiple are selected
      const primaryLicenseType = selectedLicenseTypes[0] || "basic";
      
      const beatData = {
        title: beatDetails.title,
        description: beatDetails.description || "",
        genre: beatDetails.genre,
        track_type: beatDetails.trackType,
        bpm: beatDetails.bpm,
        key: beatDetails.key,
        tags: tags,
        price_local: beatDetails.priceLocal,
        price_diaspora: beatDetails.priceDiaspora,
        basic_license_price_local: selectedLicenseTypes.includes('basic') ? beatDetails.basicLicensePriceLocal : 0,
        basic_license_price_diaspora: selectedLicenseTypes.includes('basic') ? beatDetails.basicLicensePriceDiaspora : 0,
        premium_license_price_local: selectedLicenseTypes.includes('premium') ? beatDetails.premiumLicensePriceLocal : 0,
        premium_license_price_diaspora: selectedLicenseTypes.includes('premium') ? beatDetails.premiumLicensePriceDiaspora : 0,
        exclusive_license_price_local: selectedLicenseTypes.includes('exclusive') ? beatDetails.exclusiveLicensePriceLocal : 0,
        exclusive_license_price_diaspora: selectedLicenseTypes.includes('exclusive') ? beatDetails.exclusiveLicensePriceDiaspora : 0,
        status: "draft" as const,
        license_type: selectedLicenseTypes.join(','),
        license_terms: beatDetails.licenseTerms
      };
      
      if (!uploadedFile || !previewFile || !imageFile) {
        throw new Error("Missing required files");
      }

      // Make sure the first collaborator is the uploader
      if (collaborators[0].id === 1) {
        collaborators[0].name = user.name;
        collaborators[0].email = user.email || '';
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
                value="files" 
                className="rounded-none flex-1 min-w-[6rem] data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs sm:text-sm"
              >
                2. Files
              </TabsTrigger>
              <TabsTrigger 
                value="licensing" 
                className="rounded-none flex-1 min-w-[6rem] data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs sm:text-sm"
              >
                3. Licensing
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
