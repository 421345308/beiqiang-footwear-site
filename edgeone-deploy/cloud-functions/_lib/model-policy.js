import { ApiError } from './workbench.js';

export const DEFAULT_MODEL = 'gpt-6.1-sol';
export const SUPPORTED_MODELS = [DEFAULT_MODEL, 'gpt-6-luna'];

export function requestedModel(value) {
  if (value === undefined) return DEFAULT_MODEL;
  if (!SUPPORTED_MODELS.includes(value)) throw new ApiError(400, '请选择受支持的执行模型。');
  return value;
}

export function runnerModels(capabilities) {
  const declared = Array.isArray(capabilities?.models) ? capabilities.models : [capabilities?.model];
  return [...new Set(declared.filter(model => SUPPORTED_MODELS.includes(model)))];
}

export function eligibleRunner(capabilities) {
  return capabilities?.ready === true && ['chatgpt', 'api'].includes(capabilities?.auth) && runnerModels(capabilities).length > 0;
}
