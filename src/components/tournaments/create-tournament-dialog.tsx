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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: {
    name: string;
    slug: string;
    date: number;
    endDate?: number;
    description?: string;
    organizerName: string;
    venueName?: string;
    venueAddress?: string;
    registrationDeadline?: number;
    isPublic?: boolean;
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
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [isPublic, setIsPublic] = useState<string>("true");
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

  const resetForm = () => {
    setName("");
    setSlug("");
    setSlugManuallyEdited(false);
    setDate("");
    setEndDate("");
    setDescription("");
    setOrganizerName("");
    setVenueName("");
    setVenueAddress("");
    setRegistrationDeadline("");
    setIsPublic("true");
    setError(null);
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
      endDate: endDate ? new Date(endDate).getTime() : undefined,
      description: description.trim() || undefined,
      organizerName: organizerName.trim(),
      venueName: venueName.trim() || undefined,
      venueAddress: venueAddress.trim() || undefined,
      registrationDeadline: registrationDeadline
        ? new Date(registrationDeadline).getTime()
        : undefined,
      isPublic: isPublic === "true",
    });

    setIsSubmitting(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    resetForm();
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button size="lg" variant="outline">
            <PlusIcon className="size-6 transition-transform group-hover:rotate-90" />
            NEW TOURNAMENT
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Tournament</DialogTitle>
          <DialogDescription>
            Set up a new pickleball tournament with date, venue, and organizer details.
          </DialogDescription>
        </DialogHeader>

        <form id="create-tournament" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Tournament Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Summer Pickleball Championships 2026"
                required
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">
                URL Slug *
                <span className="ml-1 text-xs font-light text-neutral-500 normal-case">
                  (auto-generated, can customize)
                </span>
              </Label>
              <Input
                id="slug"
                value={slug}
                onChange={handleSlugChange}
                placeholder="e.g., summer-pickleball-championships-2026"
                required
              />
              <p className="text-xs text-neutral-500">
                Will be used in the URL: /app/tournaments/{slug || "your-slug"}
              </p>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Start Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Organizer */}
            <div className="space-y-2">
              <Label htmlFor="organizer">Organizer Name *</Label>
              <Input
                id="organizer"
                value={organizerName}
                onChange={(e) => setOrganizerName(e.target.value)}
                placeholder="e.g., John Smith"
                className="focus:border-tournament-lime border-2 border-slate-200"
                required
              />
            </div>

            {/* Venue */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="venueName">Venue Name</Label>
                <Input
                  id="venueName"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="e.g., City Pickleball Center"
                />
              </div>
            </div>

            {/* Venue Address */}
            <div className="space-y-2">
              <Label htmlFor="venueAddress">Venue Address</Label>
              <Input
                id="venueAddress"
                value={venueAddress}
                onChange={(e) => setVenueAddress(e.target.value)}
                placeholder="e.g., 123 Main St, City, State"
              />
            </div>

            {/* Registration Deadline + Visibility */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="registrationDeadline">Registration Deadline</Label>
                <Input
                  id="registrationDeadline"
                  type="date"
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select value={isPublic} onValueChange={setIsPublic}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="true">Public</SelectItem>
                      <SelectItem value="false">Private</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional tournament description..."
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
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            form="create-tournament"
            type="submit"
            disabled={
              isSubmitting || !name.trim() || !date || !organizerName.trim() || !slug.trim()
            }
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
