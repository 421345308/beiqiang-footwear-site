export type Lease = { run_id: string; started_at: string; last_seen_at: string; lease_expires_at: string };
export function activeLeases(runs: Array<{ id: string; status: string }>, leases: Lease[], now = Date.now()) {
  return leases.filter((lease, index) => Date.parse(lease.lease_expires_at) > now && runs.some(run => run.id === lease.run_id && run.status === "running") && leases.findIndex(item => item.run_id === lease.run_id) === index);
}
export function runDisplayStatus(run: { id: string; status: string }, leases: Lease[]) {
  return run.status === "running" && !leases.some(lease => lease.run_id === run.id && Date.parse(lease.lease_expires_at) > Date.now()) ? "unconfirmed" : run.status;
}
export function quotaRemaining(used: number) { return Math.round((100 - used) * 100) / 100; }
export function windowDuration(minutes: number) {
  return minutes % 1440 === 0 ? `${minutes / 1440} 天` : minutes % 60 === 0 ? `${minutes / 60} 小时` : `${minutes} 分钟`;
}
export function visibleControl<T extends { version: number }>(edited: T, cloud: T | undefined, dirty: boolean, empty: T): T {
  return dirty || edited.version > (cloud?.version || 0) ? edited : cloud || empty;
}
