import * as fs from 'fs';
import * as path from 'path';
import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';

/**
 * Builds a step-by-step report (Expected vs Actual) for every test case in the run.
 *
 * A "test case" is a top-level `test.describe`. Specs written step-per-test carry an
 * "Expected" annotation and log an "Actual" one (see `stepLog` in src/fixtures); other
 * specs are reported too, with each test as a row.
 *
 * Where the reports go depends on how the run was started:
 *
 *   Suite run (`npm run suite -- <key>`; suites and their test cases are listed in suites.ts):
 *     reports/Entire Suite/<YYYY-MM-DD_HH-mm-ss>_<Suite name>/
 *       Summary-Report.html          every test case with status and execution time, linked
 *       <TEST CASE ID>-report.html   one per test case
 *       evidence/<TEST CASE ID>_<browser>/Step-NN_k.jpg   screenshots shown in the reports
 *
 *   Any other run (npx playwright test <spec>, VS Code, etc.):
 *     reports/Default/<YYYY-MM-DD_HH-mm-ss>/
 *       <TEST CASE ID>-report.html
 *       evidence/...
 *
 * Evidence: every step's screenshots (attachments named "evidence: <label>", taken by
 * `stepLog` after each step, plus any `stepLog.capture()`), and Playwright's own end-of-test
 * "screenshot" for specs that don't use stepLog. Images are files next to the report, so keep
 * the run folder together when sharing it.
 */
type Row = {
  title: string;
  expected: string;
  actual: string;
  status: TestResult['status'];
  durationMs: number;
  startMs: number;
  retry: number;
  error?: string;
  /** Screenshots for this step; `href` is relative to the run folder. */
  evidence: { label: string; href: string }[];
};

type Entry = { caseId: string; title: string; file: string; project: string; stepBased: boolean; rows: Map<string, Row> };
type CaseStatus = 'passed' | 'failed' | 'skipped';
type Written = { entry: Entry; rows: Row[]; fileName: string; status: CaseStatus; wallMs: number };

type Options = { outputDir?: string; suiteName?: string; suiteTestCases?: 'all' | string[] };

