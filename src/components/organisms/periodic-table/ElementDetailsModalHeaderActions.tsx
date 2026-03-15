'use client';

type ElementDetailsModalHeaderActionsProps = {
  hasNextElement: boolean;
  hasPreviousElement: boolean;
  onCloseExpandedImage: () => void;
  onOpenNextElement?: () => void;
  onOpenPreviousElement?: () => void;
};

function NavigationButton({
  ariaLabel,
  children,
  disabled,
  onClick,
}: {
  ariaLabel: string;
  children: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="rounded-lg border border-[var(--border-subtle)] px-2.5 py-1.5 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-strong)] disabled:cursor-not-allowed disabled:opacity-45"
    >
      {children}
    </button>
  );
}

export default function ElementDetailsModalHeaderActions({
  hasNextElement,
  hasPreviousElement,
  onCloseExpandedImage,
  onOpenNextElement,
  onOpenPreviousElement,
}: ElementDetailsModalHeaderActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <NavigationButton
        ariaLabel="Previous element"
        disabled={!hasPreviousElement}
        onClick={() => {
          if (!hasPreviousElement || onOpenPreviousElement === undefined) {
            return;
          }

          onCloseExpandedImage();
          onOpenPreviousElement();
        }}
      >
        ←
      </NavigationButton>

      <NavigationButton
        ariaLabel="Next element"
        disabled={!hasNextElement}
        onClick={() => {
          if (!hasNextElement || onOpenNextElement === undefined) {
            return;
          }

          onCloseExpandedImage();
          onOpenNextElement();
        }}
      >
        →
      </NavigationButton>
    </div>
  );
}
