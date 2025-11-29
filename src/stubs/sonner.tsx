import React from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

export type ToastVariant = "default" | "success" | "error" | "warning";

export type ToastOptions = {
  description?: React.ReactNode;
  duration?: number;
  variant?: ToastVariant;
  icon?: React.ReactNode;
};

export type ToastPayload = {
  id: number;
  title: React.ReactNode | null;
  description?: React.ReactNode | null;
  duration: number;
  variant: ToastVariant;
  icon: React.ReactNode | null;
};

type ToastListener = (toast: ToastPayload, action: "add" | "remove") => void;

const listeners = new Set<ToastListener>();
let counter = 0;

const DEFAULT_DURATION = 4000;

function notify(toast: ToastPayload) {
  listeners.forEach((listener) => listener(toast, "add"));
  if (toast.duration > 0 && toast.duration !== Infinity) {
    window.setTimeout(() => dismiss(toast.id), toast.duration);
  }
}

function dismiss(id: number) {
  listeners.forEach((listener) => listener({
    id,
    title: null,
    description: null,
    duration: 0,
    variant: "default",
    icon: null,
  }, "remove"));
}

type ToastInvoker = {
  (title: React.ReactNode, options?: ToastOptions): number;
  success: (title: React.ReactNode, options?: ToastOptions) => number;
  error: (title: React.ReactNode, options?: ToastOptions) => number;
  warning: (title: React.ReactNode, options?: ToastOptions) => number;
  dismiss: (id: number) => void;
};

const baseToast = ((title: React.ReactNode, options?: ToastOptions) => {
  const payload: ToastPayload = {
    id: ++counter,
    title,
    description: options?.description,
    duration: options?.duration ?? DEFAULT_DURATION,
    variant: options?.variant ?? "default",
    icon: options?.icon ?? null,
  };
  notify(payload);
  return payload.id;
}) as ToastInvoker;

baseToast.success = (title, options) =>
  baseToast(title, { ...options, variant: "success" });

baseToast.error = (title, options) =>
  baseToast(title, { ...options, variant: "error" });

baseToast.warning = (title, options) =>
  baseToast(title, { ...options, variant: "warning" });

baseToast.dismiss = (id: number) => dismiss(id);

export const toast = baseToast;

const positionClassNames: Record<
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left"
  | "top-center"
  | "bottom-center",
  string
> = {
  "top-right": "top-4 right-4 items-end",
  "top-left": "top-4 left-4 items-start",
  "bottom-right": "bottom-4 right-4 items-end",
  "bottom-left": "bottom-4 left-4 items-start",
  "top-center": "top-4 left-1/2 -translate-x-1/2 items-center",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 items-center",
};

export type ToasterProps = {
  position?: keyof typeof positionClassNames;
  richColors?: boolean;
  closeButton?: boolean;
  toastOptions?: (Partial<ToastOptions> & { className?: string }) | undefined;
};

export function Toaster({ position = "top-right", toastOptions }: ToasterProps) {
  const [toasts, setToasts] = React.useState<ToastPayload[]>([]);

  React.useEffect(() => {
    const listener: ToastListener = (toast, action) => {
      setToasts((current) => {
        if (action === "remove") {
          return current.filter((item) => item.id !== toast.id);
        }
        return [...current, toast];
      });
    };

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return createPortal(
    <div
      className={cn(
        "pointer-events-none fixed z-[100] flex max-w-[420px] flex-col gap-3",
        positionClassNames[position],
      )}
    >
      {toasts.map((toastItem) => (
        <div
          key={toastItem.id}
          className={cn(
            "pointer-events-auto flex w-full items-start gap-3 rounded-lg border bg-background/90 p-4 shadow-lg backdrop-blur",
            "dark:bg-background/80",
            toastItem.variant === "success" &&
              "border-green-200 bg-green-50 text-green-950 dark:border-green-900/40 dark:bg-green-950/40 dark:text-green-50",
            toastItem.variant === "error" &&
              "border-destructive/40 bg-destructive/10 text-destructive",
            toastItem.variant === "warning" &&
              "border-yellow-200 bg-yellow-50 text-yellow-950 dark:border-yellow-900/40 dark:bg-yellow-950/40 dark:text-yellow-50",
            toastOptions?.className,
          )}
        >
          {toastItem.icon && (
            <div className="mt-0.5 text-foreground">{toastItem.icon}</div>
          )}
          <div className="flex-1 space-y-1">
            {toastItem.title && (
              <div className="text-sm font-semibold leading-none">
                {toastItem.title}
              </div>
            )}
            {toastItem.description && (
              <p className="text-sm text-muted-foreground">
                {toastItem.description}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Dismiss notification"
            className="text-muted-foreground transition hover:text-foreground"
            onClick={() => dismiss(toastItem.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}
