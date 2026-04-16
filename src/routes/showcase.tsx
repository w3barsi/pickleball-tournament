import { createFileRoute, Navigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/showcase")({
  component: ShowcasePage,
});

// Button variants from button.tsx
const variants = ["default", "outline", "secondary", "ghost", "destructive", "link"] as const;

// Button sizes from button.tsx (excluding icon sizes for text buttons)
const textSizes = ["xs", "sm", "default", "lg"] as const;
const iconSizes = ["icon-xs", "icon-sm", "icon", "icon-lg"] as const;

function ShowcasePage() {
  // Only show in dev mode
  if (!import.meta.env.DEV) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl space-y-12">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-foreground">Button Showcase</h1>
          <p className="text-muted-foreground">
            All button variants and sizes available in the design system.
          </p>
        </div>

        {/* Text Buttons Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Text Buttons</h2>
          <div className="space-y-8">
            {variants.map((variant) => (
              <div key={variant} className="space-y-3">
                <h3 className="text-sm font-medium tracking-wider text-muted-foreground uppercase">
                  {variant}
                </h3>
                <div className="flex flex-wrap items-center gap-4">
                  {textSizes.map((size) => (
                    <Button key={size} variant={variant} size={size}>
                      {size === "default" ? variant : size}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Icon Buttons Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Icon Buttons</h2>
          <div className="space-y-8">
            {variants.map((variant) => (
              <div key={variant} className="space-y-3">
                <h3 className="text-sm font-medium tracking-wider text-muted-foreground uppercase">
                  {variant}
                </h3>
                <div className="flex flex-wrap items-center gap-4">
                  {iconSizes.map((size) => (
                    <Button
                      key={size}
                      variant={variant}
                      size={size}
                      aria-label={`${variant} ${size}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Disabled State Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Disabled States</h2>
          <div className="space-y-8">
            {variants.map((variant) => (
              <div key={variant} className="space-y-3">
                <h3 className="text-sm font-medium tracking-wider text-muted-foreground uppercase">
                  {variant}
                </h3>
                <div className="flex flex-wrap items-center gap-4">
                  <Button variant={variant} size="default" disabled>
                    Disabled
                  </Button>
                  <Button variant={variant} size="sm" disabled>
                    Small Disabled
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Full Width Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Full Width</h2>
          <div className="space-y-4">
            {variants.map((variant) => (
              <Button key={variant} variant={variant} size="default" className="w-full">
                Full Width {variant}
              </Button>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t pt-8 text-center text-sm text-muted-foreground">
          <p>This page is only visible in development mode.</p>
        </footer>
      </div>
    </div>
  );
}
