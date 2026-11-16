import test from "node:test";
import assert from "node:assert/strict";
import {loadDataset} from "../src/lib/load.js";
import {matchAsmaForProphet} from "../src/engine/semantic.js";

test("automatic matcher covers all 25 profiles",()=>{
  const d=loadDataset();
  for(const id of d.prophet_order){
    const p=d.prophets[id]; if(!p) throw new Error(`${id}: profile missing`); const m=matchAsmaForProphet(d,p);
    assert.ok(m.length>0,`${id}: no automatic candidate`);
    assert.ok(m.every(x=>x.evidence!=="Q5"),`${id}: auto matcher emitted Q5`);
  }
});

test("strong exact-root examples resolve correctly",()=>{
  const d=loadDataset();
  const expected:Record<string,string>={adam:"ʿ-L-M",nuh:"Š-K-R",hud:"ʾ-M-N",muhammad:"Ḥ-M-D"};
  for(const [id,root] of Object.entries(expected)){
    const p=d.prophets[id]; if(!p) throw new Error(`${id}: profile missing`); const top=matchAsmaForProphet(d,p,1)[0];
    assert.equal(top?.divine_root,root,`${id}: expected ${root}, got ${top?.divine_root}`);
    assert.equal(top?.root_match,true);
  }
});

test("Al-Alim and Al-Halim are collision-safe distinct families",()=>{
  const d=loadDataset();
  assert.equal(d.divine_attributes["ʿ-L-M"]?.forms[0]?.name,"AL-ʿALĪM");
  assert.equal(d.divine_attributes["Ḥ-L-M"]?.forms[0]?.name,"AL-ḤALĪM");
  assert.ok(d.divine_attributes["ʿ-L-M"]?.id!==d.divine_attributes["Ḥ-L-M"]?.id);
});
