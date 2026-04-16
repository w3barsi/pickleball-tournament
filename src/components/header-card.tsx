export function HeaderCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-tournament-blue px-2 py-12 lg:px-14">
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -top-10 -right-10 z-0 h-40 w-40 rounded-full bg-tournament-lime opacity-50" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white opacity-15" />
      <div className="pointer-events-none absolute right-20 bottom-10 h-16 w-16 rounded-full bg-tournament-lime opacity-10" />

      <div className="relative z-10 flex items-center justify-between">{children}</div>
    </div>
  );
}
