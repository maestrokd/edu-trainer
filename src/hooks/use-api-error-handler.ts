import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { extractErrorCode } from "@/services/ApiService.ts";
import { notifier } from "@/services/NotificationService.ts";

interface ApiErrorMessageOptions {
  fallbackKey: string;
  fallbackMessage?: string;
}

interface HandleApiErrorOptions extends ApiErrorMessageOptions {
  notify?: boolean;
  setError?: (message: string | null) => void;
}

const UNKNOWN_ERROR_KEY = "errors.codes.UNKNOWN";
const missingErrorCodeTranslationSignals = new Set<string>();

function emitMissingErrorCodeTranslationSignal(errorCodeKey: string, fallbackKey: string, language: string) {
  const signalId = `${language}:${errorCodeKey}`;
  if (missingErrorCodeTranslationSignals.has(signalId)) {
    return;
  }

  missingErrorCodeTranslationSignals.add(signalId);
  console.warn(
    `[i18n] Missing error-code translation key "${errorCodeKey}" for language "${language}". Falling back to "${fallbackKey}".`
  );
}

export function useApiErrorHandler() {
  const { t, i18n } = useTranslation();

  const getErrorMessage = useCallback(
    (error: unknown, { fallbackKey, fallbackMessage }: ApiErrorMessageOptions) => {
      const errorCode = extractErrorCode(error);
      const errorCodeKey = errorCode ? `errors.codes.${errorCode}` : null;
      const hasErrorCodeTranslation = Boolean(errorCodeKey && i18n.exists(errorCodeKey));

      if (errorCodeKey && !hasErrorCodeTranslation) {
        emitMissingErrorCodeTranslationSignal(errorCodeKey, fallbackKey, i18n.resolvedLanguage ?? i18n.language);
      }

      const messageKey = hasErrorCodeTranslation && errorCodeKey ? errorCodeKey : fallbackKey;
      const defaultMessage = t(fallbackKey, {
        defaultValue: fallbackMessage ?? t(UNKNOWN_ERROR_KEY),
      });
      return t(messageKey, { defaultValue: defaultMessage });
    },
    [i18n, t]
  );

  const handleError = useCallback(
    (error: unknown, { notify = true, setError, ...options }: HandleApiErrorOptions) => {
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
