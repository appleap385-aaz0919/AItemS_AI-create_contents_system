// 모듈 레벨 상태 변수 + setter (ES module live binding)
export const _apiDebugLog = [];
export let _apiSkip = false;
export let _apiCallId = 0;
export let _lastRateLimitTime = 0;
export let _rateLimitCooldown = 0;
export let _pipelineRunning = false;
export let _apiKey = "";

export function setApiSkip(v) { _apiSkip = v; }
export function incrApiCallId() { return ++_apiCallId; }
export function setLastRateLimitTime(v) { _lastRateLimitTime = v; }
export function setRateLimitCooldown(v) { _rateLimitCooldown = v; }
export function setPipelineRunning(v) { _pipelineRunning = v; }
export function setApiKey(v) { _apiKey = v; }
export function clearDebugLog() { _apiDebugLog.length = 0; }
