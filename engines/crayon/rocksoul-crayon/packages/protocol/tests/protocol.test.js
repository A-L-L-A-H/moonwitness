import test from 'node:test';
import assert from 'node:assert/strict';
import { FrameDecoder, FrameType, HEADER_SIZE, MAGIC, Priority, ProtocolError, ProtocolErrorCode, decodeFrame, decodeHeader, encodeFrame, messagePackSerializer, sequenceNext } from '../dist/index.js';

const frame = (sequence=1, payload={}) => ({ header:{ magic:MAGIC, protocolVersion:1, frameType:FrameType.DATA, flags:0, streamId:1, sequence, acknowledgement:0, timestamp:1n, priority:Priority.NORMAL, payloadLength:0 }, payload });

test('header is exactly 36 bytes and round trips',()=>{ const bytes=encodeFrame(frame()); assert.equal(bytes.length,HEADER_SIZE+1); assert.deepEqual(decodeFrame(bytes).payload,{}); assert.equal(decodeHeader(bytes).payloadLength,1); });
test('canonical MessagePack encoding is stable',()=>{ const a=encodeFrame(frame(1,{z:1,a:2})); const b=encodeFrame(frame(1,{a:2,z:1})); assert.deepEqual(a,b); });
test('incremental decoder handles partial and concatenated frames',()=>{ const a=encodeFrame(frame(1,{x:1})), b=encodeFrame(frame(2,{x:2})); const d=new FrameDecoder(); assert.equal(d.push(a.subarray(0,10)).length,0); assert.equal(d.push(new Uint8Array([...a.subarray(10),...b.subarray(0,36)])).length,1); assert.equal(d.push(b.subarray(36)).length,1); });
test('validation is deterministic and fail closed',()=>{ const bytes=encodeFrame(frame()); bytes[0]=0; assert.throws(()=>decodeHeader(bytes),e=>e.code===ProtocolErrorCode.PROTOCOL_CORRUPTED); const huge=encodeFrame(frame()); new DataView(huge.buffer).setUint32(32,0xffffffff); assert.throws(()=>decodeHeader(huge),e=>e.code===ProtocolErrorCode.OVERSIZED_PAYLOAD); });
test('truncated header does not throw native RangeError',()=>assert.throws(()=>decodeHeader(new Uint8Array(35)),e=>e instanceof ProtocolError));
test('sequence exhaustion requires rollover',()=>assert.throws(()=>sequenceNext(0xffffffff),e=>e.code===ProtocolErrorCode.INVALID_SEQUENCE));
