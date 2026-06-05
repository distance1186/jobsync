import { Pool } from "pg";

/**
 * PostgreSQL connection pool for the Jobber agent database.
 * Reads scraped jobs from the agent's `jobs` table.
 *
 * Set JOBBER_DATABASE_URL to connect, e.g.:
 *   JOBBER_DATABASE_URL=postgresql://jobtracker:pass@postgres:5432/jobtracking
 */

let pool: Pool | null = null;

export function getJobberPool(): Pool | null {
  const url = process.env.JOBBER_DATABASE_URL;
  if (!url) {
    return null;
  }
  if (!pool) {
    pool = new Pool({
      connectionString: url,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

export interface ScrapedJob {
  id: number;
  job_id: string;
  source: string;
  title: string | null;
  company: string | null;
  location: string | null;
  remote: boolean;
  url: string | null;
  description: string | null;
  llm_summary: string | null;
  relevance_score: number;
  skills: string[];
  date_posted: string | null;
  date_scraped: string;
  date_applied: string | null;
  status: string;
  notes: string | null;
}

/**
 * Search scraped jobs from Jobber Postgres by keyword and optional location.
 * Intended as the data source for automation runs.
 *
 * Keywords are split on whitespace; any word ≥ 3 chars matching in title OR
 * description qualifies the job as a candidate. OR logic is intentional —
 * the automation's AI match threshold does the real filtering.
 *
 * Location is skipped when empty or when it matches a broad US-wide term.
 *
 * Returns up to 100 jobs sorted by relevance_score DESC, date_scraped DESC.
 * Returns [] if the pool is unavailable.
 */
export async function searchScrapedJobs(
  keywords: string,
  location: string,
  daysBack: number = 30,
): Promise<ScrapedJob[]> {
  const pool = getJobberPool();
  if (!pool) return [];

  const words = keywords
    .trim()
    .split(/\s+/)
    .filter((w) => w.length >= 3);

  const params: (string | number)[] = [daysBack];
  let paramIdx = 2;
  const conditions: string[] = [`date_scraped >= NOW() - ($1 || ' days')::interval`];

  if (words.length > 0) {
    // OR across words: any keyword appearing in title OR description qualifies.
    // The AI match threshold handles precision filtering.
    const wordConds = words.map((w) => {
      params.push(`%${w}%`);
      params.push(`%${w}%`);
      return `(title ILIKE $${paramIdx++} OR description ILIKE $${paramIdx++})`;
    });
    conditions.push(`(${wordConds.join(" OR ")})`);
  }

  const broad = ["united states", "us", "usa", "u.s.", "u.s.a.", "remote", ""];
  const locNorm = location.trim().toLowerCase();
  if (locNorm && !broad.includes(locNorm)) {
    params.push(`%${locNorm}%`);
    conditions.push(`location ILIKE $${paramIdx++}`);
  }

  const sql = `
    SELECT * FROM jobs
    WHERE ${conditions.join(" AND ")}
    ORDER BY relevance_score DESC, date_scraped DESC
    LIMIT 100
  `;

  try {
    const result = await pool.query(sql, params);
    return result.rows as ScrapedJob[];
  } catch (err) {
    console.error("[jobber-db] searchScrapedJobs error:", err);
    return [];
  }
}
