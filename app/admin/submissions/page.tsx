import { SubmissionsReviewPanel } from "@/components/admin/submissions-review-panel";
import { getPendingSubmissions } from "@/lib/admin-submissions";

export default async function AdminSubmissionsPage() {
  const submissions = await getPendingSubmissions();

  return <SubmissionsReviewPanel submissions={submissions} />;
}
