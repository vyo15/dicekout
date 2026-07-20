import { useCallback, useRef, useState } from "react";
import { mergeDeleteImpact } from "../components/deleteDialogState.js";

export const useDeleteProductFlow = ({
  api,
  load,
  setNotice,
  beginOperation,
  endOperation,
  operationActive,
}) => {
  const [deleteDialog, setDeleteDialog] = useState(null);
  const deleteRequestRef = useRef(0);

  const closeDeleteDialog = useCallback(() => {
    deleteRequestRef.current += 1;
    setDeleteDialog(null);
  }, []);

  const openDelete = useCallback(async (item, isDraft) => {
    if (operationActive()) return;
    const requestId = deleteRequestRef.current + 1;
    deleteRequestRef.current = requestId;
    if (isDraft) {
      setDeleteDialog({ kind: "draft", item, typedName: "", confirmed: false, impact: null, loading: false, requestId });
      return;
    }
    setDeleteDialog({ kind: "source", item, typedName: "", confirmed: false, impact: null, loading: true, requestId });
    try {
      const impact = await api("/api/products/delete-impact", { method: "POST", body: { productId: item.id } });
      setDeleteDialog((current) => mergeDeleteImpact(current, requestId, item.id, impact));
    } catch (error) {
      if (deleteRequestRef.current !== requestId) return;
      setNotice(error.message);
      closeDeleteDialog();
    }
  }, [api, closeDeleteDialog, operationActive, setNotice]);

  const confirmDelete = useCallback(async () => {
    if (!deleteDialog || !beginOperation()) return;
    const target = deleteDialog;
    try {
      if (target.kind === "draft") {
        await api("/api/drafts/delete", { method: "POST", body: { draftKey: target.item._draft?.key || target.item.id || target.item.slug } });
        setNotice(`Draft “${target.item.name}” berhasil dihapus.`);
      } else {
        const result = await api("/api/products/delete", {
          method: "POST",
          body: {
            productId: target.impact.product.id,
            fingerprint: target.impact.fingerprint,
            confirmationName: target.typedName,
            confirmed: target.confirmed,
          },
        });
        const detail = result.deleted;
        setNotice(`Produk berhasil dihapus. ${detail.collections} relasi koleksi, ${detail.drafts} draft, dan ${detail.sourceMedia} gambar source dibersihkan. Backup lokal tersedia di Riwayat backup.`);
      }
      closeDeleteDialog();
      await load();
    } catch (error) {
      setNotice(error.message);
    } finally {
      endOperation();
    }
  }, [api, beginOperation, closeDeleteDialog, deleteDialog, endOperation, load, setNotice]);

  return {
    deleteDialog,
    setDeleteDialog,
    openDelete,
    closeDeleteDialog,
    confirmDelete,
  };
};
