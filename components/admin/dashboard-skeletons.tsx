function Pulse({ className }: { className: string }) {
  return <div className={`dashboard-skeleton ${className}`} />;
}

function DashboardPageHeaderSkeleton({ withAction = true }: { withAction?: boolean }) {
  return (
    <header className="-mx-4 -mt-4 rounded-none border-x-0 border-t-0 border-border bg-white px-4 py-4 shadow-[0_12px_30px_rgba(16,16,36,0.04)] sm:-mx-6 sm:-mt-6 sm:px-6 lg:-mx-8 lg:-mt-8 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <Pulse className="h-12 w-12 shrink-0 rounded-2xl" />
          <div className="min-w-0 space-y-2">
            <Pulse className="h-2.5 w-28 rounded-full" />
            <Pulse className="h-7 w-40 rounded-full sm:w-52" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:shrink-0 lg:justify-end">
          <Pulse className="h-11 w-11 rounded-2xl" />
          <Pulse className="h-11 w-40 rounded-2xl" />
          {withAction ? <Pulse className="h-11 w-36 rounded-full" /> : null}
        </div>
      </div>
    </header>
  );
}

function FilterBarSkeleton() {
  return (
    <div className="rounded-[24px] border border-border bg-white p-4 shadow-[0_18px_46px_rgba(16,16,36,0.04)] sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Pulse className="h-12 w-full rounded-2xl lg:max-w-md" />
        <Pulse className="h-12 w-full rounded-2xl lg:max-w-xs" />
      </div>
    </div>
  );
}

function TableSkeleton({
  columns,
  rows = 6,
}: {
  columns: number;
  rows?: number;
}) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-border bg-white shadow-[0_18px_46px_rgba(16,16,36,0.04)]">
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              {Array.from({ length: columns }, (_, index) => (
                <th key={index} className="px-4 py-3">
                  <Pulse className="h-2.5 w-16 rounded-full" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, rowIndex) => (
              <tr key={rowIndex} className="border-t border-border">
                {Array.from({ length: columns }, (_, columnIndex) => (
                  <td key={columnIndex} className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      {columnIndex === 0 ? <Pulse className="h-9 w-9 shrink-0 rounded-full" /> : null}
                      <Pulse className={`h-3 rounded-full ${columnIndex === 0 ? "w-32" : "w-20"}`} />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="rounded-[20px] border border-border bg-soft-background p-4">
            <div className="flex items-center gap-3">
              <Pulse className="h-9 w-9 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Pulse className="h-3.5 w-2/3 rounded-full" />
                <Pulse className="h-3 w-1/2 rounded-full" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Pulse className="h-6 w-20 rounded-full" />
              <Pulse className="h-3 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OverviewPageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <DashboardPageHeaderSkeleton withAction={false} />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="rounded-[24px] border border-border bg-white p-5 shadow-[0_12px_30px_rgba(16,16,36,0.04)]"
          >
            <Pulse className="h-3 w-24 rounded-full" />
            <Pulse className="mt-4 h-8 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ClientsPageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <DashboardPageHeaderSkeleton />
      <FilterBarSkeleton />
      <TableSkeleton columns={8} />
    </div>
  );
}

export function ServicesPageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <DashboardPageHeaderSkeleton />
      <div className="rounded-[24px] border border-border bg-white p-3 shadow-[0_18px_46px_rgba(16,16,36,0.04)] sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <Pulse className="h-14 w-full rounded-2xl xl:w-80" />
          <Pulse className="h-10 w-full flex-1 rounded-xl" />
          <Pulse className="h-10 w-full rounded-xl xl:w-40" />
        </div>
      </div>
      <TableSkeleton columns={6} rows={7} />
    </div>
  );
}

export function PurchasesPageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <DashboardPageHeaderSkeleton withAction={false} />
      <TableSkeleton columns={6} />
    </div>
  );
}

export function ExecutivesPageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <DashboardPageHeaderSkeleton />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <TableSkeleton columns={4} rows={5} />
        <div className="rounded-[24px] border border-border bg-white p-5 shadow-[0_18px_46px_rgba(16,16,36,0.04)]">
          <Pulse className="h-5 w-40 rounded-full" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Pulse key={index} className="h-12 w-full rounded-2xl" />
            ))}
          </div>
          <Pulse className="mt-5 h-11 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ClientDetailPageSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite">
      <div className="rounded-[24px] border border-border bg-white p-4 shadow-[0_12px_30px_rgba(16,16,36,0.04)] sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Pulse className="h-12 w-12 shrink-0 rounded-2xl" />
            <div className="min-w-0 space-y-2">
              <Pulse className="h-2.5 w-28 rounded-full" />
              <Pulse className="h-7 w-48 rounded-full" />
              <Pulse className="h-3 w-32 rounded-full" />
            </div>
          </div>
          <div className="flex gap-2">
            <Pulse className="h-8 w-20 rounded-full" />
            <Pulse className="h-10 w-24 rounded-full" />
          </div>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="rounded-[22px] border border-border bg-white p-4 shadow-[0_12px_30px_rgba(16,16,36,0.04)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-2">
                <Pulse className="h-2.5 w-20 rounded-full" />
                <Pulse className="h-8 w-10 rounded-full" />
              </div>
              <Pulse className="h-11 w-11 rounded-2xl" />
            </div>
          </div>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_0.9fr]">
        <section className="rounded-[26px] border border-border bg-white p-4 shadow-[0_12px_30px_rgba(16,16,36,0.04)] sm:p-5">
          <Pulse className="h-2.5 w-24 rounded-full" />
          <Pulse className="mt-3 h-6 w-40 rounded-full" />
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {Array.from({ length: 9 }, (_, index) => (
              <Pulse key={index} className="h-16 w-full rounded-[18px]" />
            ))}
          </div>
        </section>
        <aside className="space-y-4 rounded-[26px] border border-border bg-white p-4 shadow-[0_12px_30px_rgba(16,16,36,0.04)] sm:p-5">
          <Pulse className="h-2.5 w-20 rounded-full" />
          <Pulse className="h-6 w-40 rounded-full" />
          {Array.from({ length: 3 }, (_, index) => (
            <Pulse key={index} className="h-20 w-full rounded-[20px]" />
          ))}
        </aside>
      </div>
    </div>
  );
}

export function PurchaseDetailPageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <DashboardPageHeaderSkeleton />
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-[26px] border border-border bg-white p-5 shadow-[0_18px_46px_rgba(16,16,36,0.04)]">
          <Pulse className="h-6 w-48 rounded-full" />
          <div className="mt-5 space-y-4">
            {Array.from({ length: 3 }, (_, index) => (
              <Pulse key={index} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        </section>
        <aside className="space-y-6 rounded-[26px] border border-border bg-white p-5 shadow-[0_18px_46px_rgba(16,16,36,0.04)]">
          <Pulse className="h-2.5 w-20 rounded-full" />
          <Pulse className="h-7 w-40 rounded-full" />
          <Pulse className="h-28 w-full rounded-2xl" />
          <Pulse className="h-16 w-full rounded-2xl" />
        </aside>
      </div>
    </div>
  );
}
