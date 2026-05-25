"use client";

import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMutation } from "convex/react";
import { PlusIcon } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

import { ConfirmCreatePlayersDialog } from "@/components/player-pairs/confirm-create-players-dialog";
import {
  Autocomplete,
  AutocompleteInput,
  AutocompleteContent,
  AutocompleteList,
  AutocompleteItem,
  AutocompleteEmpty,
  AutocompleteCollection,
} from "@/components/reui/autocomplete";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

function useDebouncedValue<T>(value: T, delay = 150) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

type PlayerResult = {
  _id: Id<"player">;
  fullName: string;
  nickname: string;
};

type Option =
  | PlayerResult
  | {
      _id: "__create__";
      fullName: string;
      nickname: "";
    };

function getOptions(results: PlayerResult[], query: string): Option[] {
  if (!query.trim()) return results;
  const exactMatch = results.some((r) => r.fullName.toLowerCase() === query.trim().toLowerCase());
  if (exactMatch) return results;
  return [...results, { _id: "__create__", fullName: query.trim(), nickname: "" }];
}

interface RegisterPayloadSingles {
  categoryId: Id<"categories">;
  playerId?: Id<"player">;
  playerName: string;
}

interface RegisterPayloadDoubles {
  categoryId: Id<"categories">;
  playerOneId?: Id<"player">;
  playerOneName: string;
  playerTwoId?: Id<"player">;
  playerTwoName: string;
}

interface RegisterParticipantDialogProps {
  categoryId: Id<"categories">;
  categoryType: "singles" | "doubles";
  onSuccess?: () => void;
}

