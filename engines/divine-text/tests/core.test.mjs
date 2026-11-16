import assert from 'node:assert/strict';import test from 'node:test';import path from 'node:path';import {fileURLToPath} from 'node:url';import {loadQuran,verifyQuran,searchQuran} from '../src/quran.mjs';import {scoreEvidence} from '../src/score.mjs';import {claims} from '../src/claims.mjs';import {manuscripts} from '../src/manuscripts.mjs';import {identityStatus} from '../src/crosswalk.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('Quran corpus',async()=>{const q=await loadQuran(root);assert.deepEqual(verifyQuran(q),{records:6236,surahs:114,ok:true})});
test('Quran search',async()=>{const q=await loadQuran(root);assert.ok(searchQuran(q,'الله',3).length>0)});
test('Score caps',()=>{assert.equal(scoreEvidence({sourceQuality:20,transmission:25,proximity:20,corroboration:20,interpretationGap:15}).total,100);assert.throws(()=>scoreEvidence({sourceQuality:21,transmission:0,proximity:0,corroboration:0,interpretationGap:0}),RangeError)});
test('Identity stays unresolved',()=>{assert.ok(claims.length>=6);assert.equal(identityStatus('injil').status,'UNRESOLVED')});
test('Manuscript witnesses',()=>{assert.equal(manuscripts.length,3);assert.ok(manuscripts.every(x=>x.sourceUrl))});
