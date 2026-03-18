type AppHeaderNavLinkLabelProps = {
  label: string;
};

export default function AppHeaderNavLinkLabel({ label }: AppHeaderNavLinkLabelProps) {
  return (
    <span>{label}</span>
  );
}