export function RegisterParticipantDialog({
  categoryId,
  categoryType,
  onSuccess,
}: RegisterParticipantDialogProps) {
  const registerWithPlayers = useMutation(api.app.categoryParticipants.registerWithPlayers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Singles state
  const [playerQuery, setPlayerQuery] = useState("");
  const [playerId, setPlayerId] = useState<string | null>(null);

  // Doubles state
  const [p1Query, setP1Query] = useState("");
  const [p2Query, setP2Query] = useState("");
  const [p1Id, setP1Id] = useState<string | null>(null);
  const [p2Id, setP2Id] = useState<string | null>(null);

  const debouncedPlayer = useDebouncedValue(playerQuery);
  const debouncedP1 = useDebouncedValue(p1Query);
  const debouncedP2 = useDebouncedValue(p2Query);

  const { data: playerResults = [] } = useQuery({
    ...convexQuery(api.app.players.search, { query: debouncedPlayer }),
    placeholderData: keepPreviousData,
  });
  const { data: p1Results = [] } = useQuery({
    ...convexQuery(api.app.players.search, { query: debouncedP1 }),
    placeholderData: keepPreviousData,
  });
  const { data: p2Results = [] } = useQuery({
    ...convexQuery(api.app.players.search, { query: debouncedP2 }),
    placeholderData: keepPreviousData,
  });

  const playerOptions = getOptions(playerResults, playerQuery);
  const p1Options = getOptions(p1Results, p1Query);
  const p2Options = getOptions(p2Results, p2Query);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [missingNames, setMissingNames] = useState<string[]>([]);
  const [pendingPayload, setPendingPayload] = useState<
    RegisterPayloadSingles | RegisterPayloadDoubles | null
  >(null);

  const resetAndClose = useCallback(() => {
    setPlayerQuery("");
    setPlayerId(null);
    setP1Query("");
    setP2Query("");
    setP1Id(null);
    setP2Id(null);
    setMissingNames([]);
    setPendingPayload(null);
    setIsDialogOpen(false);
  }, []);

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) resetAndClose();
  };

  const handleSinglesSubmit = async () => {
    const name = playerQuery.trim();
    if (!name) {
      toast.error("Player name is required");
      return;
    }

    let finalPlayerId = playerId;
    if (!finalPlayerId) {
      const match = playerResults.find((r) => r.fullName.toLowerCase() === name.toLowerCase());
      if (match) finalPlayerId = match._id;
    }

    const payload: RegisterPayloadSingles = {
      categoryId,
      playerId: finalPlayerId ? (finalPlayerId as Id<"player">) : undefined,
      playerName: name,
    };

    if (!finalPlayerId) {
      setMissingNames([name]);
      setPendingPayload(payload);
      setConfirmOpen(true);
      return;
    }

    // Optimistic: close dialog immediately, fire mutation in background
    resetAndClose();
    toast.promise(registerWithPlayers(payload), {
      loading: "Registering participant...",
      success: () => {
        onSuccess?.();
        return "Participant registered";
      },
      error: (err) => (err instanceof Error ? err.message : "Failed to register participant"),
    });
  };

  const handleDoublesSubmit = async () => {
    const p1Name = p1Query.trim();
    const p2Name = p2Query.trim();

    if (!p1Name || !p2Name) {
      toast.error("Both players are required");
      return;
    }

    let finalP1Id = p1Id;
    if (!finalP1Id) {
      const match = p1Results.find((r) => r.fullName.toLowerCase() === p1Name.toLowerCase());
      if (match) finalP1Id = match._id;
    }

    let finalP2Id = p2Id;
    if (!finalP2Id) {
      const match = p2Results.find((r) => r.fullName.toLowerCase() === p2Name.toLowerCase());
      if (match) finalP2Id = match._id;
    }

    if (finalP1Id && finalP2Id && finalP1Id === finalP2Id) {
      toast.error("Player 1 and Player 2 must be different people");
      return;
    }

    const payload: RegisterPayloadDoubles = {
      categoryId,
      playerOneId: finalP1Id ? (finalP1Id as Id<"player">) : undefined,
      playerOneName: p1Name,
      playerTwoId: finalP2Id ? (finalP2Id as Id<"player">) : undefined,
      playerTwoName: p2Name,
    };

    const missing: string[] = [];
    if (!finalP1Id) missing.push(p1Name);
    if (!finalP2Id) missing.push(p2Name);

    if (missing.length > 0) {
      setMissingNames(missing);
      setPendingPayload(payload);
      setConfirmOpen(true);
      return;
    }

    // Optimistic: close dialog immediately, fire mutation in background
    resetAndClose();
    toast.promise(registerWithPlayers(payload), {
      loading: "Registering participant...",
      success: () => {
        onSuccess?.();
        return "Participant registered";
      },
      error: (err) => (err instanceof Error ? err.message : "Failed to register participant"),
    });
  };

  const handleConfirm = () => {
    if (!pendingPayload) return;
    const payload = pendingPayload;

    // Optimistic: close dialogs immediately, fire mutation in background
    setConfirmOpen(false);
    resetAndClose();

    toast.promise(registerWithPlayers(payload), {
      loading: "Creating players and registering...",
      success: () => {
        onSuccess?.();
        return "Participant registered";
      },
      error: (err) => (err instanceof Error ? err.message : "Failed to register participant"),
    });
  };

  const handlePlayerValueChange = (val: string, details: { reason: string }) => {
    setPlayerQuery(val);
    if (details.reason === "itemPress") {
      const match = playerResults.find((r) => r.fullName === val);
      setPlayerId(match ? match._id : null);
    } else {
      setPlayerId(null);
    }
  };

  const handleP1ValueChange = (val: string, details: { reason: string }) => {
    setP1Query(val);
    if (details.reason === "itemPress") {
      const match = p1Results.find((r) => r.fullName === val);
      setP1Id(match ? match._id : null);
    } else {
      setP1Id(null);
    }
  };

  const handleP2ValueChange = (val: string, details: { reason: string }) => {
    setP2Query(val);
    if (details.reason === "itemPress") {
      const match = p2Results.find((r) => r.fullName === val);
      setP2Id(match ? match._id : null);
    } else {
      setP2Id(null);
    }
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger
          render={
            <Button variant="secondary">
              <PlusIcon />
              Add Participant
            </Button>
          }
        />
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Register Participant</DialogTitle>
            <DialogDescription>
              {categoryType === "singles"
                ? "Add a player to this singles category."
                : "Add a doubles pair to this category."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {categoryType === "singles" ? (
              <div className="space-y-2">
                <Label className="font-bold">Player *</Label>
                <Autocomplete
                  autoHighlight
                  items={playerOptions}
                  value={playerQuery}
                  onValueChange={(val: string, details: { reason: string }) => {
                    handlePlayerValueChange(val, details);
                  }}
                  filter={null}
                >
                  <AutocompleteInput
                    placeholder="Search or enter player name..."
                    className="w-full"
                    showClear
                    prefix={
                      playerQuery.trim().length > 0 &&
                      !playerResults.some(
                        (r) => r.fullName.toLowerCase() === playerQuery.trim().toLowerCase(),
                      ) ? (
                        <Badge variant="secondary">Create Player</Badge>
                      ) : undefined
                    }
                  />
                  <AutocompleteContent>
                    <AutocompleteList>
                      <AutocompleteEmpty className="text-sm text-muted-foreground">
                        {debouncedPlayer ? "No players found" : "Type to search players"}
                      </AutocompleteEmpty>
                      <AutocompleteCollection>
                        {(item: Option) => (
                          <AutocompleteItem key={item._id} value={item.fullName}>
                            {item._id === "__create__" ? (
                              <span className="text-muted-foreground italic">
                                Create player: {item.fullName}
                              </span>
                            ) : (
                              <>
                                {item.fullName}
                                {item.nickname ? ` (${item.nickname})` : ""}
                              </>
                            )}
                          </AutocompleteItem>
                        )}
                      </AutocompleteCollection>
                    </AutocompleteList>
                  </AutocompleteContent>
                </Autocomplete>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="font-bold">Player 1 *</Label>
                  <Autocomplete
                    autoHighlight
                    items={p1Options}
                    value={p1Query}
                    onValueChange={(val: string, details: { reason: string }) => {
                      handleP1ValueChange(val, details);
                    }}
                    filter={null}
                  >
                    <AutocompleteInput
                      placeholder="Search or enter player name..."
                      className="w-full"
                      showClear
                      prefix={
                        p1Query.trim().length > 0 &&
                        !p1Results.some(
                          (r) => r.fullName.toLowerCase() === p1Query.trim().toLowerCase(),
                        ) ? (
                          <Badge variant="secondary">Create Player</Badge>
                        ) : undefined
                      }
                    />
                    <AutocompleteContent>
                      <AutocompleteList>
                        <AutocompleteEmpty className="text-sm text-muted-foreground">
                          {debouncedP1 ? "No players found" : "Type to search players"}
                        </AutocompleteEmpty>
                        <AutocompleteCollection>
                          {(item: Option) => (
                            <AutocompleteItem key={item._id} value={item.fullName}>
                              {item._id === "__create__" ? (
                                <span className="text-muted-foreground italic">
                                  Create player: {item.fullName}
                                </span>
                              ) : (
                                <>
                                  {item.fullName}
                                  {item.nickname ? ` (${item.nickname})` : ""}
                                </>
                              )}
                            </AutocompleteItem>
                          )}
                        </AutocompleteCollection>
                      </AutocompleteList>
                    </AutocompleteContent>
                  </Autocomplete>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold">Player 2 *</Label>
                  <Autocomplete
                    autoHighlight
                    items={p2Options}
                    value={p2Query}
                    onValueChange={(val: string, details: { reason: string }) => {
                      handleP2ValueChange(val, details);
                    }}
                    filter={null}
                  >
                    <AutocompleteInput
                      placeholder="Search or enter player name..."
                      className="w-full"
                      showClear
                      prefix={
                        p2Query.trim().length > 0 &&
                        !p2Results.some(
                          (r) => r.fullName.toLowerCase() === p2Query.trim().toLowerCase(),
                        ) ? (
                          <Badge variant="secondary">Create Player</Badge>
                        ) : undefined
                      }
                    />
                    <AutocompleteContent>
                      <AutocompleteList>
                        <AutocompleteEmpty className="text-sm text-muted-foreground">
                          {debouncedP2 ? "No players found" : "Type to search players"}
                        </AutocompleteEmpty>
                        <AutocompleteCollection>
                          {(item: Option) => (
                            <AutocompleteItem key={item._id} value={item.fullName}>
                              {item._id === "__create__" ? (
                                <span className="text-muted-foreground italic">
                                  Create player: {item.fullName}
                                </span>
                              ) : (
                                <>
                                  {item.fullName}
                                  {item.nickname ? ` (${item.nickname})` : ""}
                                </>
                              )}
                            </AutocompleteItem>
                          )}
                        </AutocompleteCollection>
                      </AutocompleteList>
                    </AutocompleteContent>
                  </Autocomplete>
                </div>
              </>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="flex-1 font-bold"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 font-bold"
                disabled={
                  categoryType === "singles"
                    ? !playerQuery.trim()
                    : !p1Query.trim() || !p2Query.trim()
                }
                onClick={categoryType === "singles" ? handleSinglesSubmit : handleDoublesSubmit}
              >
                Register
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmCreatePlayersDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        missingNames={missingNames}
        confirmLabel="Create Players & Register"
        onConfirm={handleConfirm}
      />
    </>
  );
}
