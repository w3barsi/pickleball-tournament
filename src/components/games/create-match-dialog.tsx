import { Id } from "@convex/_generated/dataModel.js";
import { PlusIcon, TrophyIcon } from "lucide-react";
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

interface CreateMatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: {
    bracketId: Id<"brackets">;
    participant1Id: Id<"categoryParticipants">;
    participant2Id: Id<"categoryParticipants">;
    targetScore: number;
  }) => void;
  // Pre-selected values (optional - for when UI for selecting these is implemented)
  defaultBracketId?: Id<"brackets">;
  defaultParticipant1Id?: Id<"categoryParticipants">;
  defaultParticipant2Id?: Id<"categoryParticipants">;
}

export function CreateMatchDialog({
  open,
  onOpenChange,
  onCreate,
  defaultBracketId,
  defaultParticipant1Id,
  defaultParticipant2Id,
}: CreateMatchDialogProps) {
  const [bracketId, setBracketId] = useState(defaultBracketId || "");
  const [participant1Id, setParticipant1Id] = useState(defaultParticipant1Id || "");
  const [participant2Id, setParticipant2Id] = useState(defaultParticipant2Id || "");
  const [targetScore, setTargetScore] = useState(11);

  const handleSubmit = () => {
    if (!bracketId || !participant1Id || !participant2Id) {
      return; // Require all fields
    }

    onCreate({
      bracketId: bracketId as Id<"brackets">,
      participant1Id: participant1Id as Id<"categoryParticipants">,
      participant2Id: participant2Id as Id<"categoryParticipants">,
      targetScore: targetScore || 11,
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      // Reset form when closing
      setBracketId(defaultBracketId || "");
      setParticipant1Id(defaultParticipant1Id || "");
      setParticipant2Id(defaultParticipant2Id || "");
      setTargetScore(11);
    }
  };

  const isValid = bracketId && participant1Id && participant2Id;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button className="group bg-tournament-lime text-tournament-blue gap-2 rounded-full border-4 border-white px-8 py-6 text-lg font-black tracking-wide uppercase shadow-xl transition-all hover:scale-105 hover:shadow-2xl">
            <PlusIcon className="size-6 transition-transform group-hover:rotate-90" />
            NEW MATCH
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="">CREATE MATCH</DialogTitle>
          <DialogDescription>Set up a pickleball match</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label
              htmlFor="bracketId"
              className="text-tournament-blue text-sm font-bold tracking-wider uppercase"
            >
              Bracket ID
            </Label>
            <Input
              id="bracketId"
              value={bracketId}
              onChange={(e) => setBracketId(e.target.value)}
              placeholder="Enter bracket ID"
              className="border-tournament-blue border-2 font-semibold"
            />
            <p className="text-xs text-muted-foreground">The bracket this match belongs to</p>
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="participant1"
              className="text-tournament-blue text-sm font-bold tracking-wider uppercase"
            >
              Participant 1 ID
            </Label>
            <Input
              id="participant1"
              value={participant1Id}
              onChange={(e) => setParticipant1Id(e.target.value)}
              placeholder="Enter participant 1 ID"
              className="border-tournament-blue border-2 font-semibold"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="participant2"
              className="text-tournament-blue text-sm font-bold tracking-wider uppercase"
            >
              Participant 2 ID
            </Label>
            <Input
              id="participant2"
              value={participant2Id}
              onChange={(e) => setParticipant2Id(e.target.value)}
              placeholder="Enter participant 2 ID"
              className="border-tournament-blue border-2 font-semibold"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="targetScore"
              className="text-tournament-blue text-sm font-bold tracking-wider uppercase"
            >
              Winning Score
            </Label>
            <Input
              id="targetScore"
              type="number"
              value={targetScore}
              onChange={(e) => setTargetScore(parseInt(e.target.value) || 11)}
              min={1}
              className="border-tournament-blue border-2 text-xl font-black"
            />
            <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
              Win by 2 points
            </p>
          </div>
        </div>
        <DialogFooter className="gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="border-2 font-bold uppercase"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            className="bg-tournament-lime text-tournament-blue gap-2 font-black tracking-wide uppercase disabled:opacity-50"
          >
            <TrophyIcon className="size-4" />
            Create Match
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
