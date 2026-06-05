import { getResumeList } from "@/actions/profile.actions";
import { checkRapidApiConfigured } from "@/actions/apiKey.actions";
import { AutomationContainer } from "@/components/automations/AutomationContainer";

export default async function AutomationsPage() {
  const [resumeResult, rapidApiConfigured] = await Promise.all([
    getResumeList(1, 100),
    checkRapidApiConfigured(),
  ]);
  const resumes =
    resumeResult?.data?.map((r: { id: string; title: string }) => ({
      id: r.id,
      title: r.title,
    })) || [];

  return (
    <div className="col-span-3 py-6">
      <AutomationContainer resumes={resumes} rapidApiConfigured={rapidApiConfigured} />
    </div>
  );
}
