"use client";

import * as React from "react";

const SelectContext = React.createContext({});

const Select = ({ value, onValueChange, disabled, children }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  return (
    <SelectContext.Provider value={{ value, onValueChange, disabled, isOpen, setIsOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

const SelectTrigger = React.forwardRef(({ className = "", children, id, ...props }, ref) => {
  const { disabled, isOpen, setIsOpen } = React.useContext(SelectContext);
  
  return (
    <button
      ref={ref}
      id={id}
      type="button"
      disabled={disabled}
      onClick={() => setIsOpen(!isOpen)}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
      <svg
        className="h-4 w-4 opacity-50"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
});

SelectTrigger.displayName = "SelectTrigger";

const SelectValue = ({ placeholder, children }) => {
  // SelectValue should always render its children when provided
  // Children are passed from the parent component with the formatted label
  if (children) {
    return <>{children}</>;
  }
  return <span>{placeholder || ""}</span>;
};

const SelectContent = ({ className = "", children, ...props }) => {
  const { isOpen, setIsOpen, value, onValueChange } = React.useContext(SelectContext);
  
  if (!isOpen) return null;
  
  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={() => setIsOpen(false)}
      />
      <div className={`absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md max-h-60 overflow-auto ${className}`} {...props}>
        {React.Children.map(children, (child) => {
          if (child && child.type === SelectItem) {
            return React.cloneElement(child, {
              isSelected: value === child.props.value,
              onSelect: () => {
                onValueChange?.(child.props.value);
                setIsOpen(false);
              }
            });
          }
          return child;
        })}
      </div>
    </>
  );
};

const SelectItem = ({ className = "", children, value, isSelected, onSelect, ...props }) => {
  return (
    <div
      className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-3 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${isSelected ? 'bg-accent' : ''} ${className}`}
      onClick={onSelect}
      {...props}
    >
      {children}
    </div>
  );
};

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
