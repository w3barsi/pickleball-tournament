import { api } from "@convex/_generated/api.js";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface RequestDeletionDialogProps {
  targetType: "player" | "playerPair";
  targetId: string;
  targetName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RequestDeletionDialog({
  targetType,
  targetId,
  targetName,
  open,
  onOpenChange,
}: RequestDeletionDialogProps) {
  const createRequest = useMutation(api.deletionRequests.create);

  const form = useForm({
    defaultValues: {
      reason: "",
    },
    onSubmit: async ({ value }) => {
      try {
        await createRequest({
          targetType,
          targetId,
          reason: value.reason.trim(),
        });
        form.reset();
        onOpenChange(false);
      } catch (error) {
        if (error instanceof ConvexError) {
          return toast.error(error.message.split("ConvexError:")[1].split("at handler")[0]);
        }
        return toast.error("Failed to create request");
      }
    },
  });

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Deletion</DialogTitle>
          <DialogDescription>
            Submit a request to delete this {targetType === "player" ? "player" : "pair"}. An admin
            will review your request.
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
          <div className="space-y-2">
            <Label className="font-bold">ID</Label>
            <Input value={targetId} disabled />
          </div>

          <div className="space-y-2">
            <Label className="font-bold">Name</Label>
            <Input value={targetName} disabled />
          </div>

          <form.Field
            name="reason"
            validators={{
              onChange: ({ value }) => {
                if (!value || value.trim().length === 0) {
                  return "Reason is required";
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name} className="font-bold">
                  Reason *
                </Label>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter reason for deletion request"
                />
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
              className="flex-1"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <form.Subscribe selector={(state) => [state.isSubmitting, state.canSubmit]}>
              {([isSubmitting, canSubmit]) => (
                <Button type="submit" className="flex-1" disabled={isSubmitting || !canSubmit}>
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
