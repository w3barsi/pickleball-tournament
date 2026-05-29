"use client";

import { api } from "@convex/_generated/api";
import { Doc } from "@convex/_generated/dataModel";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { Loader2Icon, SettingsIcon, Trash2Icon } from "lucide-react";
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

interface EditBracketDialogProps {
  bracket: Doc<"brackets">;
  tournamentSlug: string;
  categoryId: string;
}

const FORMAT_OPTIONS = [
  { value: "roundRobin", label: "Round Robin" },
  { value: "singleElimination", label: "Single Elimination" },
] as const;

const STATUS_OPTIONS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "inProgress", label: "In Progress" },
  { value: "completed", label: "Completed" },
] as const;

const LABEL_OPTIONS = Array.from({ length: 26 }, (_, i) => {
  const letter = String.fromCharCode(65 + i);
  return { value: letter, label: letter };
});

export function EditBracketDialog({ bracket, tournamentSlug, categoryId }: EditBracketDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const updateBracket = useMutation(api.app.brackets.update);
  const deleteBracket = useMutation(api.app.brackets.remove);
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      name: bracket.name,
      label: bracket.label ?? "",
      stage: bracket.stage.toString(),
      format: bracket.format as "roundRobin" | "singleElimination",
      status: bracket.status as "upcoming" | "inProgress" | "completed",
      maxParticipants: bracket.maxParticipants?.toString() ?? "",
      numberOfSets: bracket.numberOfSets.toString(),
      pointsPerGame: bracket.pointsPerGame.toString(),
      winByTwo: bracket.winByTwo,
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      try {
        await updateBracket({
          bracketId: bracket._id,
          name: value.name.trim(),
          label: value.label || undefined,
          stage: Number(value.stage),
          format: value.format,
          status: value.status,
          maxParticipants: value.maxParticipants ? Number(value.maxParticipants) : undefined,
          numberOfSets: value.numberOfSets ? Number(value.numberOfSets) : undefined,
          pointsPerGame: value.pointsPerGame ? Number(value.pointsPerGame) : undefined,
          winByTwo: value.winByTwo,
        });
        toast.success("Bracket updated");
        setOpen(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        setServerError(`Failed to update bracket: ${message}`);
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

  const handleDelete = async () => {
    try {
      await deleteBracket({ bracketId: bracket._id });
      toast.success("Bracket deleted");
      setIsDeleteAlertOpen(false);
      setOpen(false);
      navigate({
        to: "/app/tournaments/$slug/categories/$categoryId",
        params: { slug: tournamentSlug, categoryId },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete bracket");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger
          render={
            <Button variant="secondary" size="icon">
              <SettingsIcon />
            </Button>
          }
        />
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Bracket</DialogTitle>
            <DialogDescription>Update the details of this bracket.</DialogDescription>
          </DialogHeader>

          <form
            id="edit-bracket"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <div className="grid gap-4 py-2">
              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) => (!value.trim() ? "Name is required" : undefined),
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Bracket Name *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="e.g., Group A"
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm font-medium text-red-600">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              <div className="grid grid-cols-2 gap-4">
                <form.Field name="format">
                  {(field) => (
                    <div className="space-y-2">
                      <Label>Format</Label>
                      <Select
                        value={field.state.value}
                        onValueChange={(v) =>
                          field.handleChange(v as "roundRobin" | "singleElimination")
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {FORMAT_OPTIONS.find((o) => o.value === field.state.value)?.label}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {FORMAT_OPTIONS.map((option) => (
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

                <form.Field name="status">
                  {(field) => (
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={field.state.value}
                        onValueChange={(v) =>
                          field.handleChange(v as "upcoming" | "inProgress" | "completed")
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <form.Field name="stage">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Stage *</Label>
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

                <form.Field name="maxParticipants">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Max Participants</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        min={1}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="∞"
                      />
                    </div>
                  )}
                </form.Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <form.Field name="label">
                  {(field) => (
                    <div className="space-y-2">
                      <Label>Label</Label>
                      <Select
                        value={field.state.value}
                        onValueChange={(v) => field.handleChange(v ?? "")}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {LABEL_OPTIONS.map((option) => (
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
              </div>

              <div className="grid grid-cols-2 gap-4">
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

                <form.Field name="winByTwo">
                  {(field) => (
                    <div className="flex items-center gap-2 pt-6">
                      <Checkbox
                        id={field.name}
                        name={field.name}
                        checked={field.state.value}
                        onCheckedChange={(checked) => field.handleChange(checked === true)}
                      />
                      <Label htmlFor={field.name} className="cursor-pointer">
                        Win by two
                      </Label>
                    </div>
                  )}
                </form.Field>
              </div>

              {serverError && (
                <div className="rounded-lg border-2 border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-600">
                  {serverError}
                </div>
              )}
            </div>
          </form>
          <DialogFooter className="sm:justify-between">
            <Button variant="destructive" onClick={() => setIsDeleteAlertOpen(true)}>
              <Trash2Icon className="size-4" />
              Delete
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <form.Subscribe
                selector={(state) => [state.values.name, state.isSubmitting] as const}
              >
                {([name, isSubmitting]) => (
                  <Button form="edit-bracket" type="submit" disabled={isSubmitting || !name.trim()}>
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
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bracket</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold">{bracket.name}</span>?
              This action cannot be undone and will also remove all participants and matches.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel render={<Button variant="outline">Cancel</Button>} />
            <AlertDialogAction
              className="gap-2 bg-red-600 tracking-wide text-white hover:bg-red-700"
              onClick={handleDelete}
            >
              <Trash2Icon className="size-4" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
