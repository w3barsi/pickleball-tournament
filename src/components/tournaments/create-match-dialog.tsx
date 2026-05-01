"use client";

import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { CircleAlertIcon, Loader2Icon, PlusIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BracketParticipant {
  _id: Id<"bracketParticipants">;
  categoryParticipant: {
    _id: Id<"categoryParticipants">;
    player?: { fullName: string } | null;
    pair?: { teamName?: string } | null;
    playerOne?: { fullName: string } | null;
    playerTwo?: { fullName: string } | null;
  };
}

interface CreateMatchDialogProps {
  bracketId: Id<"brackets">;
  bracketParticipants: BracketParticipant[];
  categoryType: "singles" | "doubles";
}

function getParticipantName(bp: BracketParticipant, categoryType: "singles" | "doubles") {
  const cp = bp.categoryParticipant;
  if (categoryType === "singles") {
    return <p>{cp.player?.fullName ?? "Unknown"}</p>;
  }
  return cp.pair?.teamName ? (
    <p>
      {cp.pair.teamName}{" "}
      <span className="text-xs text-muted-foreground">
        {" "}
        {`(${cp.playerOne?.fullName ?? "Unknown"} / ${cp.playerTwo?.fullName ?? "Unknown"})`}
      </span>
    </p>
  ) : (
    `${cp.playerOne?.fullName ?? "Unknown"} / ${cp.playerTwo?.fullName ?? "Unknown"}`
  );
}

export function CreateMatchDialog({
  bracketId,
  bracketParticipants,
  categoryType,
}: CreateMatchDialogProps) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const createMatch = useMutation(api.matches.create);

  const form = useForm({
    defaultValues: {
      participant1Id: "",
      participant2Id: "",
      courtNumber: "",
      roundNumber: "",
      scheduledAt: "",
      refereeName: "",
      matchOrder: "",
      numberOfSets: "3",
      pointsPerGame: "11",
      winByTwo: true,
    },
    onSubmit: async ({ value }) => {
      setServerError(null);

      if (!value.participant1Id || !value.participant2Id) {
        setServerError("Both participants are required");
        return;
      }
      if (value.participant1Id === value.participant2Id) {
        setServerError("Participants must be different");
        return;
      }

      try {
        await createMatch({
          bracketId,
          participant1Id: value.participant1Id as Id<"categoryParticipants">,
          participant2Id: value.participant2Id as Id<"categoryParticipants">,
          courtNumber: value.courtNumber ? Number(value.courtNumber) : undefined,
          roundNumber: value.roundNumber ? Number(value.roundNumber) : undefined,
          scheduledAt: value.scheduledAt ? new Date(value.scheduledAt).getTime() : undefined,
          refereeName: value.refereeName || undefined,
          matchOrder: value.matchOrder ? Number(value.matchOrder) : undefined,
          numberOfSets: value.numberOfSets ? Number(value.numberOfSets) : undefined,
          pointsPerGame: value.pointsPerGame ? Number(value.pointsPerGame) : undefined,
          winByTwo: value.winByTwo,
        });
        toast.success("Match created");
        setOpen(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        setServerError(`Failed to create match: ${message}`);
      }
    },
  });

  useEffect(() => {
    if (open) {
      form.reset();
      setServerError(null);
    }
  }, [open, form]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setServerError(null);
    }
    setOpen(newOpen);
  };

  const participantOptions = bracketParticipants.map((bp) => ({
    value: bp.categoryParticipant._id,
    label: getParticipantName(bp, categoryType),
  }));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="secondary">
            <PlusIcon className="size-4" />
            Create Match
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Match</DialogTitle>
          <DialogDescription>Schedule a match between two participants.</DialogDescription>
        </DialogHeader>

        <form
          id="create-match"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <div className="grid gap-4 py-2">
            <form.Field name="participant1Id">
              {(field) => (
                <div className="space-y-2">
                  <Label>Participant 1 *</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(v) => v !== null && field.handleChange(v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {participantOptions.find((o) => o.value === field.state.value)?.label ??
                          "Select participant..."}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {participantOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>

            <form.Field name="participant2Id">
              {(field) => (
                <div className="space-y-2">
                  <Label>Participant 2 *</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(v) => v !== null && field.handleChange(v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {participantOptions.find((o) => o.value === field.state.value)?.label ??
                          "Select participant..."}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {participantOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>

            <div className="grid grid-cols-2 gap-4">
              <form.Field name="courtNumber">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Court Number</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      min={1}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Optional"
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="roundNumber">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Round</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      min={1}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Optional"
                    />
                  </div>
                )}
              </form.Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <form.Field name="scheduledAt">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Scheduled At</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="datetime-local"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="refereeName">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Referee Name</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="text"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Optional"
                    />
                  </div>
                )}
              </form.Field>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <form.Field name="matchOrder">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Match Order</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      min={1}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Optional"
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="numberOfSets">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Number of Sets</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      min={1}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Default: 3"
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="pointsPerGame">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Points Per Game</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      min={1}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Default: 11"
                    />
                  </div>
                )}
              </form.Field>
            </div>

            <form.Field name="winByTwo">
              {(field) => (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={field.name}
                    name={field.name}
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked === true)}
                  />
                  <Label htmlFor={field.name} className="cursor-pointer">
                    Win by two (slide-2 scoring)
                  </Label>
                </div>
              )}
            </form.Field>

            {serverError && (
              <div className="flex items-center gap-2 rounded-lg border-2 border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-600">
                <CircleAlertIcon /> {serverError}
              </div>
            )}
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <form.Subscribe
            selector={(state) =>
              [
                state.values.participant1Id,
                state.values.participant2Id,
                state.isSubmitting,
              ] as const
            }
          >
            {([p1, p2, isSubmitting]) => (
              <Button form="create-match" type="submit" disabled={isSubmitting || !p1 || !p2}>
                {isSubmitting ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Match"
                )}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
