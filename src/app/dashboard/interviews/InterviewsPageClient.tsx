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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { createInterview, deleteInterview } from "@/actions/interview.actions";
import { useRouter } from "next/navigation";

interface Interview {
  id: string;
  createdAt: Date;
  jobId: string;
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
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    if (!jobId || !date) {
      toast({ variant: "destructive", title: "Job ID and date are required" });
      return;
    }
    startTransition(async () => {
      const result = await createInterview({
        jobId,
        createdAt: new Date(date),
      });
      if (result?.success) {
        toast({ description: "Interview created successfully" });
        setDialogOpen(false);
        setJobId("");
        setDate("");
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
                <TableHead>Interviewers</TableHead>
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
                    {interview.interviewers.length > 0
                      ? interview.interviewers.map((i) => i.name).join(", ")
                      : "—"}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
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
