"use client";
import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { createInterview, deleteInterview } from "@/actions/interview.actions";
import { useRouter } from "next/navigation";

const INTERVIEW_TYPES = ["phone", "video", "onsite", "technical"] as const;
const INTERVIEW_STATUSES = ["scheduled", "completed", "cancelled", "no_show"] as const;

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  scheduled: "default",
  completed: "secondary",
  cancelled: "destructive",
  no_show: "outline",
};

interface Interview {
  id: string;
  createdAt: Date;
  jobId: string;
  type?: string | null;
  status?: string | null;
  notes?: string | null;
  job?: {
    id: string;
    JobTitle?: { label: string } | null;
    Company?: { label: string } | null;
  } | null;
  interviewers: { id: string; name: string; email: string }[];
}

interface InterviewsPageClientProps {
  interviews: Interview[];
}

export default function InterviewsPageClient({
  interviews: initial,
}: InterviewsPageClientProps) {
  const router = useRouter();
  const [interviews, setInterviews] = useState(initial);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [jobId, setJobId] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setJobId("");
    setDate("");
    setType("");
    setStatus("");
    setNotes("");
  };

  const handleCreate = () => {
    if (!jobId || !date) {
      toast({ variant: "destructive", title: "Job ID and date are required" });
      return;
    }
    startTransition(async () => {
      const result = await createInterview({
        jobId,
        createdAt: new Date(date),
        type: type || undefined,
        status: status || undefined,
        notes: notes || undefined,
      });
      if (result?.success) {
        toast({ description: "Interview created successfully" });
        setDialogOpen(false);
        resetForm();
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result?.message ?? "Failed to create interview",
        });
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteInterview(id);
      if (result?.success) {
        setInterviews((prev) => prev.filter((i) => i.id !== id));
        toast({ description: "Interview deleted" });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result?.message ?? "Failed to delete interview",
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader className="flex-row justify-between items-center">
        <CardTitle>Interviews</CardTitle>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            New Interview
          </span>
        </Button>
      </CardHeader>
      <CardContent>
        {interviews.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            No interviews yet. Add one to get started.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Interviewers</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {interviews.map((interview) => (
                <TableRow key={interview.id}>
                  <TableCell>
                    {interview.job?.JobTitle?.label ?? "—"}
                  </TableCell>
                  <TableCell>
                    {interview.job?.Company?.label ?? "—"}
                  </TableCell>
                  <TableCell>
                    {format(new Date(interview.createdAt), "PPP")}
                  </TableCell>
                  <TableCell>
                    {interview.type ? (
                      <span className="capitalize text-sm">{interview.type}</span>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    {interview.status ? (
                      <Badge variant={statusVariant[interview.status] ?? "outline"} className="capitalize">
                        {interview.status.replace("_", " ")}
                      </Badge>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    {interview.interviewers.length > 0
                      ? interview.interviewers.map((i) => i.name).join(", ")
                      : "—"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {interview.notes ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isPending}
                      onClick={() => handleDelete(interview.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Interview</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="jobId">Job ID</Label>
              <Input
                id="jobId"
                placeholder="Paste the job ID from My Jobs"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Interview Date</Label>
              <Input
                id="date"
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVIEW_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVIEW_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Interviewer names, topics covered, feedback…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isPending}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
