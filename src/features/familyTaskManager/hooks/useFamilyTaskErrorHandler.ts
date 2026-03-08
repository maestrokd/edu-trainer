import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { extractErrorCode } from "@/services/ApiService";
import { notifier } from "@/services/NotificationService";

interface FamilyTaskErrorOptions {
  fallbackKey: string;
  fallbackMessage: string;
}

interface HandleFamilyTaskErrorOptions extends FamilyTaskErrorOptions {
  notify?: boolean;
  setError?: (message: string | null) => void;
}

export function useFamilyTaskErrorHandler() {
  const { t } = useTranslation();

  const getErrorMessage = useCallback(
    (error: unknown, { fallbackKey, fallbackMessage }: FamilyTaskErrorOptions) => {
      const errorCode = extractErrorCode(error);
      const messageKey = errorCode ? `errors.codes.${errorCode}` : fallbackKey;
      const defaultMessage = t(fallbackKey, fallbackMessage);
      return t(messageKey, { defaultValue: defaultMessage });
    },
    [t]
  );

  const handleError = useCallback(
    (error: unknown, { notify = true, setError, ...options }: HandleFamilyTaskErrorOptions) => {
      const message = getErrorMessage(error, options);
      setError?.(message);

      if (notify) {
        notifier.error(message);
      }

      return message;
    },
    [getErrorMessage]
  );

  return { getErrorMessage, handleError };
}
