"use client";

import { useEffect, useState } from "react";

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 5000;

type ToasterToast = {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
};

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

const listeners: Array<(state: ToasterToast[]) => void> = [];
let memoryState: ToasterToast[] = [];

function dispatch(toast: ToasterToast) {
  memoryState = [toast, ...memoryState].slice(0, TOAST_LIMIT);
  listeners.forEach((listener) => listener(memoryState));

  setTimeout(() => {
    memoryState = memoryState.filter((t) => t.id !== toast.id);
    listeners.forEach((listener) => listener(memoryState));
  }, TOAST_REMOVE_DELAY);
}

function toast({
  title,
  description,
  variant = "default",
}: {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}) {
  const id = genId();
  dispatch({ id, title, description, variant });
  return id;
}

function useToast() {
  const [toasts, setToasts] = useState<ToasterToast[]>(memoryState);

  useEffect(() => {
    listeners.push(setToasts);
    return () => {
      const index = listeners.indexOf(setToasts);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return { toasts, toast };
}

export { useToast, toast };

