'use client';

import Button from '@/components/atoms/Button';

function PaletteArrowIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {direction === 'left' ? <path d="m10.5 3.5-5 4.5 5 4.5" /> : <path d="m5.5 3.5 5 4.5-5 4.5" />}
    </svg>
  );
}

type MoleculePaletteRailNavigationProps = {
  direction: 'left' | 'right';
  disabled: boolean;
  isCompact: boolean;
  label: string;
  onClick: () => void;
  side: 'left' | 'right';
};

export default function MoleculePaletteRailNavigation({
  direction,
  disabled,
  isCompact,
  label,
  onClick,
  side,
}: MoleculePaletteRailNavigationProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={`absolute ${side}-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-(--surface-overlay-strong) px-0 backdrop-blur-xl ${
        isCompact ? 'h-7 w-7' : 'h-8 w-8 sm:h-9 sm:w-9'
      }`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      <PaletteArrowIcon direction={direction} />
    </Button>
  );
}
