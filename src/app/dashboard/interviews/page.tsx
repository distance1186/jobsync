import { getInterviews } from "@/actions/interview.actions";
import InterviewsPageClient from "./InterviewsPageClient";

async function InterviewsPage() {
  const result = await getInterviews();
  return <InterviewsPageClient interviews={result?.data ?? []} />;
}

export default InterviewsPage;
