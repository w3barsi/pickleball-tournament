"use client";

import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel.js";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { Loader2Icon, PlusIcon } from "lucide-react";
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

interface CreateBracketDialogProps {
  categoryId: Id<"categories">;
}

const FORMAT_OPTIONS = [
  { value: "roundRobin", label: "Round Robin" },
  { value: "singleElimination", label: "Single Elimination" },
] as const;

const LABEL_OPTIONS = Array.from({ length: 26 }, (_, i) => {
  const letter = String.fromCharCode(65 + i);
  return { value: letter, label: letter };
});

export function CreateBracketDialog({ categoryId }: CreateBracketDialogProps) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const createBracket = useMutation(api.app.brackets.create);

  const form = useForm({
    defaultValues: {
      name: "",
      label: "",
      stage: "1",
      format: "roundRobin" as "roundRobin" | "singleElimination",
      maxParticipants: "",
      numberOfSets: "3",
      pointsPerGame: "11",
      winByTwo: true,
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      try {
        await createBracket({
          categoryId,
          name: value.name.trim(),
          label: value.label || undefined,
          stage: Number(value.stage),
          format: value.format,
          maxParticipants: value.maxParticipants ? Number(value.maxParticipants) : undefined,
          numberOfSets: value.numberOfSets ? Number(value.numberOfSets) : undefined,
          pointsPerGame: value.pointsPerGame ? Number(value.pointsPerGame) : undefined,
          winByTwo: value.winByTwo,
        });
        toast.success("Bracket created");
        setOpen(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        setServerError(`Failed to create bracket: ${message}`);
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="secondary">
            <PlusIcon className="size-4" />
            Create Bracket
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Bracket</DialogTitle>
          <DialogDescription>Add a new bracket stage to this category.</DialogDescription>
        </DialogHeader>

        <form
          id="create-bracket"
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
                    <p className="text-sm font-medium text-red-600">{field.state.meta.errors[0]}</p>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
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
            </div>

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
              <div className="rounded-lg border-2 border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-600">
                {serverError}
              </div>
            )}
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <form.Subscribe selector={(state) => [state.values.name, state.isSubmitting] as const}>
            {([name, isSubmitting]) => (
              <Button form="create-bracket" type="submit" disabled={isSubmitting || !name.trim()}>
                {isSubmitting ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Bracket"
                )}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
