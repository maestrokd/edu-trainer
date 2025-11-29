import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        className:
          "bg-background text-foreground border border-border shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/70",
      }}
    />
  );
}

export { toast } from "sonner";
