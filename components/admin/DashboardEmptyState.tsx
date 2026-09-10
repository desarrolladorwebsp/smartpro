type DashboardEmptyStateProps = {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export function DashboardEmptyState({ title, description, action }: DashboardEmptyStateProps) {
  return (
    <div className="rounded-[26px] border border-dashed border-border bg-white p-8 text-center shadow-[0_18px_46px_rgba(16,16,36,0.04)]">
      <h2 className="text-2xl font-bold tracking-[-0.05em] text-foreground">{title}</h2>
      <p className="mt-3 text-sm text-muted">{description}</p>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-r from-primary to-magenta px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(109,40,217,0.22)] transition hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}
