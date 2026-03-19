"use server";

import { getJobberPool, type ScrapedJob } from "@/lib/jobber-db";

interface ScrapedJobsResult {
  jobs: ScrapedJob[];
  total: number;
}

export async function getScrapedJobs(opts?: {
  page?: number;
  pageSize?: number;
  source?: string;
  minScore?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}): Promise<ScrapedJobsResult> {
  const pool = getJobberPool();
  if (!pool) {
    return { jobs: [], total: 0 };
  }

  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 25;
  const offset = (page - 1) * pageSize;
  const sortBy = opts?.sortBy ?? "date_scraped";
  const sortDir = opts?.sortDir ?? "desc";

  // Whitelist sort columns to prevent SQL injection
  const allowedSorts: Record<string, string> = {
    date_scraped: "date_scraped",
    relevance_score: "relevance_score",
    title: "title",
    company: "company",
    source: "source",
    status: "status",
  };
  const sortColumn = allowedSorts[sortBy] || "date_scraped";

  const conditions: string[] = [];
  const params: (string | number)[] = [];
  let paramIdx = 1;

  if (opts?.source) {
    conditions.push(`source = $${paramIdx++}`);
    params.push(opts.source);
  }
  if (opts?.minScore !== undefined) {
    conditions.push(`relevance_score >= $${paramIdx++}`);
    params.push(opts.minScore);
  }
  if (opts?.status) {
    conditions.push(`status = $${paramIdx++}`);
    params.push(opts.status);
  }
  if (opts?.search) {
    conditions.push(
      `(title ILIKE $${paramIdx} OR company ILIKE $${paramIdx} OR description ILIKE $${paramIdx})`
    );
    params.push(`%${opts.search}%`);
    paramIdx++;
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM jobs ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataParams = [...params, pageSize, offset];
    const dataResult = await pool.query(
      `SELECT id, job_id, source, title, company, location, remote, url,
              description, llm_summary, relevance_score, skills,
              date_posted, date_scraped, date_applied, status, notes
       FROM jobs ${where}
       ORDER BY ${sortColumn} ${sortDir === "asc" ? "ASC" : "DESC"}
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      dataParams
    );

    return { jobs: dataResult.rows as ScrapedJob[], total };
  } catch (error) {
    console.error("Failed to fetch scraped jobs:", error);
    return { jobs: [], total: 0 };
  }
}

export async function getScrapedJobById(
  jobId: string
): Promise<ScrapedJob | null> {
  const pool = getJobberPool();
  if (!pool) return null;

  try {
    const result = await pool.query(
      `SELECT id, job_id, source, title, company, location, remote, url,
              description, llm_summary, relevance_score, skills,
              date_posted, date_scraped, date_applied, status, notes
       FROM jobs WHERE job_id = $1`,
      [jobId]
    );
    return (result.rows[0] as ScrapedJob) ?? null;
  } catch (error) {
    console.error("Failed to fetch scraped job:", error);
    return null;
  }
}

export async function updateScrapedJobStatus(
  jobId: string,
  status: string
): Promise<boolean> {
  const pool = getJobberPool();
  if (!pool) return false;

  const validStatuses = [
    "new",
    "reviewed",
    "applied",
    "interview",
    "offer",
    "rejected",
    "archived",
  ];
  if (!validStatuses.includes(status)) return false;

  try {
    await pool.query(`UPDATE jobs SET status = $1 WHERE job_id = $2`, [
      status,
      jobId,
    ]);
    return true;
  } catch (error) {
    console.error("Failed to update scraped job status:", error);
    return false;
  }
}

export async function getScrapedJobStats(): Promise<{
  total: number;
  bySource: Record<string, number>;
  byStatus: Record<string, number>;
  avgScore: number;
  highRelevance: number;
}> {
  const pool = getJobberPool();
  if (!pool) {
    return {
      total: 0,
      bySource: {},
      byStatus: {},
      avgScore: 0,
      highRelevance: 0,
    };
  }

  try {
    const [totalRes, sourceRes, statusRes, scoreRes, highRes] =
      await Promise.all([
        pool.query("SELECT COUNT(*) FROM jobs"),
        pool.query(
          "SELECT source, COUNT(*) as count FROM jobs GROUP BY source"
        ),
        pool.query(
          "SELECT status, COUNT(*) as count FROM jobs GROUP BY status"
        ),
        pool.query(
          "SELECT COALESCE(AVG(relevance_score), 0) as avg FROM jobs"
        ),
        pool.query(
          "SELECT COUNT(*) FROM jobs WHERE relevance_score >= 7"
        ),
      ]);

    const bySource: Record<string, number> = {};
    for (const row of sourceRes.rows) {
      bySource[row.source] = parseInt(row.count, 10);
    }

    const byStatus: Record<string, number> = {};
    for (const row of statusRes.rows) {
      byStatus[row.status] = parseInt(row.count, 10);
    }

    return {
      total: parseInt(totalRes.rows[0].count, 10),
      bySource,
      byStatus,
      avgScore: parseFloat(parseFloat(scoreRes.rows[0].avg).toFixed(1)),
      highRelevance: parseInt(highRes.rows[0].count, 10),
    };
  } catch (error) {
    console.error("Failed to fetch scraped job stats:", error);
    return {
      total: 0,
      bySource: {},
      byStatus: {},
      avgScore: 0,
      highRelevance: 0,
    };
  }
}
