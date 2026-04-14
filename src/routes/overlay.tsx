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
    await ctx.context.queryClient.ensureQueryData(convexQuery(api.scoring.getLiveMatch));
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
  const { data: match } = useQuery(convexQuery(api.scoring.getLiveMatch));

  if (!match) {
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
        No live match
      </div>
    );
  }

  const team1Serving = match.servingTeam === 1;
  const team2Serving = match.servingTeam === 2;

  // Generate serve indicators (x marks)
  const getServeIndicator = (isServing: boolean, serverNumber: number) => {
    if (!isServing) return "";
    return "x".repeat(serverNumber);
  };

  const team1ServeIndicator = getServeIndicator(team1Serving, match.serverNumber);
  const team2ServeIndicator = getServeIndicator(team2Serving, match.serverNumber);

  // Simple team names for overlay (would ideally come from participant data)
  const team1Name = "Team 1";
  const team2Name = "Team 2";

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
          {team1Name}
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
          {match.team1Score}
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
          {team2Name}
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
          {match.team2Score}
        </span>
      </div>
    </div>
  );
}

// Export the client for HMR safety
export { convexClient };
