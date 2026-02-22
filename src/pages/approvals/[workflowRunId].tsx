import { useRouter } from 'next/router';

export default function ApprovalWorkflowRunPage() {
  const router = useRouter();
  const { workflowRunId } = router.query;
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Approval run</h1>
      <p className="text-muted-foreground mt-2">Workflow run: {String(workflowRunId)}</p>
    </div>
  );
}
