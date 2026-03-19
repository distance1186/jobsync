"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Database,
  TrendingUp,
  Star,
  BarChart3,
  Loader2,
} from "lucide-react";
import type { ScrapedJob } from "@/lib/jobber-db";
import { getScrapedJobs } from "@/actions/scrapedJobs.actions";
import { ScrapedJobsTable } from "./ScrapedJobsTable";

interface ScrapedJobsContainerProps {
  initialJobs: ScrapedJob[];
  initialTotal: number;
  stats: {
    total: number;
    bySource: Record<string, number>;
    byStatus: Record<string, number>;
    avgScore: number;
    highRelevance: number;
  };
}

export function ScrapedJobsContainer({
  initialJobs,
  initialTotal,
  stats,
}: ScrapedJobsContainerProps) {
  const [jobs, setJobs] = useState(initialJobs);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [source, setSource] = useState<string>("");
  const [minScore, setMinScore] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const pageSize = 25;
  const totalPages = Math.ceil(total / pageSize);

  const fetchJobs = (newPage?: number) => {
    startTransition(async () => {
      const result = await getScrapedJobs({
        page: newPage ?? page,
        pageSize,
        source: source || undefined,
        minScore: minScore ? parseInt(minScore) : undefined,
        status: status || undefined,
        search: search || undefined,
      });
      setJobs(result.jobs);
      setTotal(result.total);
      if (newPage) setPage(newPage);
    });
  };

  const handleFilter = () => {
    setPage(1);
    fetchJobs(1);
  };

  const handleReset = () => {
    setSearch("");
    setSource("");
    setMinScore("");
    setStatus("");
    setPage(1);
    startTransition(async () => {
      const result = await getScrapedJobs({ page: 1, pageSize });
      setJobs(result.jobs);
      setTotal(result.total);
    });
  };

  const noConnection = stats.total === 0 && initialJobs.length === 0;

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scraped</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {Object.entries(stats.bySource)
                .map(([s, c]) => `${c} from ${s}`)
                .join(", ") || "No data yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgScore}/10</div>
            <p className="text-xs text-muted-foreground">
              LLM relevance rating
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Relevance</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.highRelevance}</div>
            <p className="text-xs text-muted-foreground">
              Score 7 or higher
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sources</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(stats.bySource).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Object.keys(stats.bySource).join(", ") || "None"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Scraped Jobs</CardTitle>
          <CardDescription>
            Jobs discovered by the Jobber agent, classified by LLM
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFilter()}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dice">Dice</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
              </SelectContent>
            </Select>
            <Select value={minScore} onValueChange={setMinScore}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Min Score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5+ Score</SelectItem>
                <SelectItem value="7">7+ Score</SelectItem>
                <SelectItem value="8">8+ Score</SelectItem>
                <SelectItem value="9">9+ Score</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleFilter} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Filter
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>

          {noConnection ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Database className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No scraped jobs found</h3>
              <p className="text-muted-foreground text-center mt-2 max-w-md">
                Either <code>JOBBER_DATABASE_URL</code> is not configured, or the
                agent hasn&apos;t scraped any jobs yet. Check that the Jobber agent
                is running and connected to the same database.
              </p>
            </div>
          ) : (
            <>
              <ScrapedJobsTable jobs={jobs} onRefresh={() => fetchJobs()} />

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * pageSize + 1}–
                  {Math.min(page * pageSize, total)} of {total}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || isPending}
                    onClick={() => fetchJobs(page - 1)}
                  >
                    Previous
                  </Button>
                  <Badge variant="secondary" className="px-3 py-1">
                    {page} / {totalPages}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || isPending}
                    onClick={() => fetchJobs(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
