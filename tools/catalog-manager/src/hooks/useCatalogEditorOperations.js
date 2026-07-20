import { useState } from "react";
import { today } from "../catalogManagerUtils.js";

export const useCatalogEditorOperations = ({
  api,
  product,
  tempMedia,
  setProduct,
  setTempMedia,
  setPreviewUrl,
  setImageFailed,
  setDirty,
  setIssues,
  setMode,
  setNotice,
  beginOperation,
  endOperation,
  load,
}) => {
  const [rollbackTarget, setRollbackTarget] = useState(null);

  const upload = async (file) => {
    if (!file || !beginOperation()) return;
    try {
      const result = await api("/api/media", {
        method: "POST",
        body: file,
        raw: true,
        headers: {
          "content-type": file.type || "application/octet-stream",
          "x-original-name": encodeURIComponent(file.name || ""),
          "x-product-name": encodeURIComponent(product.name || ""),
          "x-product-slug": encodeURIComponent(product.slug || ""),
          "x-replace-temp": tempMedia?.tempName || "",
        },
      });
      setPreviewUrl(`/temp-media/${result.tempName}`);
      setTempMedia(result);
      setImageFailed(false);
      setProduct((current) => ({
        ...current,
        image: result.path,
        imageWidth: result.optimized?.width || 0,
        imageHeight: result.optimized?.height || 0,
        imageAlt: current.imageAlt || current.name,
        updatedAt: today(),
      }));
      setDirty(true);
      setIssues(null);
      setNotice("Gambar berhasil dikonversi otomatis ke WebP dan siap dipreview.");
    } catch (error) {
      setNotice(`${error.message} Data produk lain tetap dipertahankan.`);
    } finally {
      endOperation();
    }
  };

  const validate = async () => {
    if (!beginOperation()) return null;
    try {
      const result = await api("/api/validate", { method: "POST", body: { product } });
      setIssues(result);
      setNotice(result.errors.length ? "Masih ada data wajib yang perlu diperbaiki." : "Validasi data berhasil.");
      return result;
    } catch (error) {
      setNotice(error.message);
      return null;
    } finally {
      endOperation();
    }
  };

  const saveDraft = async () => {
    if (!beginOperation()) return;
    try {
      await api("/api/drafts", { method: "POST", body: { product, tempMedia } });
      setNotice("Draft lokal tersimpan beserta referensi gambar temporary dan tidak masuk Git.");
      setDirty(false);
      setMode("draft");
      await load();
    } catch (error) {
      setNotice(error.message);
    } finally {
      endOperation();
    }
  };

  const apply = async () => {
    if (!window.confirm("Terapkan produk ke source? Backup dibuat otomatis. Commit dan push tetap dilakukan manual.")) return;
    if (!beginOperation()) return;
    try {
      const result = await api("/api/apply", { method: "POST", body: { product, tempMedia } });
      setIssues(result);
      if (result.errors.length) {
        setNotice("Penerapan dibatalkan karena validasi gagal.");
      } else {
        setNotice("Produk diterapkan dan backup lokal dibuat. Jalankan npm run check lalu review git diff.");
        setTempMedia(null);
        setPreviewUrl("");
        setDirty(false);
        setMode("source");
        await load();
      }
    } catch (error) {
      setNotice(error.message);
    } finally {
      endOperation();
    }
  };

  const rollback = async () => {
    if (!rollbackTarget || !beginOperation()) return;
    try {
      await api("/api/rollback", { method: "POST", body: { backupId: rollbackTarget.id } });
      setNotice("Backup berhasil dipulihkan. Kondisi sebelum rollback juga disimpan sebagai titik pemulihan baru.");
      setRollbackTarget(null);
      await load();
    } catch (error) {
      setNotice(error.message);
    } finally {
      endOperation();
    }
  };

  return {
    upload,
    validate,
    saveDraft,
    apply,
    rollbackTarget,
    setRollbackTarget,
    rollback,
  };
};
