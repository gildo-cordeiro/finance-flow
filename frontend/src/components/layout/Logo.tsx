export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
        <span className="text-sm font-bold tracking-wider text-primary-foreground">FF</span>
      </div>
      <span className="font-semibold tracking-tight">FinanceFlow</span>
    </div>
  );
}
