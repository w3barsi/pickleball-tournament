import { TrophyIcon } from "lucide-react";
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

interface CreateGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: { team1Name: string; team2Name: string; targetScore: number }) => void;
  trigger?: React.ReactElement;
}

export function CreateGameDialog({ open, onOpenChange, onCreate, trigger }: CreateGameDialogProps) {
  const [team1Name, setTeam1Name] = useState("Team 1");
  const [team2Name, setTeam2Name] = useState("Team 2");
  const [targetScore, setTargetScore] = useState(11);

  const handleSubmit = () => {
    onCreate({
      team1Name: team1Name || "Team 1",
      team2Name: team2Name || "Team 2",
      targetScore: targetScore || 11,
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      // Reset form when closing
      setTeam1Name("Team 1");
      setTeam2Name("Team 2");
      setTargetScore(11);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="">
          <DialogTitle className="">CREATE MATCH</DialogTitle>
          <DialogDescription className="font-semibold text-white/80">
            Set up your pickleball doubles game
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label
              htmlFor="team1"
              className="text-sm font-bold tracking-wider text-tournament-blue uppercase"
            >
              Team 1 Name
            </Label>
            <Input
              id="team1"
              value={team1Name}
              onChange={(e) => setTeam1Name(e.target.value)}
              placeholder="Team 1"
              className="border-2 border-tournament-blue font-semibold"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="team2"
              className="text-sm font-bold tracking-wider text-tournament-blue uppercase"
            >
              Team 2 Name
            </Label>
            <Input
              id="team2"
              value={team2Name}
              onChange={(e) => setTeam2Name(e.target.value)}
              placeholder="Team 2"
              className="border-2 border-tournament-blue font-semibold"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="targetScore"
              className="text-sm font-bold tracking-wider text-tournament-blue uppercase"
            >
              Winning Score
            </Label>
            <Input
              id="targetScore"
              type="number"
              value={targetScore}
              onChange={(e) => setTargetScore(parseInt(e.target.value) || 11)}
              min={1}
              className="border-2 border-tournament-blue text-xl font-black"
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
            className="gap-2 bg-tournament-lime font-black tracking-wide text-tournament-blue uppercase"
          >
            <TrophyIcon className="size-4" />
            Create Game
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
