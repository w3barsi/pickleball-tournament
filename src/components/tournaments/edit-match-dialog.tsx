"use client";

import { api } from "@convex/_generated/api";
import { Doc, Id } from "@convex/_generated/dataModel";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { CircleAlertIcon, Loader2Icon, PencilIcon } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";

interface EditMatchDialogProps {
  match: Doc<"matches">;
}

const STATUS_OPTIONS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "inProgress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "abandoned", label: "Abandoned" },
] as const;

export function EditMatchDialog({ match }: EditMatchDialogProps) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const updateMatch = useMutation(api.matches.update);

  const form = useForm({
    defaultValues: {
      status: match.status,
      courtNumber: match.courtNumber?.toString() ?? "",
      scheduledAt: match.scheduledAt ? new Date(match.scheduledAt).toISOString().slice(0, 16) : "",
      refereeName: match.refereeName ?? "",
      matchNotes: match.matchNotes ?? "",
      roundNumber: match.roundNumber?.toString() ?? "",
      matchOrder: match.matchOrder?.toString() ?? "",
      numberOfSets: match.numberOfSets?.toString() ?? "3",
      pointsPerGame: match.pointsPerGame?.toString() ?? "11",
      winByTwo: match.winByTwo ?? true,
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      try {
        await updateMatch({
          matchId: match._id,
          status: value.status as "scheduled" | "inProgress" | "completed" | "abandoned",
          courtNumber: value.courtNumber ? Number(value.courtNumber) : undefined,
          scheduledAt: value.scheduledAt ? new Date(value.scheduledAt).getTime() : undefined,
          refereeName: value.refereeName || undefined,
          matchNotes: value.matchNotes || undefined,
          roundNumber: value.roundNumber ? Number(value.roundNumber) : undefined,
          matchOrder: value.matchOrder ? Number(value.matchOrder) : undefined,
          numberOfSets: value.numberOfSets ? Number(value.numberOfSets) : undefined,
          pointsPerGame: value.pointsPerGame ? Number(value.pointsPerGame) : undefined,
          winByTwo: value.winByTwo,
        });
        toast.success("Match updated");
        setOpen(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        setServerError(`Failed to update match: ${message}`);
      }
    },
  });

  useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [open, form]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setServerError(null);
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <PencilIcon className="size-4" />
            Edit Match
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Match</DialogTitle>
          <DialogDescription>Update the details of this match.</DialogDescription>
        </DialogHeader>

        <form
          id="edit-match"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <div className="grid gap-4 py-2">
            <form.Field name="status">
              {(field) => (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(v) =>
                      field.handleChange(
                        v as "scheduled" | "inProgress" | "completed" | "abandoned",
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {STATUS_OPTIONS.find((o) => o.value === field.state.value)?.label}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {STATUS_OPTIONS.map((option) => (
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
            </div>

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

            <form.Field name="matchNotes">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Match Notes</Label>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Optional notes about this match"
                  />
                </div>
              )}
            </form.Field>

            <div className="grid grid-cols-2 gap-4">
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
          <form.Subscribe selector={(state) => [state.isSubmitting] as const}>
            {([isSubmitting]) => (
              <Button form="edit-match" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
