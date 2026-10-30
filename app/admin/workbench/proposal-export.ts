export type ProposalChange = { path: string; before: string; after: string; reason?: string };

export type ProposalRun = {
  id: string;
  task_id: string;
  status: string;
  created_at?: string;
  source?: string | null;
  source_hash?: string | null;
  source_version?: number | null;
  summary?: string;
  changes?: ProposalChange[];
  result?: { summary?: string; changes?: ProposalChange[]; next_steps?: string[] };
};

// Preserve the server's provenance; exporting never establishes permission to write.
export function buildProposalExport(run: ProposalRun) {
  const changes = run.result?.changes || run.changes || [];
  const notes = ["待审提案；原业务资料仍以本地项目为准。导出后交给项目对话审阅，核验来源和原文后再回写。官网仍为 snapshot_review，导出不代表已采纳或已回写。"];
  if (!run.source || !run.source_hash || run.source_version == null) notes.push("缺少完整来源凭据，仅供阅读，不可据此回写。");
  if (!changes.length) notes.push("没有文档修改项，仅供阅读，无需回写。");
  return {
    schema_version: 1 as const,
    run_id: run.id,
    task_id: run.task_id,
    status: run.status,
    created_at: run.created_at ?? null,
    source: run.source ?? null,
    source_hash: run.source_hash ?? null,
    source_version: run.source_version ?? null,
    summary: run.result?.summary || run.summary || "",
    changes,
    next_steps: run.result?.next_steps || [],
    note: notes.join(" "),
  };
}
