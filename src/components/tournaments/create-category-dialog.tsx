import { useForm } from "@tanstack/react-form";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { useState } from "react";

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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: {
    name: string;
    type: "singles" | "doubles";
    rating: "beginner" | "intermediate" | "advanced";
    category: "womens" | "mens" | "mixed" | "open";
    maxParticipants?: number;
  }) => Promise<{ error?: string } | void>;
}

const TYPE_OPTIONS = [
  { value: "singles", label: "Singles" },
  { value: "doubles", label: "Doubles" },
] as const;

const RATING_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

const CATEGORY_OPTIONS = [
  { value: "womens", label: "Women's" },
  { value: "mens", label: "Men's" },
  { value: "mixed", label: "Mixed" },
  { value: "open", label: "Open" },
] as const;

export function CreateCategoryDialog({ open, onOpenChange, onCreate }: CreateCategoryDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      name: "",
      type: "singles" as "singles" | "doubles",
      rating: "beginner" as "beginner" | "intermediate" | "advanced",
      category: "open" as "womens" | "mens" | "mixed" | "open",
      maxParticipants: "",
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      const result = await onCreate({
        name: value.name.trim(),
        type: value.type,
        rating: value.rating,
        category: value.category,
        maxParticipants: value.maxParticipants ? Number(value.maxParticipants) : undefined,
      });
      if (result?.error) {
        setServerError(result.error);
        return;
      }
      form.reset();
      onOpenChange(false);
    },
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setServerError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button size="lg" variant="outline">
            <PlusIcon className="size-6 transition-transform group-hover:rotate-90" />
            NEW CATEGORY
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Category</DialogTitle>
          <DialogDescription>Add a new competition category to this tournament.</DialogDescription>
        </DialogHeader>

        <form
          id="create-category"
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
                  <Label htmlFor={field.name}>Category Name *</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="e.g., Men's Doubles Advanced"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm font-medium text-red-600">{field.state.meta.errors[0]}</p>
                  )}
                </div>
              )}
            </form.Field>

            <div className="grid grid-cols-2 gap-4">
              <form.Field name="type">
                {(field) => (
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange(v as "singles" | "doubles")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {TYPE_OPTIONS.find((o) => o.value === field.state.value)?.label}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {TYPE_OPTIONS.map((option) => (
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

              <form.Field name="rating">
                {(field) => (
                  <div className="space-y-2">
                    <Label>Rating</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) =>
                        field.handleChange(v as "beginner" | "intermediate" | "advanced")
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {RATING_OPTIONS.find((o) => o.value === field.state.value)?.label}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {RATING_OPTIONS.map((option) => (
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
              <form.Field name="category">
                {(field) => (
                  <div className="space-y-2">
                    <Label>Gender Category</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) =>
                        field.handleChange(v as "womens" | "mens" | "mixed" | "open")
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {CATEGORY_OPTIONS.find((o) => o.value === field.state.value)?.label}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {CATEGORY_OPTIONS.map((option) => (
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

              <form.Field name="maxParticipants">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Max Players</Label>
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
              <Button form="create-category" type="submit" disabled={isSubmitting || !name.trim()}>
                {isSubmitting ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Category"
                )}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
