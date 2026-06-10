"use client";

import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel";
import { useForm } from "@tanstack/react-form";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMutation } from "convex/react";
import { PlusIcon } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { ConfirmCreatePlayersDialog } from "./confirm-create-players-dialog";

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
  nickname?: string;
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

interface CreatePairPayload {
  teamName?: string;
  playerOneId?: Id<"player">;
  playerOneName: string;
  playerTwoId?: Id<"player">;
  playerTwoName: string;
}

export function CreatePlayerPairDialog() {
  const createPairWithPlayers = useMutation(api.app.playerPairs.createWithPlayers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [p1Query, setP1Query] = useState("");
  const [p2Query, setP2Query] = useState("");
  const [p1Id, setP1Id] = useState<string | null>(null);
  const [p2Id, setP2Id] = useState<string | null>(null);

  const debouncedP1 = useDebouncedValue(p1Query);
  const debouncedP2 = useDebouncedValue(p2Query);

  const { data: p1Results = [] } = useQuery({
    ...convexQuery(api.app.players.search, { query: debouncedP1 }),
    placeholderData: keepPreviousData,
  });
  const { data: p2Results = [] } = useQuery({
    ...convexQuery(api.app.players.search, { query: debouncedP2 }),
    placeholderData: keepPreviousData,
  });

  const p1Options = getOptions(p1Results, p1Query);
  const p2Options = getOptions(p2Results, p2Query);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [missingNames, setMissingNames] = useState<string[]>([]);
  const [pendingPayload, setPendingPayload] = useState<CreatePairPayload | null>(null);

  const form = useForm({
    defaultValues: {
      teamName: "",
      player1: "",
      player2: "",
    },
    onSubmit: async ({ value }) => {
      const p1Name = value.player1.trim();
      const p2Name = value.player2.trim();

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

      const payload: CreatePairPayload = {
        teamName: value.teamName.trim() || undefined,
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
      toast.promise(createPairWithPlayers(payload), {
        loading: "Creating player pair...",
        success: "Player pair created",
        error: (err) => (err instanceof Error ? err.message : "Failed to create pair"),
      });
    },
  });

  const resetAndClose = useCallback(() => {
    form.reset();
    setP1Query("");
    setP2Query("");
    setP1Id(null);
    setP2Id(null);
    setMissingNames([]);
    setPendingPayload(null);
    setIsDialogOpen(false);
  }, [form]);

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) resetAndClose();
  };

  const handleConfirm = () => {
    if (!pendingPayload) return;
    const payload = pendingPayload;

    // Optimistic: close dialogs immediately, fire mutation in background
    setConfirmOpen(false);
    resetAndClose();

    toast.promise(createPairWithPlayers(payload), {
      loading: "Creating players and pair...",
      success: "Player pair created",
      error: (err) => (err instanceof Error ? err.message : "Failed to create pair"),
    });
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
              Add Pair
            </Button>
          }
        />
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Player Pair</DialogTitle>
            <DialogDescription>
              Form a new doubles pair from existing or new players.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4 pt-4"
          >
            <form.Field name="teamName">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name} className="font-bold">
                    Team Name
                  </Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Enter team name"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-red-500">{field.state.meta.errors[0]}</p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field
              name="player1"
              validators={{
                onChange: ({ value }) => {
                  if (!value || value.trim().length === 0) {
                    return "Player 1 is required";
                  }
                  return undefined;
                },
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label className="font-bold">Player 1 *</Label>
                  <Autocomplete
                    autoHighlight
                    items={p1Options}
                    value={field.state.value}
                    onValueChange={(val: string, details: { reason: string }) => {
                      field.handleChange(val);
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
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-red-500">{field.state.meta.errors[0]}</p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field
              name="player2"
              validators={{
                onChange: ({ value }) => {
                  if (!value || value.trim().length === 0) {
                    return "Player 2 is required";
                  }
                  return undefined;
                },
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label className="font-bold">Player 2 *</Label>
                  <Autocomplete
                    autoHighlight
                    items={p2Options}
                    value={field.state.value}
                    onValueChange={(val: string, details: { reason: string }) => {
                      field.handleChange(val);
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
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-red-500">{field.state.meta.errors[0]}</p>
                  )}
                </div>
              )}
            </form.Field>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="flex-1 font-bold"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <form.Subscribe selector={(state) => [state.isSubmitting, state.canSubmit]}>
                {([formIsSubmitting, canSubmit]) => (
                  <Button
                    type="submit"
                    className="flex-1 font-bold"
                    disabled={formIsSubmitting || !canSubmit}
                  >
                    {formIsSubmitting ? "Creating..." : "Create Pair"}
                  </Button>
                )}
              </form.Subscribe>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmCreatePlayersDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        missingNames={missingNames}
        onConfirm={handleConfirm}
      />
    </>
  );
}
