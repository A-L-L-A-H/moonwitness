import test from 'node:test';
import assert from 'node:assert/strict';
import { createPreferredTransport } from '../dist/transport/selector.js';
import { WebSocketTransport } from '../dist/transport/websocket.js';
test('preferred transport falls back only when WebTransport is unavailable',()=>{const transport=createPreferredTransport({webTransport:{url:'https://example.test/aep'},webSocket:{url:'wss://example.test/aep',factory:()=>({readyState:0,binaryType:'',bufferedAmount:0,onopen:null,onmessage:null,onerror:null,onclose:null,send(){},close(){}})}});assert.ok(transport instanceof WebSocketTransport);});
