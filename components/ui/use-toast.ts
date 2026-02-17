"use client";

import React from "react";

export type ToastProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "destructive" | "success";
  title?: string;
  description?: string;
};

const ToastContext = React.createContext<{
  toast: (props: ToastProps) => void;
  dismiss: () => void;
}>({
  toast: () => { },
  dismiss: () => { },
});

export function useToast() {
  return React.useContext(ToastContext);
}

export function toast(props: ToastProps) {
  console.log("Toast:", props);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toastFn = (props: ToastProps) => {
    console.log("Toast:", props);
  };
  
  return React.createElement(
    ToastContext.Provider,
    { value: { toast: toastFn, dismiss: () => { } } },
    children
  );
}
