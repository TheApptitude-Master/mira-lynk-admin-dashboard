'use client';

import * as React from 'react';
import type { ToastProps } from '@/components/ui/toast';

type ToastItem = ToastProps & {
  id: string;
  title?: string;
  description?: string;
};

type ToastState = { toasts: ToastItem[] };

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type Action =
  | { type: 'ADD'; toast: ToastItem }
  | { type: 'UPDATE'; toast: Partial<ToastItem> & Pick<ToastItem, 'id'> }
  | { type: 'DISMISS'; id?: string }
  | { type: 'REMOVE'; id?: string };

const TOAST_REMOVE_DELAY = 5000;
const listeners: Array<(state: ToastState) => void> = [];
let memoryState: ToastState = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((l) => l(memoryState));
}

function reducer(state: ToastState, action: Action): ToastState {
  switch (action.type) {
    case 'ADD':
      return { toasts: [action.toast, ...state.toasts].slice(0, 5) };
    case 'UPDATE':
      return { toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)) };
    case 'DISMISS':
      return { toasts: state.toasts.map((t) => (!action.id || t.id === action.id ? { ...t, open: false } : t)) };
    case 'REMOVE':
      return { toasts: action.id ? state.toasts.filter((t) => t.id !== action.id) : [] };
  }
}

function toast(props: Omit<ToastItem, 'id'>) {
  const id = genId();
  dispatch({ type: 'ADD', toast: { ...props, id, open: true } });
  setTimeout(() => dispatch({ type: 'DISMISS', id }), TOAST_REMOVE_DELAY);
  setTimeout(() => dispatch({ type: 'REMOVE', id }), TOAST_REMOVE_DELAY + 300);
}

function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState);
  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const idx = listeners.indexOf(setState);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);
  return { ...state, toast, dismiss: (id?: string) => dispatch({ type: 'DISMISS', id }) };
}

export { useToast, toast };
