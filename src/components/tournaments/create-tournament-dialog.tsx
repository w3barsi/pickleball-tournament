import { Loader2Icon, PlusIcon } from "lucide-react";
import { useState, useEffect } from "react";

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

interface CreateTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: {
    name: string;
    slug: string;
    date: number;
    description?: string;
    organizerName: string;
  }) => Promise<{ error?: string } | void>;
}

export function CreateTournamentDialog({
  open,
  onOpenChange,
  onCreate,
}: CreateTournamentDialogProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from name when name changes (if not manually edited)
  useEffect(() => {
    if (!slugManuallyEdited) {
      setSlug(generateSlug(name));
    }
  }, [name, slugManuallyEdited]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugManuallyEdited(true);
    setSlug(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || !date || !organizerName.trim() || !slug.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const result = await onCreate({
      name: name.trim(),
      slug: slug.trim(),
      date: new Date(date).getTime(),
      description: description.trim() || undefined,
      organizerName: organizerName.trim(),
    });

    setIsSubmitting(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    // Reset form on success
    setName("");
    setSlug("");
    setSlugManuallyEdited(false);
    setDate("");
    setDescription("");
    setOrganizerName("");
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setName("");
      setSlug("");
      setSlugManuallyEdited(false);
      setDate("");
      setDescription("");
      setOrganizerName("");
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button className="group gap-2 rounded-full border-4 border-white bg-tournament-lime px-8 py-6 text-lg font-black tracking-wide text-tournament-blue uppercase shadow-xl transition-all hover:scale-105 hover:text-white hover:shadow-2xl">
            <PlusIcon className="size-6 transition-transform group-hover:rotate-90" />
            NEW TOURNAMENT
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Tournament</DialogTitle>
          <DialogDescription>
            Set up a new pickleball tournament with date and organizer details.
          </DialogDescription>
        </DialogHeader>

        <form id="create-tournament" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-xs font-black tracking-wider text-tournament-blue uppercase"
              >
                Tournament Name *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Summer Pickleball Championships 2026"
                className="border-2 border-slate-200 focus:border-tournament-lime"
                required
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="slug"
                className="text-xs font-black tracking-wider text-tournament-blue uppercase"
              >
                URL Slug *
                <span className="ml-1 font-normal text-slate-500 normal-case">
                  (auto-generated, can customize)
                </span>
              </Label>
              <Input
                id="slug"
                value={slug}
                onChange={handleSlugChange}
                placeholder="e.g., summer-pickleball-championships-2026"
                className="border-2 border-slate-200 focus:border-tournament-lime"
                required
              />
              <p className="text-xs text-slate-500">
                Will be used in the URL: /app/tournaments/{slug || "your-slug"}
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="date"
                className="text-xs font-black tracking-wider text-tournament-blue uppercase"
              >
                Date *
              </Label>
              <div className="relative">
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="border-2 border-slate-200 focus:border-tournament-lime"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="organizer"
                className="text-xs font-black tracking-wider text-tournament-blue uppercase"
              >
                Organizer Name *
              </Label>
              <Input
                id="organizer"
                value={organizerName}
                onChange={(e) => setOrganizerName(e.target.value)}
                placeholder="e.g., John Smith"
                className="border-2 border-slate-200 focus:border-tournament-lime"
                required
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-xs font-black tracking-wider text-tournament-blue uppercase"
              >
                Description
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional tournament description..."
                className="border-2 border-slate-200 focus:border-tournament-lime"
              />
            </div>

            {error && (
              <div className="rounded-lg border-2 border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-600">
                {error}
              </div>
            )}
          </div>
        </form>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="border-2 border-slate-200 font-bold"
          >
            Cancel
          </Button>
          <Button
            form="create-tournament"
            type="submit"
            disabled={
              isSubmitting || !name.trim() || !date || !organizerName.trim() || !slug.trim()
            }
            className="gap-2 bg-tournament-lime font-black tracking-wide text-tournament-blue uppercase hover:bg-tournament-lime/90"
          >
            {isSubmitting ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Tournament"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
