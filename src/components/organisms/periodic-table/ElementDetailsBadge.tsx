'use client';

type ElementDetailsBadgeTone = 'neutral' | 'radioactive';

type ElementDetailsBadgeProps = {
  label: string;
  tone?: ElementDetailsBadgeTone;
};

export default function ElementDetailsBadge({
  label,
  tone = 'neutral',
}: ElementDetailsBadgeProps) {
  if (tone === 'radioactive') {
    return (
      <span className="inline-flex rounded-md border border-rose-400/60 bg-rose-500/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.08em] text-rose-300">
        {label}
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-md border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2 py-1 text-xs font-semibold text-[var(--text-strong)]">
      {label}
    </span>
  );
}
