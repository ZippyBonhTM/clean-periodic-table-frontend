type AppHeaderNavLinkLabelProps = {
  label: string;
  badge?: string;
};

export default function AppHeaderNavLinkLabel({ label, badge }: AppHeaderNavLinkLabelProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{label}</span>
      {badge === undefined ? null : (
        <span className="inline-flex items-center rounded-full border border-(--accent)/45 bg-(--accent)/12 px-1.5 py-px text-[8px] font-bold uppercase tracking-[0.18em] text-foreground">
          {badge}
        </span>
      )}
    </span>
  );
}
