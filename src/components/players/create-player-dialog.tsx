import { api } from "@convex/_generated/api.js";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

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

const createPlayerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  nickname: z.string(),
});

type CreatePlayerFormData = z.infer<typeof createPlayerSchema>;

export function CreatePlayerDialog() {
  const createPlayer = useMutation(api.players.create);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      nickname: "",
    } as CreatePlayerFormData,
    onSubmit: async ({ value }) => {
      await createPlayer({
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim(),
        nickname: value.nickname.trim(),
      });
      form.reset();
      setIsDialogOpen(false);
    },
  });

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      form.reset();
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="secondary">
            <PlusIcon />
            Add Player
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="">Create New Player</DialogTitle>
          <DialogDescription>Add a new player to the system.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4 pt-4"
        >
          <form.Field
            name="firstName"
            validators={{
              onChange: ({ value }) => {
                if (!value || value.trim().length === 0) {
                  return "First name is required";
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name} className="font-bold">
                  First Name *
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter first name"
                  className="border-2 focus-visible:ring-tournament-blue"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-red-500">{field.state.meta.errors[0]}</p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="lastName"
            validators={{
              onChange: ({ value }) => {
                if (!value || value.trim().length === 0) {
                  return "Last name is required";
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name} className="font-bold">
                  Last Name *
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter last name"
                  className="border-2 focus-visible:ring-tournament-blue"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-red-500">{field.state.meta.errors[0]}</p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="nickname">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name} className="font-bold">
                  Nickname
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter nickname (optional)"
                  className="border-2 focus-visible:ring-tournament-blue"
                />
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
              {([isSubmitting, canSubmit]) => (
                <Button
                  type="submit"
                  className="flex-1 font-bold"
                  disabled={isSubmitting || !canSubmit}
                >
                  {isSubmitting ? "Creating..." : "Create Player"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
