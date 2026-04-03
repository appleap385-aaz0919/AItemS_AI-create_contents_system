import { _apiKey } from './apiState.js';

export function getApiHeaders() {
  const h = {"Content-Type":"application/json"};
  if(_apiKey) {
    h["x-api-key"] = _apiKey;
    h["anthropic-version"] = "2023-06-01";
    h["anthropic-dangerous-direct-browser-access"] = "true";
  }
  return h;
}
