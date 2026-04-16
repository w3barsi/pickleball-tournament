export function Heading({ children, n }: { children: React.ReactNode; n?: number }) {
  return (
    <h1 className="text-5xl leading-none font-black tracking-tight text-tournament-lime uppercase italic [text-shadow:4px_4px_0px_var(--color-tournament-blue-secondary)] sm:text-5xl lg:text-6xl">
      {children}
    </h1>
  );
}
