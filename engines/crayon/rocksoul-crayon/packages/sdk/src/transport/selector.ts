import type { Transport } from '../index.js';
import { WebSocketTransport, type WebSocketTransportOptions } from './websocket.js';
import { WebTransportTransport, type WebTransportOptions } from './webtransport.js';

export type PreferredTransportOptions={readonly webTransport?:WebTransportOptions;readonly webSocket:WebSocketTransportOptions;};
/** Selects by local capability only. It does not fallback after an established transport failure. */
export function createPreferredTransport(options:PreferredTransportOptions):Transport{
  if(options.webTransport&&WebTransportTransport.isAvailable())return new WebTransportTransport(options.webTransport);
  return new WebSocketTransport(options.webSocket);
}
