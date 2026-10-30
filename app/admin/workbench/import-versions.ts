export type ImportPackage = { documents: Array<Record<string, unknown>>; tasks: Array<Record<string, unknown>>; goals?: Record<string, unknown> };
export type ImportVersions = { documents: Array<{ path: string; version: number }>; tasks: Array<{ source: string; title: string; version: number }> };

export function prepareImportVersions(pack: ImportPackage, current: ImportVersions): ImportPackage {
  function withVersion(item: Record<string, unknown>, version: number) {
    if (Object.hasOwn(item, "expected_version") && item.expected_version !== version) throw new Error("资料包与现有快照冲突，请重新准备资料包后选择。");
    return { ...item, expected_version: version };
  }
  return {
    ...pack,
    documents: pack.documents.map(doc => withVersion(doc, current.documents.find(item => item.path === doc.path)?.version || 0)),
    tasks: pack.tasks.map(task => {
      // The server trims these fields before deriving the source + newline + title ID.
      const source = typeof task.source === "string" ? task.source.trim() : "", title = String(task.title).trim();
      const withoutId = Object.fromEntries(Object.entries(task).filter(([key]) => key !== "id"));
      return withVersion(withoutId, current.tasks.find(item => item.source === source && item.title === title)?.version || 0);
    }),
  };
}
