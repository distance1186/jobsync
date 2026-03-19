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
