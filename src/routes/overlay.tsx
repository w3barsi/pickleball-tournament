import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ConvexProvider, ConvexReactClient } from "convex/react";

// Get the Convex URL from environment
const convexUrl = import.meta.env.VITE_CONVEX_URL;

// Create a client for the overlay (public access)
const convexClient = new ConvexReactClient(convexUrl);

export const Route = createFileRoute("/overlay")({
  component: OverlayPage,
  loader: async (ctx) => {
    await ctx.context.queryClient.ensureQueryData(convexQuery(api.scoring.getLiveGame));
  },
});

function OverlayPage() {
  return (
    <ConvexProvider client={convexClient}>
      <Scoreboard />
    </ConvexProvider>
  );
}

// The actual scoreboard component
function Scoreboard() {
  const { data: game } = useQuery(convexQuery(api.scoring.getLiveGame));

  if (!game) {
    return (
      <div
        style={{
          padding: "8px 16px",
          backgroundColor: "rgba(0, 0, 0, 1)",
          color: "#fff",
          fontSize: "14px",
          fontWeight: 500,
          borderRadius: "4px",
          display: "inline-block",
        }}
      >
        No live game
      </div>
    );
  }

  const team1Serving = game.servingTeam === 1;
  const team2Serving = game.servingTeam === 2;

  // Generate serve indicators (x marks)
  const getServeIndicator = (isServing: boolean, serverNumber: number) => {
    if (!isServing) return "";
    return "x".repeat(serverNumber);
  };

  const team1ServeIndicator = getServeIndicator(team1Serving, game.serverNumber);
  const team2ServeIndicator = getServeIndicator(team2Serving, game.serverNumber);

  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        gap: "2px",
        backgroundColor: "rgba(0, 0, 0, 0.95)",
        padding: "8px 12px",
        borderRadius: "6px",
        fontFamily: '"DM Sans Variable", "Inter", system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Team 1 Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "16px",
          fontWeight: 600,
          color: "#fff",
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            textAlign: "right",
            flex: "1 1 auto",
          }}
        >
          {game.team1Name}
        </span>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "14px",
            color: team1Serving ? "#4ade80" : "transparent",
            width: "24px",
            textAlign: "right",
            letterSpacing: "1px",
            flexShrink: 0,
          }}
        >
          {team1ServeIndicator}
        </span>
        <span style={{ color: "#9ca3af", flexShrink: 0 }}>-</span>
        <span
          style={{
            width: "24px",
            textAlign: "left",
            fontVariantNumeric: "tabular-nums",
            flexShrink: 0,
          }}
        >
          {game.team1Score}
        </span>
      </div>

      {/* Team 2 Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "16px",
          fontWeight: 600,
          color: "#fff",
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            textAlign: "right",
            flex: "1 1 auto",
          }}
        >
          {game.team2Name}
        </span>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "14px",
            color: team2Serving ? "#4ade80" : "transparent",
            width: "24px",
            textAlign: "right",
            letterSpacing: "1px",
            flexShrink: 0,
          }}
        >
          {team2ServeIndicator}
        </span>
        <span style={{ color: "#9ca3af", flexShrink: 0 }}>-</span>
        <span
          style={{
            width: "24px",
            textAlign: "left",
            fontVariantNumeric: "tabular-nums",
            flexShrink: 0,
          }}
        >
          {game.team2Score}
        </span>
      </div>
    </div>
  );
}

// Export the client for HMR safety
export { convexClient };
