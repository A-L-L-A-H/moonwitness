import fs from "node:fs";
import path from "node:path";
const base=path.resolve(process.cwd(),"data/sqlite/prophet-research-v2.3.sqlite");
for(const suffix of ["","-shm","-wal"]){try{fs.rmSync(base+suffix,{force:true});}catch{}}
console.log(`Removed SQLite read-model files for ${base}`);
