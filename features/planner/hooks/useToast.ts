import { useEffect, useRef, useState } from "react";
import { Toast, ToastType } from "../utils/types";

export const useToast = () => {
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (
    message: string,
    type: ToastType = "info"
  ) => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, []);

  return {
    toast,
    showToast,
  };
};
