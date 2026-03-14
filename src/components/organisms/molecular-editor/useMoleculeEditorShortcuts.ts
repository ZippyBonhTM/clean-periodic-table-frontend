'use client';

import { useEffect } from 'react';

type UseMoleculeEditorShortcutsOptions = {
  isImportModalOpen: boolean;
  isSaveModalOpen: boolean;
  isTextEditingElement: (target: EventTarget | null) => boolean;
  onRedo: () => void;
  onUndo: () => void;
};

export default function useMoleculeEditorShortcuts({
  isImportModalOpen,
  isSaveModalOpen,
  isTextEditingElement,
  onRedo,
  onUndo,
}: UseMoleculeEditorShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isSaveModalOpen || isImportModalOpen) {
        return;
      }

      if (event.altKey || !(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') {
        return;
      }

      if (isTextEditingElement(event.target)) {
        return;
      }

      event.preventDefault();

      if (event.shiftKey) {
        onRedo();
        return;
      }

      onUndo();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isImportModalOpen, isSaveModalOpen, isTextEditingElement, onRedo, onUndo]);
}
