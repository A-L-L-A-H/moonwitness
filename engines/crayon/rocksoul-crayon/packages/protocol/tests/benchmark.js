import { performance } from 'node:perf_hooks';
import { FrameType, MAGIC, Priority, decodeFrame, decodeHeader, encodeFrame, encodeHeader, messagePackSerializer } from '../dist/index.js';
const h={magic:MAGIC,protocolVersion:1,frameType:FrameType.DATA,flags:0,streamId:1,sequence:1,acknowledgement:0,timestamp:1n,priority:Priority.NORMAL,payloadLength:0};
const payload={eventType:'ai.message.delta',data:'x'.repeat(128)}; const frame={header:h,payload}; const n=10_000;
const bench=(name,fn)=>{const t=performance.now();for(let i=0;i<n;i++)fn();console.log(`${name}: ${(n/(performance.now()-t)*1000).toFixed(0)} ops/s`);};
const bytes=encodeFrame(frame); bench('header encode',()=>encodeHeader(h)); bench('header decode',()=>decodeHeader(bytes)); bench('frame encode',()=>encodeFrame(frame)); bench('frame decode',()=>decodeFrame(bytes)); bench('msgpack encode',()=>messagePackSerializer.encode(payload)); bench('msgpack decode',()=>messagePackSerializer.decode(bytes.subarray(36)));
