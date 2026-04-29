import { api } from "@convex/_generated/api.js";
import { Id } from "@convex/_generated/dataModel.js";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InviteManagerFormProps {
  tournamentId: Id<"tournaments">;
}

export function InviteManagerForm({ tournamentId }: InviteManagerFormProps) {
  const inviteManager = useMutation(api.tournaments.inviteManager);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      userId: "",
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      try {
        await inviteManager({
          tournamentId,
          userId: value.userId.trim(),
        });
        form.reset();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to invite manager";
        setServerError(message);
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <div className="flex items-end gap-2">
        <form.Field
          name="userId"
          validators={{
            onChange: ({ value }) => (!value.trim() ? "User ID is required" : undefined),
          }}
        >
          {(field) => (
            <div className="flex-1 space-y-2">
              <Label htmlFor={field.name}>Invite Manager</Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="Paste user's Convex ID..."
                disabled={form.state.isSubmitting}
              />
            </div>
          )}
        </form.Field>
        <form.Subscribe selector={(state) => state.values.userId}>
          {(userId) => (
            <Button type="submit" disabled={form.state.isSubmitting || !userId.trim()}>
              {form.state.isSubmitting ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <PlusIcon className="size-4" />
              )}
              Invite
            </Button>
          )}
        </form.Subscribe>
      </div>
      {serverError && <p className="mt-2 text-sm font-semibold text-red-600">{serverError}</p>}
    </form>
  );
}
