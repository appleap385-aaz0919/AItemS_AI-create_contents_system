import { _apiDebugLog } from './apiState.js';

export function addLog(msg) {
  const t = new Date().toLocaleTimeString("ko-KR",{hour12:false});
  _apiDebugLog.push(`[${t}] ${msg}`);
  if(_apiDebugLog.length > 20) _apiDebugLog.shift();
  console.log("[API]", msg);
  if(window._setApiLog) window._setApiLog([..._apiDebugLog]);
}
