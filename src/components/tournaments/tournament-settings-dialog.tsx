import { api } from "@convex/_generated/api.js";
import { Doc } from "@convex/_generated/dataModel.js";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { Loader2Icon, SaveIcon, SettingsIcon, Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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

interface TournamentSettingsDialogProps {
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

export function TournamentSettingsDialog({ tournament }: TournamentSettingsDialogProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const updateTournament = useMutation(api.app.tournaments.update);
  const deleteTournament = useMutation(api.app.tournaments.remove);

  const [name, setName] = useState(tournament.name);
  const [date, setDate] = useState(tsToDateInput(tournament.date));
  const [endDate, setEndDate] = useState(tsToDateInput(tournament.endDate));
  const [description, setDescription] = useState(tournament.description ?? "");
  const [organizerName, setOrganizerName] = useState(tournament.organizerName);
  const [venueName, setVenueName] = useState(tournament.venueName ?? "");
  const [venueAddress, setVenueAddress] = useState(tournament.venueAddress ?? "");
  const [registrationDeadline, setRegistrationDeadline] = useState(
    tsToDateInput(tournament.registrationDeadline),
  );
  const [isPublic, setIsPublic] = useState(tournament.isPublic ?? false);
  const [status, setStatus] = useState(tournament.status);

  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(tournament.name);
      setDate(tsToDateInput(tournament.date));
      setEndDate(tsToDateInput(tournament.endDate));
      setDescription(tournament.description ?? "");
      setOrganizerName(tournament.organizerName);
      setVenueName(tournament.venueName ?? "");
      setVenueAddress(tournament.venueAddress ?? "");
      setRegistrationDeadline(tsToDateInput(tournament.registrationDeadline));
      setIsPublic(tournament.isPublic ?? false);
      setStatus(tournament.status);
      setDeleteConfirmText("");
    }
  }, [open, tournament]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await updateTournament({
        tournamentId: tournament._id,
        name: name.trim() || undefined,
        date: date ? dateInputToTs(date) : undefined,
        endDate: dateInputToTs(endDate),
        description: description.trim() || undefined,
        organizerName: organizerName.trim() || undefined,
        venueName: venueName.trim() || undefined,
        venueAddress: venueAddress.trim() || undefined,
        registrationDeadline: dateInputToTs(registrationDeadline),
        isPublic,
        status,
      });
      toast.success("Tournament updated");
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
          <Button variant="secondary" size="icon">
            <SettingsIcon />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tournament Settings</DialogTitle>
          <DialogDescription>Configure your tournament.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="tournament-name">Name</Label>
            <Input
              id="tournament-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tournament name"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tournament-date">Start Date</Label>
              <Input
                id="tournament-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tournament-end-date">End Date</Label>
              <Input
                id="tournament-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Organizer */}
          <div className="space-y-2">
            <Label htmlFor="tournament-organizer">Organizer Name</Label>
            <Input
              id="tournament-organizer"
              value={organizerName}
              onChange={(e) => setOrganizerName(e.target.value)}
              placeholder="Organizer name"
            />
          </div>

          {/* Venue */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tournament-venue-name">Venue Name</Label>
              <Input
                id="tournament-venue-name"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="Venue Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tournament-venue-address">Venue Address</Label>
              <Input
                id="tournament-venue-address"
                value={venueAddress}
                onChange={(e) => setVenueAddress(e.target.value)}
                placeholder="Venue Address"
              />
            </div>
          </div>

          {/* Registration deadline + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tournament-registration-deadline">Registration Deadline</Label>
              <Input
                id="tournament-registration-deadline"
                type="date"
                value={registrationDeadline}
                onChange={(e) => setRegistrationDeadline(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tournament-status">Status</Label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as Doc<"tournaments">["status"])}
              >
                <SelectTrigger id="tournament-status" className="w-full">
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

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="tournament-description">Description</Label>
            <Textarea
              id="tournament-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional tournament description..."
              className="min-h-[80px]"
            />
          </div>

          {/* Public */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="tournament-public"
              checked={isPublic}
              onCheckedChange={(checked) => setIsPublic(checked === true)}
            />
            <Label htmlFor="tournament-public" className="cursor-pointer">
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

        <div className="space-y-4 py-2">
          {/* Danger Zone */}
          <div className="-mx-4 -my-6 mt-4 flex flex-col gap-2 rounded-b-xl bg-destructive/10 p-4">
            <div>
              <h4 className="text-sm font-semibold text-red-600">Danger Zone</h4>
            </div>

            <div className="flex flex-col gap-2 pb-2">
              <p className="text-sm text-muted-foreground">
                Please type "<span className="font-semibold">{tournament.name}</span>" to confirm.
              </p>
              <Input
                className="bg-primary-foreground"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={`Type "${tournament.name}" to confirm`}
              />
            </div>
            <AlertDialog>
              <AlertDialogTrigger
                disabled={deleteConfirmText !== tournament.name}
                render={
                  <Button variant="destructive" className="w-full rounded-md">
                    <Trash2Icon className="mr-2 size-4" />
                    Delete Tournament
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Tournament</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you really sure you want to delete this tournament? This action cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={isDeleting}
                    onClick={async () => {
                      setIsDeleting(true);
                      try {
                        await deleteTournament({ tournamentId: tournament._id });
                        setDeleteConfirmText("");
                        navigate({ to: "/app/tournaments" });
                      } finally {
                        setIsDeleting(false);
                      }
                    }}
                  >
                    {isDeleting ? <Loader2Icon className="size-4 animate-spin" /> : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
