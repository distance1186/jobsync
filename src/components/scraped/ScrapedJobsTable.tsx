"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  DialogDescription,
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
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ExternalLink,
  MapPin,
  Building2,
  Wifi,
  Loader2,
  PlusCircle,
  Wand2,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import type { ScrapedJob } from "@/lib/jobber-db";
import { updateScrapedJobStatus, addScrapedJobToMyJobs } from "@/actions/scrapedJobs.actions";

const RESUME_TAILOR_URL = process.env.NEXT_PUBLIC_RESUME_TAILOR_URL ?? "http://localhost:5050";

interface ScrapedJobsTableProps {
  jobs: ScrapedJob[];
  onRefresh: () => void;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSort?: (column: string) => void;
}

function ScoreBadge({ score }: { score: number }) {
  let variant: "default" | "secondary" | "outline" | "destructive" = "outline";
  if (score >= 8) variant = "default";
  else if (score >= 6) variant = "secondary";
  else if (score <= 3) variant = "destructive";

  return (
    <Badge variant={variant} className="font-mono">
      {score}/10
    </Badge>
  );
}

function SourceBadge({ source }: { source: string }) {
  const colors: Record<string, string> = {
    dice: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    linkedin: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        colors[source] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
      }`}
    >
      {source}
    </span>
  );
}

export function ScrapedJobsTable({ jobs, onRefresh, sortBy, sortDir, onSort }: ScrapedJobsTableProps) {
  const router = useRouter();
  const [selectedJob, setSelectedJob] = useState<ScrapedJob | null>(null);
  const [isPending, startTransition] = useTransition();

  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy !== col) return <ChevronsUpDown className="ml-1 h-3.5 w-3.5 opacity-50 inline" />;
    return sortDir === "asc"
      ? <ChevronUp className="ml-1 h-3.5 w-3.5 inline" />
      : <ChevronDown className="ml-1 h-3.5 w-3.5 inline" />;
  };

  const handleStatusChange = (jobId: string, newStatus: string) => {
    startTransition(async () => {
      const ok = await updateScrapedJobStatus(jobId, newStatus);
      if (ok) {
        toast({ title: `Status updated to "${newStatus}"` });
        onRefresh();
      } else {
        toast({
          title: "Failed to update status",
          variant: "destructive",
        });
      }
    });
  };

  const handleAddToMyJobs = (job: ScrapedJob) => {
    startTransition(async () => {
      const result = await addScrapedJobToMyJobs(job.job_id);
      if (result.success) {
        toast({ description: `"${job.title}" added to My Jobs` });
        if (result.jobId) router.push(`/dashboard/myjobs/${result.jobId}`);
      } else {
        toast({
          variant: "destructive",
          title: "Failed to add job",
          description: result.message,
        });
      }
    });
  };

  const handleTailorResume = (job: ScrapedJob) => {
    const params = new URLSearchParams({
      title: job.title ?? "",
      company: job.company ?? "",
      description: job.description ?? "",
    });
    window.open(`${RESUME_TAILOR_URL}/prefill?${params.toString()}`, "_blank");
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="w-[30%] cursor-pointer select-none"
              onClick={() => onSort?.("title")}
            >
              Job<SortIcon col="title" />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => onSort?.("company")}
            >
              Company<SortIcon col="company" />
            </TableHead>
            <TableHead>Location</TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => onSort?.("source")}
            >
              Source<SortIcon col="source" />
            </TableHead>
            <TableHead
              className="text-center cursor-pointer select-none"
              onClick={() => onSort?.("relevance_score")}
            >
              Score<SortIcon col="relevance_score" />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => onSort?.("status")}
            >
              Status<SortIcon col="status" />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => onSort?.("date_scraped")}
            >
              Scraped<SortIcon col="date_scraped" />
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.job_id} className="cursor-pointer hover:bg-muted/50">
              <TableCell>
                <div className="flex items-center gap-2">
                  <span
                    className="font-medium hover:underline"
                    onClick={() => setSelectedJob(job)}
                  >
                    {job.title || "Untitled"}
                  </span>
                  {job.remote && (
                    <Wifi className="h-3 w-3 text-green-600" />
                  )}
                  {job.url && (
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                {job.llm_summary && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {job.llm_summary.replace(/^• /, "").split("\n")[0]}
                  </p>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">{job.company || "—"}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">{job.location || "—"}</span>
                </div>
              </TableCell>
              <TableCell>
                <SourceBadge source={job.source} />
              </TableCell>
              <TableCell className="text-center">
                <ScoreBadge score={job.relevance_score} />
              </TableCell>
              <TableCell>
                <Select
                  value={job.status}
                  onValueChange={(v) => handleStatusChange(job.job_id, v)}
                  disabled={isPending}
                >
                  <SelectTrigger className="h-7 w-[110px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="offer">Offer</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {job.date_scraped
                  ? format(new Date(job.date_scraped), "MMM d")
                  : "—"}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    disabled={isPending}
                    onClick={(e) => { e.stopPropagation(); handleAddToMyJobs(job); }}
                    title="Add to My Jobs"
                  >
                    <PlusCircle className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={(e) => { e.stopPropagation(); handleTailorResume(job); }}
                    title="Tailor Resume"
                  >
                    <Wand2 className="h-3 w-3 mr-1" />
                    Tailor
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Job Detail Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedJob && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedJob.title}
                  <ScoreBadge score={selectedJob.relevance_score} />
                </DialogTitle>
                <DialogDescription className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {selectedJob.company}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {selectedJob.location}
                  </span>
                  <SourceBadge source={selectedJob.source} />
                  {selectedJob.remote && (
                    <Badge variant="outline">
                      <Wifi className="h-3 w-3 mr-1" /> Remote
                    </Badge>
                  )}
                </DialogDescription>
              </DialogHeader>

              {selectedJob.llm_summary && (
                <div className="mt-4">
                  <h4 className="font-semibold text-sm mb-2">LLM Summary</h4>
                  <div className="bg-muted rounded-md p-3 text-sm whitespace-pre-line">
                    {selectedJob.llm_summary}
                  </div>
                </div>
              )}

              {selectedJob.skills && selectedJob.skills.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-sm mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedJob.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedJob.description && (
                <div className="mt-4">
                  <h4 className="font-semibold text-sm mb-2">Description</h4>
                  <div className="text-sm text-muted-foreground max-h-[300px] overflow-y-auto whitespace-pre-line">
                    {selectedJob.description}
                  </div>
                </div>
              )}

              {selectedJob.url && (
                <div className="mt-4">
                  <a
                    href={selectedJob.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View original posting
                  </a>
                </div>
              )}
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  disabled={isPending}
                  onClick={() => handleAddToMyJobs(selectedJob)}
                >
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Add to My Jobs
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTailorResume(selectedJob)}
                >
                  <Wand2 className="h-4 w-4 mr-1" />
                  Tailor Resume
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
