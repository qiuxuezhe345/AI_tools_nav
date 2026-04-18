import { SubmissionsReviewPanel } from "@/components/admin/submissions-review-panel";
import { getSubmissions, type SubmissionStatus } from "@/lib/admin-submissions";

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status =
    params.status === "approved" || params.status === "rejected"
      ? params.status
      : "pending";
  const data = await getSubmissions(status as SubmissionStatus);

  return (
    <SubmissionsReviewPanel
      submissions={data.submissions}
      counts={data.counts}
      activeStatus={status as SubmissionStatus}
    />
  );
}
