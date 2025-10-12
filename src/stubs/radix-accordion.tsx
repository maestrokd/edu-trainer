import * as React from "react";

type AccordionSingleValue = string | undefined;

interface AccordionContextValue {
  openValue: AccordionSingleValue;
  collapsible: boolean;
  setOpenValue: (value: AccordionSingleValue) => void;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(
  null,
);

function useAccordionContext(component: string) {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error(`${component} must be used within AccordionPrimitive.Root`);
  }
  return context;
}

interface AccordionItemContextValue {
  value: string;
}

const AccordionItemContext = React.createContext<
  AccordionItemContextValue | null
>(null);

function useAccordionItemContext(component: string) {
  const context = React.useContext(AccordionItemContext);
  if (!context) {
    throw new Error(`${component} must be used within AccordionPrimitive.Item`);
  }
  return context;
}

interface RootProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single";
  collapsible?: boolean;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: AccordionSingleValue) => void;
}

const Root = React.forwardRef<HTMLDivElement, RootProps>(
  (
    {
      type = "single",
      collapsible = false,
      value,
      defaultValue,
      onValueChange,
      children,
      ...props
    },
    ref,
  ) => {
    if (type !== "single") {
      throw new Error("Only single type is supported in stub Accordion");
    }

    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = React.useState<
      AccordionSingleValue
    >(defaultValue);

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
        <div ref={ref} {...props}>
          {children}
        </div>
      </AccordionContext.Provider>
    );
  },
);
Root.displayName = "AccordionRoot";

interface ItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const Item = React.forwardRef<HTMLDivElement, ItemProps>(
  ({ value, children, ...props }, ref) => {
    const { openValue } = useAccordionContext("AccordionPrimitive.Item");
    const isOpen = openValue === value;

    return (
      <AccordionItemContext.Provider value={{ value }}>
        <div ref={ref} data-state={isOpen ? "open" : "closed"} {...props}>
          {children}
        </div>
      </AccordionItemContext.Provider>
    );
  },
);
Item.displayName = "AccordionItem";

const Header = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => (
    <div ref={ref} {...props}>
      {children}
    </div>
  ),
);
Header.displayName = "AccordionHeader";

type TriggerElement = HTMLButtonElement;

type TriggerProps = React.ButtonHTMLAttributes<TriggerElement>;

const Trigger = React.forwardRef<TriggerElement, TriggerProps>(
  ({ children, onClick, ...props }, ref) => {
    const { value } = useAccordionItemContext("AccordionPrimitive.Trigger");
    const { openValue, collapsible, setOpenValue } = useAccordionContext(
      "AccordionPrimitive.Trigger",
    );
    const isOpen = openValue === value;

    return (
      <button
        type="button"
        ref={ref}
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
      </button>
    );
  },
);
Trigger.displayName = "AccordionTrigger";

type ContentElement = HTMLDivElement;

type ContentProps = React.HTMLAttributes<ContentElement>;

const Content = React.forwardRef<ContentElement, ContentProps>(
  ({ children, ...props }, ref) => {
    const { value } = useAccordionItemContext("AccordionPrimitive.Content");
    const { openValue } = useAccordionContext("AccordionPrimitive.Content");
    const isOpen = openValue === value;

    return (
      <div
        ref={ref}
        data-state={isOpen ? "open" : "closed"}
        hidden={!isOpen}
        aria-hidden={!isOpen}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Content.displayName = "AccordionContent";

export { Content, Header, Item, Root, Trigger };
