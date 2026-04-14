import { CalendarIcon, Loader2Icon, PlusIcon } from "lucide-react";
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

interface CreateTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: {
    name: string;
    date: number;
    description?: string;
    organizerName: string;
  }) => void;
  trigger: React.ReactNode;
}

export function CreateTournamentDialog({
  open,
  onOpenChange,
  onCreate,
  trigger,
}: CreateTournamentDialogProps) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || !date || !organizerName.trim()) return;

    setIsSubmitting(true);
    void onCreate({
      name: name.trim(),
      date: new Date(date).getTime(),
      description: description.trim() || undefined,
      organizerName: organizerName.trim(),
    });
    setIsSubmitting(false);

    // Reset form
    setName("");
    setDate("");
    setDescription("");
    setOrganizerName("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setName("");
      setDate("");
      setDescription("");
      setOrganizerName("");
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
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle className="">Create Tournament</DialogTitle>
          <DialogDescription className="">
            Set up a new pickleball tournament with date and organizer details.
          </DialogDescription>
        </DialogHeader>

        <form
          id="create-tournament"
          onSubmit={handleSubmit}
          className="-mx-4 -my-4 flex flex-col gap-5 bg-white p-4"
        >
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
        </form>
        <DialogFooter className="">
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
            disabled={isSubmitting || !name.trim() || !date || !organizerName.trim()}
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
