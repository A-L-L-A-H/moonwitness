const owner=process.env.ROCKSOUL_OWNER??"bjo163";
const token=process.env.GITHUB_TOKEN??"";
const contractUrl=new URL("../contracts/research-issue-contract.v1.json",import.meta.url);
const {readFile}=await import("node:fs/promises");
const contract=JSON.parse(await readFile(contractUrl,"utf8"));

async function fetchText(repo,path){
  const url=`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=main`;
  const response=await fetch(url,{headers:{
    accept:"application/vnd.github.raw+json",
    "user-agent":"rocksoul-research-issue-certifier/1.0",
    ...(token?{authorization:`Bearer ${token}`}:{})
  },signal:AbortSignal.timeout(20000)});
  if(!response.ok) throw new Error(`${repo}/${path}: HTTP ${response.status}`);
  return response.text();
}
function need(text,value,label){if(!text.includes(value))throw new Error(`${label}: missing ${value}`);}

const checked=[];
for(const [domain,spec] of Object.entries(contract.domains)){
  if(!spec.issue_template_path) continue;
  const template=await fetchText(spec.repository,spec.issue_template_path);
  const label=`${spec.repository}/${spec.issue_template_path}`;
  for(const value of [
    `ROCKSOUL-RESEARCH-CONTRACT:v1`,
    `ROCKSOUL-RESEARCH-DOMAIN:${domain}`,
    `ROCKSOUL-RESEARCH-OWNER:${spec.repository}`,
    "ROCKSOUL-RESEARCH-STATE:discovered",
    "## Research Card",
    "## Research Question",
    "## Source Candidates",
    "## Counterevidence & Uncertainty",
    "## Coverage Gaps / Missing Voices",
    "## Steward Gate",
    "## Machine Metadata",
    spec.hero
  ]) need(template,value,label);
  need(template,`[RESEARCH] ${domain} · `,label);
  if(spec.automated_scout_path){
    const scout=await fetchText(spec.repository,spec.automated_scout_path);
    const scoutLabel=`${spec.repository}/${spec.automated_scout_path}`;
    for(const value of [
      "ROCKSOUL-RESEARCH-CONTRACT:v1",
      `ROCKSOUL-RESEARCH-DOMAIN:${domain}`,
      "ROCKSOUL-RESEARCH-FP:",
      "ROCKSOUL-RESEARCH-STATE:discovered",
      `[AUTO-RESEARCH] ${domain} ·`,
      spec.hero
    ]) need(scout,value,scoutLabel);
  }
  checked.push(domain);
}
console.log(`ROCKSOUL research issue certification passed on main: ${checked.join(", ")}`);
