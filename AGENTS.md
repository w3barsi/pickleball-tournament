# Agent Guidelines

## Essentials

- Stack: TypeScript + React (TanStack Start), with Convex DB, shadcn/ui with base-ui NOT radix, and Better Auth.
- Use shadcn CLI (`pnpm ui add <component>`) for adding new UI components & primitives.
- Use `lucide-react` for UI icons (use `Icon` suffix, e.g. `import { Loader2Icon } from "lucide-react"`); for brand icons use `@icons-pack/react-simple-icons` (e.g. `SiGithub`).
- For TanStack libraries, consult latest docs via `pnpm tanstack <command>` (see [Workflow](.agents/workflow.md#tanstack-cli)).
- Don't build after every little change. If `pnpm lint` passes; assume changes work.

## Convex

- **Queries**: Use `@convex-dev/react-query` with `convexQuery` helper and `useQuery` from `@tanstack/react-query` for read operations.
- **Mutations**: Always use `useMutation` from `convex/react` (NOT from `@tanstack/react-query`) for Convex mutations.
  - Example: `const create = useMutation(api.players.create)` then call `create({ fullName: "John Doe" })`.

## UI Components

- All UI components use **base-ui** (NOT Radix). Refer to existing components in `src/components/ui/` for prop patterns and usage.
- Dialogs, popovers, and other overlay components are built on `@base-ui/react` primitives.
- A `shadcn` skill is available for shadcn/ui component management, debugging, and styling workflows.

## Topic-specific Guidelines

- [TanStack patterns](.agents/tanstack-patterns.md) - Routing, data fetching, loaders, server functions, environment shaking
- [Auth patterns](.agents/auth.md) - Route guards, middleware, auth utilities
- [TypeScript conventions](.agents/typescript.md) - Casting rules, prefer type inference
- [Workflow](.agents/workflow.md) - Workflow commands, validation approach

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.

<!-- convex-ai-end -->
