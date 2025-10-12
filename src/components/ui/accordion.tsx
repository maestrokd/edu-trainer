import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type AccordionSingleValue = string | undefined;

type AccordionContextValue = {
  openValue: AccordionSingleValue;
  collapsible: boolean;
  setOpenValue: (value: AccordionSingleValue) => void;
};

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

function useAccordionContext(component: string) {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error(`${component} must be used within <Accordion />`);
  }
  return context;
}

type AccordionItemContextValue = {
  value: string;
};

const AccordionItemContext = React.createContext<AccordionItemContextValue | null>(null);

function useAccordionItemContext(component: string) {
  const context = React.useContext(AccordionItemContext);
  if (!context) {
    throw new Error(`${component} must be used within <AccordionItem />`);
  }
  return context;
}

interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type: "single";
  collapsible?: boolean;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: AccordionSingleValue) => void;
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  (
    {
      type,
      collapsible = false,
      value,
      defaultValue,
      onValueChange,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    if (type !== "single") {
      throw new Error("Only type=\"single\" is supported for Accordion.");
    }

    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = React.useState<AccordionSingleValue>(
      defaultValue,
    );

    const currentValue = isControlled ? value : internalValue;

    const setOpenValue = React.useCallback(
      (next: AccordionSingleValue) => {
        if (!isControlled) {
          setInternalValue(next);
        }
        onValueChange?.(next);
      },
      [isControlled, onValueChange],
    );

    React.useEffect(() => {
      if (isControlled) {
        setInternalValue(value);
      }
    }, [isControlled, value]);

    const contextValue = React.useMemo<AccordionContextValue>(
      () => ({
        openValue: currentValue,
        collapsible,
        setOpenValue,
      }),
      [collapsible, currentValue, setOpenValue],
    );

    return (
      <AccordionContext.Provider value={contextValue}>
        <div ref={ref} className={className} {...props}>
          {children}
        </div>
      </AccordionContext.Provider>
    );
  },
);
Accordion.displayName = "Accordion";

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, className, children, ...props }, ref) => {
    const { openValue } = useAccordionContext("AccordionItem");
    const isOpen = openValue === value;

    return (
      <AccordionItemContext.Provider value={{ value }}>
        <div
          ref={ref}
          data-state={isOpen ? "open" : "closed"}
          className={cn("border-b last:border-b-0", className)}
          {...props}
        >
          {children}
        </div>
      </AccordionItemContext.Provider>
    );
  },
);
AccordionItem.displayName = "AccordionItem";

interface AccordionTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, onClick, ...props }, ref) => {
    const { value } = useAccordionItemContext("AccordionTrigger");
    const { openValue, collapsible, setOpenValue } = useAccordionContext(
      "AccordionTrigger",
    );
    const isOpen = openValue === value;

    return (
      <button
        type="button"
        ref={ref}
        className={cn(
          "flex w-full items-center justify-between py-4 text-sm font-medium transition-all",
          className,
        )}
        data-state={isOpen ? "open" : "closed"}
        aria-expanded={isOpen}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented) {
            return;
          }
          if (isOpen) {
            if (collapsible) {
              setOpenValue(undefined);
            }
            return;
          }
          setOpenValue(value);
        }}
        {...props}
      >
        {children}
        <ChevronDown
          aria-hidden="true"
          data-state={isOpen ? "open" : "closed"}
          className="ml-3 h-4 w-4 shrink-0 transition-transform duration-200 data-[state=open]:rotate-180"
        />
      </button>
    );
  },
);
AccordionTrigger.displayName = "AccordionTrigger";

interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children, ...props }, ref) => {
    const { value } = useAccordionItemContext("AccordionContent");
    const { openValue } = useAccordionContext("AccordionContent");
    const isOpen = openValue === value;

    return (
      <div
        ref={ref}
        data-state={isOpen ? "open" : "closed"}
        hidden={!isOpen}
        aria-hidden={!isOpen}
        {...props}
      >
        <div className={cn("pb-4 pt-0", className)}>{children}</div>
      </div>
    );
  },
);
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
