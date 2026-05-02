import { api } from "@convex/_generated/api";
import { Doc, Id } from "@convex/_generated/dataModel";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { CircleAlertIcon, Loader2Icon, PencilIcon, RotateCcwIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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

function ResetMatchDialog({ matchId }: { matchId: Id<"matches"> }) {
  const [open, setOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const resetMatch = useMutation(api.matches.reset);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await resetMatch({ matchId });
      toast.success("Match reset");
      setOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to reset match: ${message}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <p className="text-xs text-muted-foreground">Scores, sets, and results will be cleared.</p>
      <AlertDialogTrigger
        render={
          <Button type="button" variant="outline" className="w-full">
            <RotateCcwIcon className="size-4" />
            Reset
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset Match</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to reset this match? This will clear all scores, sets, and
            results. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setOpen(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleReset} disabled={isResetting} variant="destructive">
            {isResetting ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Resetting...
              </>
            ) : (
              "Reset Match"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

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

        <ResetMatchDialog matchId={match._id} />
        <Separator className="my-2" />

        <form
          id="edit-match"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <FieldGroup className="">
            <form.Field name="status">
              {(field) => (
                <Field>
                  <FieldLabel>Status</FieldLabel>
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
                </Field>
              )}
            </form.Field>

            <FieldGroup className="grid grid-cols-2 gap-4">
              <form.Field name="courtNumber">
                {(field) => (
                  <Field>
                    <FieldLabel>Court Number</FieldLabel>
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
                  </Field>
                )}
              </form.Field>

              <form.Field name="roundNumber">
                {(field) => (
                  <Field>
                    <FieldLabel>Round</FieldLabel>
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
                  </Field>
                )}
              </form.Field>
            </FieldGroup>

            <FieldGroup className="grid grid-cols-2 gap-4">
              <form.Field name="scheduledAt">
                {(field) => (
                  <Field>
                    <FieldLabel>Scheduled At</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="datetime-local"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="matchOrder">
                {(field) => (
                  <Field>
                    <FieldLabel>Match Order</FieldLabel>
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
                  </Field>
                )}
              </form.Field>
            </FieldGroup>

            <form.Field name="refereeName">
              {(field) => (
                <Field>
                  <FieldLabel>Referee Name</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="text"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Optional"
                  />
                </Field>
              )}
            </form.Field>

            <form.Field name="matchNotes">
              {(field) => (
                <Field>
                  <FieldLabel>Match Notes</FieldLabel>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Optional notes about this match"
                  />
                </Field>
              )}
            </form.Field>

            <FieldGroup className="grid grid-cols-2 gap-4">
              <form.Field name="numberOfSets">
                {(field) => (
                  <Field>
                    <FieldLabel>Number of Sets</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      min={1}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="pointsPerGame">
                {(field) => (
                  <Field>
                    <FieldLabel>Points Per Game</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      min={1}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                  </Field>
                )}
              </form.Field>
            </FieldGroup>

            <form.Field name="winByTwo">
              {(field) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id={field.name}
                    name={field.name}
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked === true)}
                  />
                  <FieldLabel htmlFor={field.name} className="cursor-pointer">
                    Win by two (slide-2 scoring)
                  </FieldLabel>
                </Field>
              )}
            </form.Field>

            {serverError && (
              <div className="flex items-center gap-2 rounded-lg border-2 border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-600">
                <CircleAlertIcon /> {serverError}
              </div>
            )}
          </FieldGroup>
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
