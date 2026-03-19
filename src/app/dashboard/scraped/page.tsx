import { Metadata } from "next";

import { getScrapedJobs, getScrapedJobStats } from "@/actions/scrapedJobs.actions";
import { ScrapedJobsContainer } from "@/components/scraped/ScrapedJobsContainer";

export const metadata: Metadata = {
  title: "Scraped Jobs | JobSync",
};

async function ScrapedJobsPage() {
  const [{ jobs, total }, stats] = await Promise.all([
    getScrapedJobs({ page: 1, pageSize: 25 }),
    getScrapedJobStats(),
  ]);

  return (
    <div className="col-span-3">
      <ScrapedJobsContainer
        initialJobs={jobs}
        initialTotal={total}
        stats={stats}
      />
    </div>
  );
}

export default ScrapedJobsPage;
