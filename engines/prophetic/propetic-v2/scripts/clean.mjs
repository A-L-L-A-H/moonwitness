import fs from 'node:fs';
for (const p of ['dist','web/dist']) fs.rmSync(p,{recursive:true,force:true});
