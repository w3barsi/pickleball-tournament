import { api } from "@convex/_generated/api.js";
import { Doc } from "@convex/_generated/dataModel.js";
import { useMutation } from "convex/react";
import { Loader2Icon, SaveIcon, SettingsIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";

interface AdminEditTournamentDialogProps {
  tournament: Doc<"tournaments">;
}

function tsToDateInput(ts?: number) {
  if (!ts) return "";
  return new Date(ts).toISOString().split("T")[0];
}

function dateInputToTs(val: string) {
  if (!val) return undefined;
  return new Date(val).getTime();
}

export function AdminEditTournamentDialog({ tournament }: AdminEditTournamentDialogProps) {
  const [open, setOpen] = useState(false);
  const updateTournament = useMutation(api.admin.tournaments.update);

  const [name, setName] = useState(tournament.name);
  const [slug, setSlug] = useState(tournament.slug);
  const [date, setDate] = useState(tsToDateInput(tournament.date));
  const [endDate, setEndDate] = useState(tsToDateInput(tournament.endDate));
  const [description, setDescription] = useState(tournament.description ?? "");
  const [organizerName, setOrganizerName] = useState(tournament.organizerName);
  const [venueName, setVenueName] = useState(tournament.venueName ?? "");
  const [venueAddress, setVenueAddress] = useState(tournament.venueAddress ?? "");
  const [bannerImageUrl, setBannerImageUrl] = useState(tournament.bannerImageUrl ?? "");
  const [registrationDeadline, setRegistrationDeadline] = useState(
    tsToDateInput(tournament.registrationDeadline),
  );
  const [isPublic, setIsPublic] = useState(tournament.isPublic ?? false);
  const [status, setStatus] = useState(tournament.status);

  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (open) {
      setName(tournament.name);
      setSlug(tournament.slug);
      setDate(tsToDateInput(tournament.date));
      setEndDate(tsToDateInput(tournament.endDate));
      setDescription(tournament.description ?? "");
      setOrganizerName(tournament.organizerName);
      setVenueName(tournament.venueName ?? "");
      setVenueAddress(tournament.venueAddress ?? "");
      setBannerImageUrl(tournament.bannerImageUrl ?? "");
      setRegistrationDeadline(tsToDateInput(tournament.registrationDeadline));
      setIsPublic(tournament.isPublic ?? false);
      setStatus(tournament.status);
    }
  }, [open, tournament]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await updateTournament({
        tournamentId: tournament._id,
        name: name.trim() || undefined,
        slug: slug.trim() || undefined,
        date: date ? dateInputToTs(date) : undefined,
        endDate: dateInputToTs(endDate),
        description: description.trim() || undefined,
        organizerName: organizerName.trim() || undefined,
        venueName: venueName.trim() || undefined,
        venueAddress: venueAddress.trim() || undefined,
        bannerImageUrl: bannerImageUrl.trim() || undefined,
        registrationDeadline: dateInputToTs(registrationDeadline),
        isPublic,
        status,
      });
      toast.success("Tournament updated");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update tournament");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon">
            <SettingsIcon className="size-4" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Tournament</DialogTitle>
          <DialogDescription>Update tournament details.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="admin-tournament-name">Name</Label>
            <Input
              id="admin-tournament-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tournament name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-tournament-slug">Slug</Label>
            <Input
              id="admin-tournament-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="tournament-slug"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="admin-tournament-date">Start Date</Label>
              <Input
                id="admin-tournament-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-tournament-end-date">End Date</Label>
              <Input
                id="admin-tournament-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-tournament-organizer">Organizer Name</Label>
            <Input
              id="admin-tournament-organizer"
              value={organizerName}
              onChange={(e) => setOrganizerName(e.target.value)}
              placeholder="Organizer name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="admin-tournament-venue-name">Venue Name</Label>
              <Input
                id="admin-tournament-venue-name"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="Venue Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-tournament-venue-address">Venue Address</Label>
              <Input
                id="admin-tournament-venue-address"
                value={venueAddress}
                onChange={(e) => setVenueAddress(e.target.value)}
                placeholder="Venue Address"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-tournament-banner">Banner Image URL</Label>
            <Input
              id="admin-tournament-banner"
              value={bannerImageUrl}
              onChange={(e) => setBannerImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="admin-tournament-registration-deadline">Registration Deadline</Label>
              <Input
                id="admin-tournament-registration-deadline"
                type="date"
                value={registrationDeadline}
                onChange={(e) => setRegistrationDeadline(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-tournament-status">Status</Label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as Doc<"tournaments">["status"])}
              >
                <SelectTrigger id="admin-tournament-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="inProgress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-tournament-description">Description</Label>
            <Textarea
              id="admin-tournament-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional tournament description..."
              className="min-h-[80px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="admin-tournament-public"
              checked={isPublic}
              onCheckedChange={(checked) => setIsPublic(checked === true)}
            />
            <Label htmlFor="admin-tournament-public" className="cursor-pointer">
              Public tournament
            </Label>
          </div>

          <Button type="submit" disabled={isUpdating} className="w-full">
            {isUpdating ? (
              <Loader2Icon className="mr-2 size-4 animate-spin" />
            ) : (
              <SaveIcon className="mr-2 size-4" />
            )}
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
