// Builds docs/FLOW_REPORT.md and docs/flow-report.html from docs/flow-report.data.json.
// Run: node docs/build-flow-report.cjs
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const data = JSON.parse(fs.readFileSync(path.join(dir, 'flow-report.data.json'), 'utf8'));

const LABEL = { done: 'Done', part: 'Partly done', missing: 'Not done', hold: 'On hold', unverified: 'Built, not confirmed' };
const ORDER = ['done', 'unverified', 'part', 'hold', 'missing'];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const totals = Object.fromEntries(ORDER.map((k) => [k, 0]));
for (const f of data.flows) for (const s of f.steps) totals[s.status]++;
const total = ORDER.reduce((a, k) => a + totals[k], 0);

/* ---------- Markdown ---------- */
let md = `# Website flow report (${data.date})\n\nWhat a shop like Akrinity needs, step by step, what the site does today, and what the tests found. ${total} steps in ${data.flows.length} flows.\n\n`;
md += `**Score:** ${ORDER.map((k) => `${LABEL[k]} ${totals[k]}`).join(' · ')}\n\n## Tests run\n\n| Test | Result | Where |\n|---|---|---|\n`;
for (const t of data.tests) md += `| ${t.name} | ${t.result} | ${t.where} |\n`;
for (const f of data.flows) {
  md += `\n## ${f.name}\n\n_${f.goal}_\n\n| Step | A good shop | Akrinity today | Status | Test |\n|---|---|---|---|---|\n`;
  for (const s of f.steps) md += `| ${s.step} | ${s.ideal} | ${s.site} | ${LABEL[s.status]} | ${s.test} |\n`;
}
md += `\n## Email templates\n\n| Email | State | Note |\n|---|---|---|\n`;
for (const e of data.emails) md += `| ${e.name} | ${e.status} | ${e.note} |\n`;
md += `\n## Still to do\n\n### You (the owner)\n${data.pending.you.map((x) => `- [ ] ${x}`).join('\n')}\n\n### Backend team\n${data.pending.backend.map((x) => `- [ ] ${x}`).join('\n')}\n\n### Frontend (Claude)\n${data.pending.frontend.map((x) => `- [ ] ${x}`).join('\n')}\n`;
fs.writeFileSync(path.join(dir, 'FLOW_REPORT.md'), md);

/* ---------- HTML ---------- */
const bar = (f) => {
  const n = f.steps.length;
  return '<span class="bar" aria-hidden="true">' + ORDER.map((k) => {
    const c = f.steps.filter((s) => s.status === k).length;
    return c ? `<i class="s-${k}" style="flex:${c}"></i>` : '';
  }).join('') + '</span>';
};
const pill = (k) => `<span class="pill p-${k}">${LABEL[k]}</span>`;
const flowHtml = data.flows.map((f) => {
  const rows = f.steps.map((s) => `<tr><th scope="row">${esc(s.step)}</th><td>${esc(s.ideal)}</td><td>${esc(s.site)}</td><td>${pill(s.status)}</td><td>${esc(s.test)}</td></tr>`).join('');
  const counts = ORDER.map((k) => ({ k, c: f.steps.filter((s) => s.status === k).length })).filter((x) => x.c).map((x) => `${x.c} ${LABEL[x.k].toLowerCase()}`).join(', ');
  return `<details class="flow" id="${f.id}"><summary><span class="fn">${esc(f.name)}</span>${bar(f)}<span class="fc">${counts}</span></summary>
<p class="goal">${esc(f.goal)}</p><div class="tw"><table><thead><tr><th>Step</th><th>A good shop</th><th>Akrinity today</th><th>Status</th><th>Test</th></tr></thead><tbody>${rows}</tbody></table></div></details>`;
}).join('\n');
const testsHtml = data.tests.map((t) => `<tr><th scope="row">${esc(t.name)}</th><td>${esc(t.result)}</td><td>${esc(t.where)}</td></tr>`).join('');
const emailsHtml = data.emails.map((e) => `<tr><th scope="row">${esc(e.name)}</th><td>${esc(e.status)}</td><td>${esc(e.note)}</td></tr>`).join('');
const list = (a) => '<ul class="todo">' + a.map((x) => `<li>${esc(x)}</li>`).join('') + '</ul>';
const scoreHtml = ORDER.map((k) => `<div class="sc"><b class="n-${k}">${totals[k]}</b><span>${LABEL[k]}</span></div>`).join('');
const legend = ORDER.map((k) => `<span><i class="s-${k}"></i>${LABEL[k]}</span>`).join('');

