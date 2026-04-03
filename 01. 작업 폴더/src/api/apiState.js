// 모듈 레벨 상태 변수 + setter (ES module live binding)
export const _apiDebugLog = [];
export let _apiSkip = false;
export let _apiCallId = 0;
export let _pipelineRunning = false;
export let _apiKey = "";

// 호출자별 rate limit 분리 (제작팀/검수팀 연쇄 폴백 방지)
const _rateLimits = {};

export function getRateLimit(caller = "default") {
  if (!_rateLimits[caller]) {
    _rateLimits[caller] = { lastTime: 0, cooldown: 0 };
  }
  return _rateLimits[caller];
}

export function setRateLimitFor(caller, lastTime, cooldown) {
  if (!_rateLimits[caller]) _rateLimits[caller] = { lastTime: 0, cooldown: 0 };
  _rateLimits[caller].lastTime = lastTime;
  _rateLimits[caller].cooldown = cooldown;
}

// 레거시 호환 (기존 코드에서 직접 참조하는 경우 대비)
export let _lastRateLimitTime = 0;
export let _rateLimitCooldown = 0;

export function setApiSkip(v) { _apiSkip = v; }
export function incrApiCallId() { return ++_apiCallId; }
export function setLastRateLimitTime(v) { _lastRateLimitTime = v; }
export function setRateLimitCooldown(v) { _rateLimitCooldown = v; }
export function setPipelineRunning(v) { _pipelineRunning = v; }
export function setApiKey(v) { _apiKey = v; }
export function clearDebugLog() { _apiDebugLog.length = 0; }
