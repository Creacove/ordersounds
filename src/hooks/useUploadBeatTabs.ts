
import { useState } from "react";

export function useUploadBeatTabs(tabKeys: string[], validateTab: () => boolean) {
  const [activeTab, setActiveTab] = useState(tabKeys[0]);

  const nextTab = () => {
    const currentIndex = tabKeys.indexOf(activeTab);
    if (currentIndex < tabKeys.length - 1) {
      if (validateTab()) {
        setActiveTab(tabKeys[currentIndex + 1]);
      }
    }
  };

  const prevTab = () => {
    const currentIndex = tabKeys.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabKeys[currentIndex - 1]);
    }
  };

  return { activeTab, setActiveTab, nextTab, prevTab };
}
