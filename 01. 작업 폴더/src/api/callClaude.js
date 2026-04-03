import { _apiSkip, _apiCallId, incrApiCallId, setApiSkip, getRateLimit, setRateLimitFor } from './apiState.js';
import { addLog } from './apiLog.js';

/**
 * @param {string} sys - 시스템 프롬프트
 * @param {string} user - 사용자 프롬프트
 * @param {object} [opts] - 옵션
 * @param {string} [opts.caller] - 호출자 식별 ("generate" | "validate")
 * @param {number} [opts.timeout] - 타임아웃 ms (기본 60000)
 */
export async function callClaude(sys, user, opts = {}) {
  const caller = opts.caller || "default";
  const timeout = opts.timeout || 60000;

  addLog(`[${caller}] API 호출 시작 (프롬프트 ${(sys+user).length}자)`);
  setApiSkip(false);
  const myId = incrApiCallId();

  // 호출자별 Rate limit 쿨다운 (제작팀/검수팀 분리)
  const rl = getRateLimit(caller);
  if (rl.lastTime > 0) {
    const elapsed = Date.now() - rl.lastTime;
    const cooldown = Math.max(0, rl.cooldown - elapsed);
    if (cooldown > 0) {
      addLog(`[${caller}] ⏳ Rate limit 쿨다운 ${Math.ceil(cooldown/1000)}초 대기...`);
      await new Promise(r => setTimeout(r, cooldown));
    }
  }

  return Promise.race([
    _callClaudeInner(sys, user, myId, caller),
    new Promise(resolve => setTimeout(() => {
      if (_apiCallId === myId) addLog(`[${caller}] ⏰ ${timeout/1000}초 타임아웃`);
      resolve(null);
    }, timeout)),
    new Promise(resolve => {
      const iv = setInterval(() => {
        if (_apiSkip) {
          clearInterval(iv);
          addLog(`[${caller}] ⏭️ 건너뛰기 완료 → 로컬 생성으로 전환`);
          resolve(null);
        }
      }, 300);
      setTimeout(() => clearInterval(iv), timeout + 1000);
    })
  ]);
}

async function _callClaudeInner(sys, user, callId, caller) {
  const MAX_ATTEMPTS = 3;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (_apiSkip || callId !== _apiCallId) return null;
    addLog(`[${caller}] 시도 ${attempt+1}/${MAX_ATTEMPTS} — fetch 시작...`);
    try {
      const r = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: sys, user })
      });
      if (_apiSkip || callId !== _apiCallId) return null;
      addLog(`[${caller}] HTTP ${r.status} ${r.statusText}`);

      if (r.status === 429) {
        const backoff = [8000, 15000, 25000][attempt] || 25000;
        setRateLimitFor(caller, Date.now(), backoff);
        addLog(`[${caller}] ⚠️ 429 Rate Limit — ${Math.ceil(backoff/1000)}초 대기 후 재시도`);
        if (attempt < MAX_ATTEMPTS - 1) { await new Promise(r => setTimeout(r, backoff)); continue; }
        return null;
      }
      if (!r.ok) {
        const errBody = await r.text().catch(() => "");
        addLog(`[${caller}] ❌ HTTP 에러 ${r.status}: ${errBody.substring(0,150)}`);
        const wait = r.status >= 500 ? 5000 : 2000;
        if (attempt < MAX_ATTEMPTS - 1) { await new Promise(r => setTimeout(r, wait)); continue; }
        return null;
      }

      // 성공 시 해당 호출자의 rate limit만 리셋
      setRateLimitFor(caller, 0, 0);

      const d = await r.json();
      if (callId !== _apiCallId) return null;
      if (d.error) {
        addLog(`[${caller}] ❌ API 에러: ${(d.error?.message || JSON.stringify(d.error)).substring(0,150)}`);
        if (attempt < MAX_ATTEMPTS - 1) { await new Promise(r => setTimeout(r, 3000)); continue; }
        return null;
      }
      const text = d.text || "";
      if (!text) {
        addLog(`[${caller}] ❌ 응답 텍스트 비어있음`);
        return null;
      }
      if (callId !== _apiCallId) return null;
      addLog(`[${caller}] ✅ 응답 수신 (${text.length}자) ${text.substring(0,60)}...`);
      return text || null;
    } catch (e) {
      if (callId !== _apiCallId) return null;
      addLog(`[${caller}] ❌ ${e.name}: ${e.message}`);
      const backoff = [3000, 6000, 10000][attempt] || 10000;
      if (attempt < MAX_ATTEMPTS - 1) {
        addLog(`[${caller}] ⏳ ${Math.ceil(backoff/1000)}초 후 재시도...`);
        await new Promise(r => setTimeout(r, backoff));
      }
    }
  }
  if (callId === _apiCallId) addLog(`[${caller}] ❌ ${MAX_ATTEMPTS}회 모두 실패`);
  return null;
}
