import React, { useEffect } from "react";
import WebApp from "@twa-dev/sdk";
import { cn } from "@/lib/utils";

type HeaderContextType = {
  setHeader: (node: React.ReactNode | null) => void;
  setHeaderVisible: (visible: boolean) => void;
};

type TelegramHeaderProviderProps = {
  children: React.ReactNode;
  containerClassName?: string;
  contentWrapperClassName?: string;
  headerHeight?: number;
};

const HeaderContext = React.createContext<HeaderContextType | undefined>(
  undefined,
);

/**
 * Hook for child pages to set custom header content and control visibility of the common header.
 *
 * Example usage inside a page component:
 *   useCustomHeader(<MyHeaderContent />, { visible: true });
 */
export function useCustomHeader(
  content?: React.ReactNode,
  options?: { visible?: boolean; deps?: React.DependencyList },
) {
  const ctx = React.useContext(HeaderContext);
  // If used outside of TelegramHeaderProvider, do nothing to avoid runtime errors
  if (!ctx) return;

  const { setHeader, setHeaderVisible } = ctx;
  const visible = options?.visible ?? true;
  const deps = options?.deps ?? [content, visible];

  React.useEffect(() => {
    if (visible) {
      setHeader(content ?? null);
      setHeaderVisible(true);
    } else {
      setHeaderVisible(false);
    }
    return () => {
      // Cleanup on unmount or dependency change
      setHeader(null);
      setHeaderVisible(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function TelegramHeaderProvider({
  children,
  containerClassName,
  contentWrapperClassName,
  headerHeight = 60,
}: TelegramHeaderProviderProps) {
  const [header, setHeader] = React.useState<React.ReactNode | null>(null);
  const [renderHeaderBlock, setRenderHeaderBlock] =
    React.useState<boolean>(false);
  const [headerVisible, setHeaderVisible] = React.useState<boolean>(false);

  useEffect(() => {
    if (WebApp) {
      WebApp.ready();
      if (
        WebApp.initDataUnsafe &&
        Object.keys(WebApp.initDataUnsafe).length > 0
      ) {
        setRenderHeaderBlock(WebApp.isFullscreen);
        console.log("Telegram WebApp is available: ", WebApp);
        console.log("Telegram WebApp initDataUnsafe: ", WebApp.initDataUnsafe);
      } else {
        console.warn("Telegram WebApp is not available");
      }
    }
  }, []);

  const ctxValue = React.useMemo(
    () => ({ setHeader, setHeaderVisible }),
    [setHeader, setHeaderVisible],
  );

  return (
    <HeaderContext.Provider value={ctxValue}>
      {renderHeaderBlock && (
        <div
          style={{ height: headerHeight }}
          className={cn(
            "w-full flex items-center border-b bg-white/80 dark:bg-slate-900/60 backdrop-blur",
            containerClassName,
          )}
        >
          {headerVisible && (
            <div
              className={cn(
                "w-full max-w-7xl mx-auto px-4",
                contentWrapperClassName,
              )}
            >
              {header}
            </div>
          )}
        </div>
      )}
      {children}
    </HeaderContext.Provider>
  );
}

export { HeaderContext };
