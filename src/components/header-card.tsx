export function HeaderCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-blue-500 px-2 py-12 text-white lg:px-14">
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -top-10 -right-10 z-0 h-40 w-40 rounded-full bg-lime-400 opacity-50" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white opacity-15" />
      <div className="pointer-events-none absolute right-20 bottom-10 h-16 w-16 rounded-full bg-lime-400 opacity-10" />

      <div className="relative z-10 flex flex-col items-center justify-between gap-4 md:flex-row">
        {children}
      </div>
    </div>
  );
}

export function HeaderCardHeading({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="font-heading text-4xl leading-[1.05] font-black tracking-tight md:text-5xl lg:text-6xl">
      {children}
    </h1>
  );
}

export function HeaderCardDescription({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/90">{children}</p>;
}