const html = `<title>Website flow report</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&display=swap">
<style>
  /* Layout: a score row, one expandable card per flow, then emails and the to-do lists. Brand tokens from the guideline. */
  :root{--bg:#F3F1EA;--panel:#FFFFFF;--fg:#0B0B0C;--muted:#55514A;--line:#D9D5C8;--accent:#D8FF3A;--accent-fg:#0B0B0C;--violet:#5B2BE0;
    --done:#2E8B3D;--unv:#5B2BE0;--part:#E0A000;--hold:#8A857A;--miss:#D92D20;--d:"Anton",Impact,"Arial Narrow",sans-serif;--b:"Inter","Segoe UI",system-ui,sans-serif}
  @media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0B0B0C;--panel:#17171A;--fg:#F3F1EA;--muted:#B8B4A8;--line:#34343A;--done:#58C46A;--unv:#9B7BFF;--part:#F2B93B;--hold:#9A958A;--miss:#FF6B5E;color-scheme:dark}}
  :root[data-theme="dark"]{--bg:#0B0B0C;--panel:#17171A;--fg:#F3F1EA;--muted:#B8B4A8;--line:#34343A;--done:#58C46A;--unv:#9B7BFF;--part:#F2B93B;--hold:#9A958A;--miss:#FF6B5E;color-scheme:dark}
  *{box-sizing:border-box}
  body{background:var(--bg);color:var(--fg);font:15px/1.5 var(--b);padding-block:28px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
  .page{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1fr);gap:26px}
  .page>*,.flow,.card{min-width:0}
  h1{font:400 clamp(38px,6vw,60px)/1 var(--d);text-transform:uppercase;margin:0;text-wrap:balance}
  h1 mark{background:var(--accent);color:var(--accent-fg);padding:0 .18em}
  h2{font:400 30px/1.1 var(--d);text-transform:uppercase;margin:0 0 12px}
  .lede{color:var(--muted);max-width:70ch;margin:10px 0 0}
  .score{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}
  .sc{background:var(--panel);border:1.5px solid var(--fg);border-radius:18px;padding:14px 16px;display:grid;gap:2px}
  .sc b{font:400 44px/1 var(--d)}.sc span{color:var(--muted);font-size:13px}
  .n-done{color:var(--done)}.n-unverified{color:var(--unv)}.n-part{color:var(--part)}.n-hold{color:var(--hold)}.n-missing{color:var(--miss)}
  .legend{display:flex;flex-wrap:wrap;gap:6px 18px;color:var(--muted);font-size:13px}
  .legend i,.bar i{display:inline-block}.legend i{width:12px;height:12px;border-radius:3px;margin-right:6px;vertical-align:-1px}
  .s-done{background:var(--done)}.s-unverified{background:var(--unv)}.s-part{background:var(--part)}.s-hold{background:var(--hold)}.s-missing{background:var(--miss)}
  .card{background:var(--panel);border:1.5px solid var(--fg);border-radius:22px;padding:20px 22px}
  .tw{overflow-x:auto}
  table{border-collapse:collapse;width:100%;font-size:14px}
  th,td{text-align:left;vertical-align:top;padding:9px 10px;border-bottom:1px solid var(--line)}
  thead th{font:600 11.5px/1.2 var(--b);letter-spacing:.07em;text-transform:uppercase;color:var(--muted);white-space:nowrap}
  tbody th{font-weight:600;min-width:150px}
  td{min-width:150px}
  .flow{background:var(--panel);border:1.5px solid var(--fg);border-radius:22px;padding:4px 20px 16px}
  .flow+.flow{margin-top:12px}
  .flow summary{cursor:pointer;list-style:none;display:grid;grid-template-columns:minmax(170px,.9fr) minmax(120px,1.2fr) minmax(0,1.4fr);gap:8px 18px;align-items:center;padding:14px 0}
  .flow summary::-webkit-details-marker{display:none}
  .flow summary:focus-visible{outline:3px solid var(--violet);outline-offset:4px;border-radius:8px}
  .fn{font:400 24px/1.1 var(--d);text-transform:uppercase}
  .fc{color:var(--muted);font-size:13px}
  .bar{display:flex;height:12px;border-radius:6px;overflow:hidden;gap:2px}.bar i{height:100%}
  .goal{margin:0 0 10px;color:var(--muted)}
  .pill{display:inline-block;padding:2px 10px;border-radius:999px;font-weight:600;font-size:12.5px;white-space:nowrap;border:1.5px solid currentColor}
  .p-done{color:var(--done)}.p-unverified{color:var(--unv)}.p-part{color:var(--part)}.p-hold{color:var(--hold)}.p-missing{color:var(--miss)}
  .cols{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
  .todo{margin:0;padding-left:20px;display:grid;gap:8px}
  .cols h3{font:400 24px/1.1 var(--d);text-transform:uppercase;margin:0 0 10px}
  @media (max-width:900px){.score{grid-template-columns:repeat(2,minmax(0,1fr))}.cols{grid-template-columns:minmax(0,1fr)}.flow summary{grid-template-columns:minmax(0,1fr)}}
</style>
<div class="page">
  <header>
    <h1>Website <mark>flow report</mark></h1>
    <p class="lede">What a shop like Akrinity needs from the first visit to the next order, what the website does today, and what the tests found. ${total} steps in ${data.flows.length} flows, checked on ${esc(data.date)}.</p>
  </header>
  <section aria-label="Score"><div class="score">${scoreHtml}</div><p class="legend" style="margin-top:12px">${legend}</p></section>
  <section class="card"><h2>What was tested</h2><div class="tw"><table><thead><tr><th>Test</th><th>Result</th><th>Where</th></tr></thead><tbody>${testsHtml}</tbody></table></div></section>
  <section aria-label="Flows"><h2>Flow by flow</h2><p class="lede" style="margin:0 0 12px">Open a flow to see every step: what a good shop does, what Akrinity does, and the test result.</p>${flowHtml}</section>
  <section class="card"><h2>Email templates</h2><div class="tw"><table><thead><tr><th>Email</th><th>State</th><th>Note</th></tr></thead><tbody>${emailsHtml}</tbody></table></div></section>
  <section aria-label="Still to do"><h2>Still to do</h2><div class="cols">
    <div class="card"><h3>You</h3>${list(data.pending.you)}</div>
    <div class="card"><h3>Backend team</h3>${list(data.pending.backend)}</div>
    <div class="card"><h3>Frontend (Claude)</h3>${list(data.pending.frontend)}</div>
  </div></section>
</div>
<script>
(function () {
  try { var h = location.hash.replace('#', ''); var d = h && document.getElementById(h); if (d && d.tagName === 'DETAILS') d.open = true; } catch (e) {}
  var first = document.querySelector('details.flow'); if (first && !location.hash) first.open = true;
})();
</script>
`;
fs.writeFileSync(path.join(dir, 'flow-report.html'), html);
console.log('written', total, 'steps', JSON.stringify(totals));
