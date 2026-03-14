'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

import type { FloatingMenuPosition } from './periodicTable.types';

type UseFloatingMenuPositionParams = {
  anchorRef: RefObject<HTMLButtonElement | null>;
  isOpen: boolean;
  minWidth: number;
  onRequestClose: () => void;
};

export default function useFloatingMenuPosition({
  anchorRef,
  isOpen,
  minWidth,
  onRequestClose,
}: UseFloatingMenuPositionParams) {
  const [position, setPosition] = useState<FloatingMenuPosition | null>(null);
  const frameRef = useRef<number | null>(null);

  const getFloatingMenuPosition = useCallback((anchor: HTMLButtonElement) => {
    if (typeof window === 'undefined') {
      return null;
    }

    const rect = anchor.getBoundingClientRect();
    const width = Math.max(minWidth, Math.round(rect.width));
    const maxLeft = Math.max(8, window.innerWidth - width - 8);
    const left = Math.max(8, Math.min(Math.round(rect.left), maxLeft));

    return {
      left,
      top: Math.round(rect.bottom + 8),
      width,
    } satisfies FloatingMenuPosition;
  }, [minWidth]);

  const syncPosition = useCallback(() => {
    if (anchorRef.current === null) {
      return;
    }

    setPosition(getFloatingMenuPosition(anchorRef.current));
  }, [anchorRef, getFloatingMenuPosition]);

  const schedulePositionSync = useCallback(() => {
    if (frameRef.current !== null) {
      return;
    }

    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      syncPosition();
    });
  }, [syncPosition]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    schedulePositionSync();

    const onWindowChange = () => {
      schedulePositionSync();
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onRequestClose();
      }
    };

    window.addEventListener('resize', onWindowChange);
    window.addEventListener('scroll', onWindowChange, true);
    window.addEventListener('keydown', onEscape);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      window.removeEventListener('resize', onWindowChange);
      window.removeEventListener('scroll', onWindowChange, true);
      window.removeEventListener('keydown', onEscape);
    };
  }, [isOpen, onRequestClose, schedulePositionSync]);

  return position;
}
