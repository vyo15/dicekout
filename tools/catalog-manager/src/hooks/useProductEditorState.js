import { useState } from "react";
import { blankProduct, today } from "../catalogManagerUtils.js";

export const useProductEditorState = () => {
  const [product, setProduct] = useState(blankProduct());
  const [mode, setMode] = useState("new");
  const [activeTab, setActiveTab] = useState("general");
  const [tempMedia, setTempMedia] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewMode, setPreviewMode] = useState("mobile");
  const [previewTheme, setPreviewTheme] = useState("light");
  const [issues, setIssues] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const update = (key, value) => {
    setProduct((current) => ({ ...current, [key]: value, updatedAt: today() }));
    setDirty(true);
    setIssues(null);
  };

  const updateVisual = (key, value) => {
    setProduct((current) => ({ ...current, visual: { ...current.visual, [key]: value }, updatedAt: today() }));
    setDirty(true);
    setIssues(null);
  };

  const resetEditor = () => {
    setTempMedia(null);
    setPreviewUrl("");
    setIssues(null);
    setImageFailed(false);
    setActiveTab("general");
    setPreviewMode("mobile");
    setPreviewTheme("light");
  };

  return {
    product,
    setProduct,
    mode,
    setMode,
    activeTab,
    setActiveTab,
    tempMedia,
    setTempMedia,
    previewUrl,
    setPreviewUrl,
    previewMode,
    setPreviewMode,
    previewTheme,
    setPreviewTheme,
    issues,
    setIssues,
    dirty,
    setDirty,
    imageFailed,
    setImageFailed,
    update,
    updateVisual,
    resetEditor,
  };
};