const ANSI = /\x1b\[[0-9;]*m/g;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** Safe as a Windows file/folder name. */
const safeName = (s: string) => s.replace(/[<>:"/\\|?*\x00-\x1f]+/g, '-').replace(/\s+/g, ' ').trim().replace(/[. ]+$/, '');
const isFail = (s: Row['status']) => s === 'failed' || s === 'timedOut' || s === 'interrupted';

function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${(ms / 1000).toFixed(1)}s`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h ? `${h}h ${m}m ${sec}s` : `${m}m ${sec}s`;
}

const STYLE = `
  :root { --bg:#f6f7f9; --card:#fff; --text:#1d2433; --muted:#667085; --line:#e4e7ec; --link:#175cd3; --pass:#067647; --pass-bg:#ecfdf3; --fail:#b42318; --fail-bg:#fef3f2; --skip:#93670a; --skip-bg:#fffaeb; }
  @media (prefers-color-scheme: dark) { :root { --bg:#12151b; --card:#1b1f27; --text:#e6e8ec; --muted:#98a2b3; --line:#2c323d; --link:#84adff; --pass:#47cd89; --pass-bg:#0d2b1e; --fail:#f97066; --fail-bg:#3a1512; --skip:#fdb022; --skip-bg:#33270a; } }
  * { box-sizing: border-box; }
  body { margin:0; padding:24px 16px; background:var(--bg); color:var(--text); font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif; }
  main { max-width:1400px; margin:0 auto; }
  a { color:var(--link); }
  h1 { font-size:22px; margin:0 0 4px; } .muted { color:var(--muted); font-size:12px; }
  .back { display:inline-block; margin-bottom:12px; font-size:13px; }
  .meta { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:8px 24px; margin:16px 0; padding:16px; background:var(--card); border:1px solid var(--line); border-radius:10px; }
  .meta b { display:block; color:var(--muted); font-weight:500; font-size:12px; }
  .cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:12px; margin-bottom:20px; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:14px 16px; }
  .card .n { font-size:26px; font-weight:700; } .card.p .n { color:var(--pass); } .card.f .n { color:var(--fail); } .card.s .n { color:var(--skip); }
  .wrap { overflow-x:auto; background:var(--card); border:1px solid var(--line); border-radius:10px; }
  table { width:100%; border-collapse:collapse; min-width:900px; }
  th, td { padding:10px 12px; border-bottom:1px solid var(--line); vertical-align:top; text-align:left; }
  th { position:sticky; top:0; background:var(--card); font-size:12px; text-transform:uppercase; letter-spacing:.04em; color:var(--muted); }
  table.steps { table-layout:fixed; } table.steps td { overflow-wrap:anywhere; }
  table.steps th:nth-child(1) { width:44px; } table.steps th:nth-child(2) { width:20%; }
  table.steps th:nth-child(3) { width:22%; } table.steps th:nth-child(4) { width:auto; }
  table.steps th:nth-child(5) { width:212px; } table.steps th:nth-child(6) { width:84px; } table.steps th:nth-child(7) { width:64px; }
  tr.failed td, tr.timedOut td, tr.interrupted td { background:var(--fail-bg); }
  .num { text-align:right; white-space:nowrap; } .st { white-space:nowrap; }
  pre { margin:0; white-space:pre-wrap; word-break:break-word; font:12px/1.5 ui-monospace,Consolas,monospace; }
  pre.err { margin-top:8px; padding:8px; border-radius:6px; background:var(--bg); color:var(--fail); max-height:260px; overflow:auto; }
  details { margin-top:8px; } summary { cursor:pointer; color:var(--fail); font-weight:600; font-size:12px; }
  table.steps td.ev { width:200px; }
  figure { margin:0 0 8px; } figure:last-child { margin-bottom:0; }
  figure img { display:block; width:180px; max-height:120px; object-fit:cover; object-position:top; border:1px solid var(--line); border-radius:6px; }
  figure img:hover { outline:2px solid var(--link); }
  figcaption { font-size:11px; color:var(--muted); margin-top:2px; }
  .badge { display:inline-block; padding:2px 8px; border-radius:999px; font-size:11px; font-weight:700; }
  .badge.pass { color:var(--pass); background:var(--pass-bg); } .badge.fail { color:var(--fail); background:var(--fail-bg); } .badge.skip { color:var(--skip); background:var(--skip-bg); }
`;

class StepReporter implements Reporter {
  private readonly outputDir: string;
  private readonly suiteName?: string;
  private readonly suiteTestCases?: 'all' | string[];
  /** Entries listed in suites.ts that matched no test (usually a typo in the ID). */
  private notFound: string[] = [];
  private readonly cases = new Map<string, Entry>();
  private startedAt = new Date();
  private config!: FullConfig;
  private runDir = '';

  constructor(options: Options = {}) {
    this.outputDir = options.outputDir ?? 'reports';
    this.suiteName = options.suiteName;
    this.suiteTestCases = options.suiteTestCases;
  }

  printsToStdio(): boolean {
    return false;
  }

  onBegin(config: FullConfig, suite: Suite): void {
    this.config = config;
    this.startedAt = new Date();
    const root = config.configFile ? path.dirname(config.configFile) : process.cwd();
    this.runDir = this.suiteName
      ? path.resolve(root, this.outputDir, 'Entire Suite', `${this.stamp()}_${safeName(this.suiteName)}`)
      : path.resolve(root, this.outputDir, 'Default', this.stamp());
    if (Array.isArray(this.suiteTestCases)) {
      const titles = suite.allTests().map((t) => `${t.location.file} ${t.titlePath().join(' ')}`);
      this.notFound = this.suiteTestCases.filter((name) => {
        const re = new RegExp(`(?<![\\w])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w])`);
        return !titles.some((t) => re.test(t));
      });
      if (this.notFound.length) {
        console.warn(`\n⚠ ${this.suiteName}: no tests found for ${this.notFound.join(', ')} — check the IDs in suites.ts.\n`);
      }
    }
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const annotations = [...test.annotations, ...(result.annotations ?? [])];
    const expected = annotations.find((a) => a.type === 'Expected')?.description;

    // The test case is the top-level describe (or the file, for tests outside any describe).
    const chain = test.titlePath();
    const project = test.parent.project()?.name ?? '';
    const file = path.basename(test.location.file);
    const topDescribe = this.topDescribe(test);
    const caseTitle = topDescribe?.title || file;
    const caseId = annotations.find((a) => a.type === 'testcase')?.description ?? caseTitle;
    const key = `${caseId}|${project}`;
    const entry = this.cases.get(key) ?? { caseId, title: caseTitle, file, project, stepBased: !!expected, rows: new Map() };
    entry.stepBased ||= !!expected;

    // Nested describes below the test case become part of the row title.
    const inner = topDescribe ? chain.slice(chain.indexOf(topDescribe.title) + 1) : [test.title];
    const actual = annotations.filter((a) => a.type === 'Actual').at(-1)?.description;
    const title = inner.join(' › ');

    // Retries overwrite earlier attempts, so the report shows the final outcome.
    entry.rows.set(test.id, {
      title,
      expected: expected ?? '—',
      actual: actual ?? (result.status === 'skipped' ? '(skipped)' : expected ? '(not recorded)' : result.status === 'passed' ? 'As expected' : ''),
      status: result.status,
      durationMs: result.duration,
      startMs: result.startTime.getTime(),
      retry: result.retry,
      error: result.errors.map((e) => (e.message ?? '').replace(ANSI, '')).join('\n\n') || undefined,
      evidence: this.saveEvidence(result, `${caseId}_${project}`, title),
    });
    this.cases.set(key, entry);
  }

  onEnd(result: FullResult): void {
    const all = [...this.cases.values()];
    if (!all.length) return;
    // A case skipped entirely on one project (e.g. a Chromium-only case on Firefox) gets no
    // report for that project — unless it was skipped everywhere, then it is listed once.
    const ran = (e: Entry) => [...e.rows.values()].some((r) => r.status !== 'skipped');
    const entries = all.filter((e) => ran(e) || (!all.some((o) => o.caseId === e.caseId && ran(o)) && all.find((o) => o.caseId === e.caseId) === e));

    const runDir = this.runDir;
    fs.mkdirSync(runDir, { recursive: true });

    const written: Written[] = [];
    for (const entry of entries) {
      const rows = [...entry.rows.values()].sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
      const multi = entries.filter((g) => g.caseId === entry.caseId).length > 1;
      const fileName = `${safeName(entry.caseId)}${multi ? `-${safeName(entry.project)}` : ''}-report.html`;
      const c = this.counts(rows);
      const status: CaseStatus = c.failed ? 'failed' : c.passed ? 'passed' : 'skipped';
      // Execution time = wall clock from the first step starting to the last one finishing.
      const timed = rows.filter((r) => r.status !== 'skipped' || r.durationMs > 0);
      const wallMs = timed.length ? Math.max(...timed.map((r) => r.startMs + r.durationMs)) - Math.min(...timed.map((r) => r.startMs)) : 0;
      const item: Written = { entry, rows, fileName, status, wallMs };
      fs.writeFileSync(path.join(runDir, fileName), this.caseHtml(item));
      written.push(item);
    }
    written.sort((a, b) => a.entry.caseId.localeCompare(b.entry.caseId, undefined, { numeric: true }) || a.entry.project.localeCompare(b.entry.project));

    let summaryFile: string | undefined;
    if (this.suiteName) {
      summaryFile = path.join(runDir, 'Summary-Report.html');
      fs.writeFileSync(summaryFile, this.summaryHtml(written, result));
    }
    this.printConsole(written, runDir, summaryFile);
  }

  /** Copies the step's screenshots into <run folder>/evidence/<case>_<browser>/. */
  private saveEvidence(result: TestResult, folder: string, title: string): Row['evidence'] {
    const images = result.attachments.filter((a) => a.contentType.startsWith('image/'));
    const own = images.filter((a) => a.name.startsWith('evidence'));
    // Playwright's `screenshot: 'on'` also shoots the shared flow page; use it only when the
    // test captured nothing itself (specs without stepLog).
    const shots = own.length ? own : images.filter((a) => a.name === 'screenshot');
    if (!shots.length) return [];
    const dir = path.join(this.runDir, 'evidence', safeName(folder));
    fs.mkdirSync(dir, { recursive: true });
    const stepNo = title.match(/^Step (\d+)/)?.[1];
    const base = stepNo ? `Step-${stepNo}` : safeName(title).replace(/\s+/g, '-').slice(0, 60);
    const saved: Row['evidence'] = [];
    shots.forEach((a, i) => {
      const data = a.body ?? (a.path && fs.existsSync(a.path) ? fs.readFileSync(a.path) : undefined);
      if (!data) return;
      const name = `${base}_${i + 1}.${a.contentType === 'image/png' ? 'png' : 'jpg'}`;
      fs.writeFileSync(path.join(dir, name), data);
      const label = a.name === 'screenshot' ? (result.status === 'passed' ? 'End of test' : 'At failure') : a.name.replace(/^evidence:\s*/, '');
      saved.push({ label, href: ['evidence', safeName(folder), name].map(encodeURIComponent).join('/') });
    });
    return saved;
  }

  private topDescribe(test: TestCase): Suite | undefined {
    let top: Suite | undefined;
    for (let s: Suite | undefined = test.parent; s && s.type === 'describe'; s = s.parent) top = s;
    return top;
  }

  private counts(rows: Row[]) {
    const passed = rows.filter((r) => r.status === 'passed').length;
    const failed = rows.filter((r) => isFail(r.status)).length;
    const skipped = rows.filter((r) => r.status === 'skipped').length;
    return { total: rows.length, passed, failed, skipped };
  }

  private stamp(): string {
    const d = this.startedAt;
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
  }

  private baseURL(): string {
    return String(this.config.projects[0]?.use?.baseURL ?? '');
  }

  private badge(s: Row['status'] | CaseStatus): string {
    if (s === 'passed') return '<span class="badge pass">PASS</span>';
    if (s === 'skipped') return '<span class="badge skip">SKIP</span>';
    return `<span class="badge fail">${s === 'timedOut' ? 'TIMEOUT' : 'FAIL'}</span>`;
  }

  private page(title: string, body: string): string {
    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>${STYLE}</style></head>
<body><main>
${body}
</main></body></html>`;
  }

  private printConsole(written: Written[], runDir: string, summaryFile?: string): void {
    const line = '─'.repeat(100);
    console.log(`\n${line}`);
    console.log(this.suiteName ? ` Suite: ${this.suiteName}` : ' Test case reports');
    console.log(line);
    for (const w of written) {
      const c = this.counts(w.rows);
      const mark = w.status === 'passed' ? 'PASS' : w.status === 'skipped' ? 'SKIP' : 'FAIL';
      const name = `${w.entry.caseId}${w.entry.project ? ` [${w.entry.project}]` : ''}`;
      console.log(` ${mark}  ${name.padEnd(52)} ${`${c.passed}/${c.total - c.skipped} passed`.padEnd(16)} ${formatDuration(w.wallMs)}`);
    }
    console.log(line);
    if (summaryFile) console.log(` Summary report: ${summaryFile}`);
    console.log(` Reports folder: ${runDir}\n${line}\n`);
  }

  private summaryHtml(written: Written[], result: FullResult): string {
    const total = written.length;
    const passed = written.filter((w) => w.status === 'passed').length;
    const failed = written.filter((w) => w.status === 'failed').length;
    const skipped = written.filter((w) => w.status === 'skipped').length;
    const rate = total - skipped ? Math.round((passed / (total - skipped)) * 100) : 0;
    const projects = [...new Set(written.map((w) => w.entry.project).filter(Boolean))].join(', ');

    const body = written.map((w, i) => {
      const c = this.counts(w.rows);
      return `<tr class="${w.status}">
        <td class="num">${i + 1}</td>
        <td><a href="./${encodeURIComponent(w.fileName)}"><strong>${esc(w.entry.caseId)}</strong></a>${w.entry.title !== w.entry.caseId ? `<div class="muted">${esc(w.entry.title.replace(`${w.entry.caseId}: `, ''))}</div>` : ''}</td>
        <td>${esc(w.entry.project || '—')}</td>
        <td class="st">${this.badge(w.status)}</td>
        <td class="num">${c.total}</td>
        <td class="num">${c.passed}</td>
        <td class="num">${c.failed}</td>
        <td class="num">${c.skipped}</td>
        <td class="num">${formatDuration(w.wallMs)}</td>
      </tr>`;
    }).join('\n');

    return this.page(`${this.suiteName} Summary`, `
  <h1>${esc(this.suiteName ?? '')} — Summary Report</h1>
  <div class="muted">Click a test case name to open its step-by-step report.</div>
  ${this.notFound.length ? `<p class="badge fail" style="margin-top:12px">Listed in suites.ts but not found: ${esc(this.notFound.join(', '))}</p>` : ''}
  <section class="meta">
    <div><b>Executed</b>${this.startedAt.toLocaleString('en-IN')}</div>
    <div><b>Total execution time</b>${formatDuration(result.duration)}</div>
    <div><b>Browsers / projects</b>${esc(projects || '—')}</div>
    <div><b>Base URL</b>${esc(this.baseURL() || '—')}</div>
    <div><b>Overall result</b>${failed ? '<span class="badge fail">FAILED</span>' : '<span class="badge pass">PASSED</span>'}</div>
  </section>
  <section class="cards">
    <div class="card"><div class="muted">Test cases</div><div class="n">${total}</div></div>
    <div class="card p"><div class="muted">Passed</div><div class="n">${passed}</div></div>
    <div class="card f"><div class="muted">Failed</div><div class="n">${failed}</div></div>
    <div class="card s"><div class="muted">Skipped</div><div class="n">${skipped}</div></div>
    <div class="card"><div class="muted">Pass rate</div><div class="n">${rate}%</div></div>
  </section>
  <div class="wrap"><table>
    <thead><tr><th>#</th><th>Test case</th><th>Browser</th><th>Status</th><th>Steps</th><th>Passed</th><th>Failed</th><th>Skipped</th><th>Execution time</th></tr></thead>
    <tbody>${body}</tbody>
  </table></div>`);
  }

  private caseHtml({ entry, rows, status, wallMs }: Written): string {
    const c = this.counts(rows);
    const rate = c.total - c.skipped ? Math.round((c.passed / (c.total - c.skipped)) * 100) : 0;
    const label = entry.stepBased ? 'Step' : 'Test';

    const body = rows.map((r, i) => {
      const [, num = String(i + 1), name = r.title] = r.title.match(/^Step (\d+): (.*)$/) ?? [];
      const details = r.error ? `<details><summary>Failure details</summary><pre class="err">${esc(r.error)}</pre></details>` : '';
      const evidence = r.evidence.map((e) =>
        `<figure><a href="./${e.href}" target="_blank"><img src="./${e.href}" alt="${esc(e.label)}" loading="lazy"></a><figcaption>${esc(e.label)}</figcaption></figure>`).join('') || '<span class="muted">—</span>';
      return `<tr class="${r.status}">
        <td class="num">${Number(num)}</td>
        <td><strong>${esc(name)}</strong></td>
        <td>${esc(r.expected)}</td>
        <td><pre>${esc(r.actual)}</pre>${details}</td>
        <td class="ev">${evidence}</td>
        <td class="st">${this.badge(r.status)}${r.retry ? `<div class="muted">retry ${r.retry}</div>` : ''}</td>
        <td class="num">${formatDuration(r.durationMs)}</td>
      </tr>`;
    }).join('\n');

    return this.page(`${entry.caseId} Report`, `
  ${this.suiteName ? `<a class="back" href="./Summary-Report.html">← ${esc(this.suiteName)} summary</a>` : ''}
  <h1>${esc(entry.caseId)} — Test Execution Report</h1>
  <div class="muted">${esc(entry.title)} · ${esc(entry.file)}</div>
  <section class="meta">
    <div><b>Executed</b>${this.startedAt.toLocaleString('en-IN')}</div>
    <div><b>Execution time</b>${formatDuration(wallMs)}</div>
    <div><b>Browser / project</b>${esc(entry.project || '—')}</div>
    <div><b>Base URL</b>${esc(this.baseURL() || '—')}</div>
    <div><b>Overall result</b>${status === 'failed' ? '<span class="badge fail">FAILED</span>' : status === 'skipped' ? '<span class="badge skip">SKIPPED</span>' : '<span class="badge pass">PASSED</span>'}</div>
    ${this.suiteName ? `<div><b>Suite</b>${esc(this.suiteName)}</div>` : ''}
  </section>
  <section class="cards">
    <div class="card"><div class="muted">Total ${label.toLowerCase()}s</div><div class="n">${c.total}</div></div>
    <div class="card p"><div class="muted">Passed</div><div class="n">${c.passed}</div></div>
    <div class="card f"><div class="muted">Failed</div><div class="n">${c.failed}</div></div>
    <div class="card s"><div class="muted">Skipped</div><div class="n">${c.skipped}</div></div>
    <div class="card"><div class="muted">Pass rate</div><div class="n">${rate}%</div></div>
  </section>
  <div class="wrap"><table class="steps">
    <thead><tr><th>#</th><th>${label}</th><th>Expected result</th><th>Actual result</th><th>Evidence</th><th>Status</th><th>Time</th></tr></thead>
    <tbody>${body}</tbody>
  </table></div>`);
  }
}

export default StepReporter;
