import test from 'node:test';
import assert from 'node:assert/strict';
import vectors from './vectors/frames.json' with {type:'json'};
import { decodeFrame, encodeFrame, ProtocolError, validatePayload } from '../dist/index.js';
test('canonical protocol vectors',()=>{for(const v of vectors){const bytes=Uint8Array.from(v.hex.match(/../g).map(x=>parseInt(x,16)));if(v.error){assert.throws(()=>decodeFrame(bytes),e=>e instanceof ProtocolError&&e.code===v.error);continue;}const f=decodeFrame(bytes);if(v.payloadError){assert.throws(()=>validatePayload(f.header.frameType,f.payload,f.header),e=>e instanceof ProtocolError&&e.code===v.payloadError);continue;}validatePayload(f.header.frameType,f.payload,f.header);assert.equal(f.header.frameType,v.frameType);assert.deepEqual(f.payload,v.payload);assert.deepEqual(Buffer.from(encodeFrame(f)).toString('hex'),v.hex);}});
