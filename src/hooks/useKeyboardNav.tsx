import { useEffect, useCallback } from "react";

interface UseKeyboardNavOptions {
  items: any[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onOpen: (index: number) => void;
  enabled?: boolean;
}

export function useKeyboardNav({ items, selectedIndex, onSelect, onOpen, enabled = true }: UseKeyboardNavOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled || items.length === 0) return;

      // Don't capture when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") return;

      switch (e.key) {
        case "j":
        case "ArrowDown":
          e.preventDefault();
          onSelect(Math.min(selectedIndex + 1, items.length - 1));
          break;
        case "k":
        case "ArrowUp":
          e.preventDefault();
          onSelect(Math.max(selectedIndex - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < items.length) {
            onOpen(selectedIndex);
          }
          break;
      }
    },
    [items.length, selectedIndex, onSelect, onOpen, enabled]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
