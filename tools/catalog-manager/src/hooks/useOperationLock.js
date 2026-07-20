import { useCallback, useRef, useState } from "react";

export const useOperationLock = () => {
  const activeRef = useRef(false);
  const [busy, setBusy] = useState(false);

  const beginOperation = useCallback(() => {
    if (activeRef.current) return false;
    activeRef.current = true;
    setBusy(true);
    return true;
  }, []);

  const endOperation = useCallback(() => {
    activeRef.current = false;
    setBusy(false);
  }, []);

  const operationActive = useCallback(() => activeRef.current, []);

  return { busy, beginOperation, endOperation, operationActive };
};
