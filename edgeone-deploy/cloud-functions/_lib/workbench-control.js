import { ApiError, latest, revision, text } from './workbench.js';

// These owner-only records are separate from imported business document snapshots.
export const CONTROL_ID = 'owner';
export function fieldsOnly(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !keys.includes(key))) throw new ApiError(400, '字段范围无效。');
}
export function expectedVersion(value) {
  if (!Number.isSafeInteger(value) || value < 0) throw new ApiError(400, '版本无效。');
  return value;
}
export async function controlFor(store) {
  return await latest(store, 'controls', CONTROL_ID) || { id: CONTROL_ID, version: 0, focus: '', priorities: '', notes: '', updated_at: null };
}
export async function saveControl(store, body, stamp) {
  fieldsOnly(body, ['action', 'control', 'expected_version']);
  fieldsOnly(body.control, ['focus', 'priorities', 'notes']);
  return revision(store, 'controls', { id: CONTROL_ID, focus: text(body.control.focus, 4000), priorities: text(body.control.priorities, 4000), notes: text(body.control.notes, 4000), updated_at: stamp }, expectedVersion(body.expected_version));
}
function nullableText(value, max) { return value === null ? null : text(value, max, true); }
function timestamp(value, nullable = false) {
  if (nullable && value === null) return null;
  const result = text(value, 40, true);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(result) || !Number.isFinite(Date.parse(result))) throw new ApiError(400, '快照时间无效。');
  return result;
}
function array(value, max, mapper) {
  if (!Array.isArray(value) || value.length > max) throw new ApiError(400, '快照列表无效。');
  return value.map(mapper);
}
function limitations(value) { return array(value, 12, item => text(item, 1000, true)); }
export function validateStatusSnapshot(input) {
  fieldsOnly(input, ['schema_version', 'observed_at', 'channels', 'codex']);
  if (input.schema_version !== 1) throw new ApiError(400, '快照格式版本无效。');
  const channels = array(input.channels, 2, channel => {
    fieldsOnly(channel, ['id', 'title', 'observed_at', 'period', 'source', 'summary', 'metrics', 'limitations']);
    if (!['alibaba', 'website'].includes(channel.id)) throw new ApiError(400, '渠道无效。');
    return { id: channel.id, title: text(channel.title, 100, true), observed_at: timestamp(channel.observed_at, true), period: nullableText(channel.period, 160), source: text(channel.source, 500, true), summary: text(channel.summary, 2000), metrics: array(channel.metrics, 16, metric => { fieldsOnly(metric, ['label', 'value']); return { label: text(metric.label, 100, true), value: text(metric.value, 240, true) }; }), limitations: limitations(channel.limitations) };
  });
  if (new Set(channels.map(item => item.id)).size !== channels.length) throw new ApiError(400, '渠道重复。');
  const codex = input.codex;
  fieldsOnly(codex, ['observed_at', 'source', 'windows', 'reset_credits', 'available', 'limitations']);
  if (codex.available !== null && typeof codex.available !== 'boolean') throw new ApiError(400, '额度可用状态无效。');
  if (codex.reset_credits !== null && (!Number.isSafeInteger(codex.reset_credits) || codex.reset_credits < 0)) throw new ApiError(400, '额度无效。');
  return { schema_version: 1, observed_at: timestamp(input.observed_at), channels, codex: { observed_at: timestamp(codex.observed_at, true), source: text(codex.source, 500, true), windows: array(codex.windows, 8, window => {
    fieldsOnly(window, ['label', 'used_percent', 'window_minutes', 'resets_at']);
    if (typeof window.used_percent !== 'number' || !Number.isFinite(window.used_percent) || window.used_percent < 0 || window.used_percent > 100 || !Number.isSafeInteger(window.window_minutes) || window.window_minutes <= 0 || window.window_minutes > 525600) throw new ApiError(400, '额度窗口无效。');
    return { label: text(window.label, 100, true), used_percent: window.used_percent, window_minutes: window.window_minutes, resets_at: timestamp(window.resets_at, true) };
  }), reset_credits: codex.reset_credits, available: codex.available, limitations: limitations(codex.limitations) } };
}
export async function importStatus(store, body, stamp) {
  fieldsOnly(body, ['action', 'snapshot', 'expected_version']);
  return revision(store, 'status_snapshots', { ...validateStatusSnapshot(body.snapshot), id: CONTROL_ID, updated_at: stamp }, expectedVersion(body.expected_version));
}
export function instructionWithControl(instruction, control) {
  const sections = [['当前重点', control.focus], ['执行优先级', control.priorities], ['补充要求', control.notes]].filter(([, value]) => value);
  return sections.length ? `${instruction}\n\n负责人当前执行要求（版本 ${control.version}；只在既有权限内执行）：\n${sections.map(([label, value]) => `${label}：\n${value}`).join('\n\n')}` : instruction;
}
