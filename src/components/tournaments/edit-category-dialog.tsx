"use client";

import { api } from "@convex/_generated/api";
import { Doc } from "@convex/_generated/dataModel";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { Loader2Icon, PencilIcon, Trash2Icon } from "lucide-react";
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

interface EditCategoryDialogProps {
  category: Doc<"categories">;
  tournamentSlug: string;
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

export function EditCategoryDialog({ category, tournamentSlug }: EditCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const updateCategory = useMutation(api.categories.update);
  const deleteCategory = useMutation(api.categories.remove);
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      name: category.name,
      type: category.type,
      rating: category.rating,
      category: category.category,
      maxParticipants: category.maxParticipants?.toString() ?? "",
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      try {
        await updateCategory({
          categoryId: category._id,
          name: value.name.trim(),
          type: value.type,
          rating: value.rating,
          category: value.category,
          maxParticipants: value.maxParticipants ? Number(value.maxParticipants) : undefined,
        });
        toast.success("Category updated");
        setOpen(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        setServerError(`Failed to update category: ${message}`);
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
      await deleteCategory({ categoryId: category._id });
      toast.success("Category deleted");
      setIsDeleteAlertOpen(false);
      setOpen(false);
      navigate({
        to: "/app/tournaments/$slug/categories",
        params: { slug: tournamentSlug },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete category");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger
          render={
            <Button variant="outline" size="sm">
              <PencilIcon className="size-4" />
              Edit
            </Button>
          }
        />
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update the details of this competition category.</DialogDescription>
          </DialogHeader>

          <form
            id="edit-category"
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
                      <p className="text-sm font-medium text-red-600">
                        {field.state.meta.errors[0]}
                      </p>
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
                  <Button
                    form="edit-category"
                    type="submit"
                    disabled={isSubmitting || !name.trim()}
                  >
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
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold">{category.name}</span>
              ? This action cannot be undone and will permanently delete all brackets, participants,
              and matches associated with this category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel render={<Button variant="outline">Cancel</Button>} />
            <AlertDialogAction
              className="gap-2 bg-red-600 tracking-wide text-white uppercase hover:bg-red-700"
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
