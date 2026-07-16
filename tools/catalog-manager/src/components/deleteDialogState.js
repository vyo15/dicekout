export const mergeDeleteImpact = (current, requestId, productId, impact) => (
  current?.requestId === requestId && current.item.id === productId
    ? { ...current, impact, loading: false }
    : current
);

export const canConfirmProductDelete = (dialog) => Boolean(
  dialog?.kind === "source"
  && dialog.impact
  && dialog.typedName === dialog.impact.product.name
  && dialog.confirmed,
);
