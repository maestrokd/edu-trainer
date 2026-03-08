import React from "react";

export type InsetHeaderContextType = {
  setInsetHeader: (node: React.ReactNode | null) => void;
  setInsetHeaderVisible: (visible: boolean) => void;
};

export const InsetHeaderContext = React.createContext<InsetHeaderContextType | undefined>(undefined);

export function useInsetHeader(
  content?: React.ReactNode,
  options?: { visible?: boolean; deps?: React.DependencyList }
) {
  const ctx = React.useContext(InsetHeaderContext);
  if (!ctx) return;

  const { setInsetHeader, setInsetHeaderVisible } = ctx;
  const visible = options?.visible ?? true;
  const deps = options?.deps ?? [content, visible];

  React.useEffect(() => {
    if (visible) {
      setInsetHeader(content ?? null);
      setInsetHeaderVisible(true);
    } else {
      setInsetHeaderVisible(false);
    }

    return () => {
      setInsetHeader(null);
      setInsetHeaderVisible(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
