
import { BeatDetails, Collaborator } from "@/hooks/useBeatUpload";
import { isFile } from "@/lib/storage";

type ValidationProps = {
  activeTab: string;
  beatDetails: BeatDetails;
  selectedLicenseTypes: string[];
  imageFile: any;
  uploadedFile: any;
  uploadedFileUrl: string;
  previewFile: any;
  previewUrl: string | null;
  stems: any;
  collaborators: Collaborator[];
  setValidationErrors: (errs: { [key: string]: string }) => void;
  toast: any;
};

export function validateCurrentTab({
  activeTab,
  beatDetails,
  selectedLicenseTypes,
  imageFile,
  uploadedFile,
  uploadedFileUrl,
  previewFile,
  previewUrl,
  stems,
  collaborators,
  setValidationErrors,
  toast
}: ValidationProps) {
  const newErrors: { [key: string]: string } = {};

  if (activeTab === "details") {
    if (!beatDetails.title) newErrors.title = "Beat title is required";
    if (!beatDetails.genre) newErrors.genre = "Genre is required";
    if (!beatDetails.trackType) newErrors.trackType = "Track type is required";
  } else if (activeTab === "licensing") {
    if (!selectedLicenseTypes.length) newErrors.licenseType = "At least one license type is required";
    if (selectedLicenseTypes.includes("custom") && !beatDetails.licenseTerms)
      newErrors.licenseTerms = "Custom license terms are required";
  } else if (activeTab === "files") {
    if (!imageFile) newErrors.coverImage = "Cover image is required";
    if (!uploadedFile && !uploadedFileUrl) newErrors.fullTrack = "Full track is required";

    const requiresWavFormat =
      selectedLicenseTypes.includes("premium") || selectedLicenseTypes.includes("exclusive");

    if (requiresWavFormat && uploadedFile && isFile(uploadedFile)) {
      const fileType = uploadedFile.type;
      const fileName = uploadedFile.name;
      if (fileType !== "audio/wav" && !fileName.endsWith(".wav"))
        newErrors.fullTrack = "Premium and exclusive licenses require WAV format";
    }
  } else if (activeTab === "pricing") {
    selectedLicenseTypes.forEach((license) => {
      if (license === "basic" && (!beatDetails.basicLicensePriceLocal || !beatDetails.basicLicensePriceDiaspora))
        newErrors.basicPrice = "Basic license prices are required";
      if (license === "premium" && (!beatDetails.premiumLicensePriceLocal || !beatDetails.premiumLicensePriceDiaspora))
        newErrors.premiumPrice = "Premium license prices are required";
      if (
        license === "exclusive" &&
        (!beatDetails.exclusiveLicensePriceLocal || !beatDetails.exclusiveLicensePriceDiaspora)
      )
        newErrors.exclusivePrice = "Exclusive license prices are required";
      if (
        license === "custom" &&
        (!beatDetails.customLicensePriceLocal || !beatDetails.customLicensePriceDiaspora)
      )
        newErrors.customPrice = "Custom license prices are required";
    });
  } else if (activeTab === "royalties") {
    const totalPercentage = collaborators.reduce((sum, c) => sum + c.percentage, 0);
    if (totalPercentage !== 100) newErrors.royalties = "Collaborator percentages must sum to 100%";
    collaborators.forEach((c, idx) => {
      if (!c.name) newErrors[`collaborator_${idx}_name`] = "Name is required";
      if (!c.role) newErrors[`collaborator_${idx}_role`] = "Role is required";
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
}
