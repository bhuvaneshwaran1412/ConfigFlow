/**
 * test_tier5_adversarial.js
 * Tier 5 White-Box Adversarial Stress Testing & Static/Dynamic Integrity Audit
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const PAGES_DIR = path.join(PUBLIC_DIR, 'pages');
const JS_DIR = path.join(PUBLIC_DIR, 'js');
const CSS_DIR = path.join(PUBLIC_DIR, 'css');

// Configure test environment for app booting
process.env.JWT_SECRET = "configflow_e2e_test_jwt_secret_key_987654321";
process.env.PORT = "3897";
process.env.NODE_ENV = "test";

// Mock DB configuration for Express app
const MockDatabase = require("./mock_db");
const mockDb = new MockDatabase();
const dbPath = path.resolve(__dirname, "../../config/db.js");
require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: mockDb
};

// Require app - this boots express on PORT 3897
const app = require("../../app");
const BASE_URL = `http://localhost:${process.env.PORT}`;

// Comprehensive Unicode Emoji Regex
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{1FA70}-\u{1FAFF}\u{2300}-\u{23FF}\u{2B50}\u{200D}\u{FE0F}]/u;

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const failures = [];

function check(title, fn) {
  totalChecks++;
  try {
    const result = fn();
    if (result !== false) {
      passedChecks++;
      console.log(`  ✓ [PASS] ${title}`);
      return true;
    } else {
      failedChecks++;
      failures.push({ title, error: 'Returned false' });
      console.error(`  ✗ [FAIL] ${title}`);
      return false;
    }
  } catch (err) {
    failedChecks++;
    failures.push({ title, error: err.message });
    console.error(`  ✗ [FAIL] ${title}: ${err.message}`);
    return false;
  }
}

async function asyncCheck(title, fn) {
  totalChecks++;
  try {
    const result = await fn();
    if (result !== false) {
      passedChecks++;
      console.log(`  ✓ [PASS] ${title}`);
      return true;
    } else {
      failedChecks++;
      failures.push({ title, error: 'Returned false' });
      console.error(`  ✗ [FAIL] ${title}`);
      return false;
    }
  } catch (err) {
    failedChecks++;
    failures.push({ title, error: err.message });
    console.error(`  ✗ [FAIL] ${title}: ${err.message}`);
    return false;
  }
}

async function runAllAudits() {
  console.log('======================================================================');
  console.log('  STARTING TIER 5 WHITE-BOX ADVERSARIAL & DEEP AUDIT SUITE');
  console.log('======================================================================\n');

  // -----------------------------------------------------------------------------
  // 1. RECURSIVE EMOJI SCAN ACROSS ALL PUBLIC/ FILES
  // -----------------------------------------------------------------------------
  console.log('▶ [Tier 5.1] Unicode Emoji Audit across all public assets...');

  function getAllFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        getAllFiles(filePath, fileList);
      } else {
        fileList.push(filePath);
      }
    }
    return fileList;
  }

  const allPublicFiles = getAllFiles(PUBLIC_DIR);
  console.log(`  Scanning ${allPublicFiles.length} files in public/...`);

  for (const filePath of allPublicFiles) {
    const relPath = path.relative(PROJECT_ROOT, filePath);
    check(`Emoji Scan: ${relPath} must contain 0 unicode emojis`, () => {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const matches = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (EMOJI_REGEX.test(line)) {
          matches.push(`Line ${i + 1}: ${line.trim()}`);
        }
      }
      if (matches.length > 0) {
        throw new Error(`Found ${matches.length} emoji occurrences:\n    ` + matches.join('\n    '));
      }
      return true;
    });
  }

  // -----------------------------------------------------------------------------
  // 2. STATIC ASSET & SCRIPT LINK INTEGRITY (ZERO 404s)
  // -----------------------------------------------------------------------------
  console.log('\n▶ [Tier 5.2] Static Asset & Script Link Integrity across all 11 HTML pages...');

  const htmlFiles = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith('.html'));

  for (const htmlFile of htmlFiles) {
    const htmlPath = path.join(PAGES_DIR, htmlFile);
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // Extract <link rel="stylesheet" href="...">
    const linkMatches = [...htmlContent.matchAll(/<link[^>]+href=["']([^"']+)["']/gi)];
    for (const match of linkMatches) {
      const href = match[1];
      if (href.startsWith('http://') || href.startsWith('https://')) continue;
      check(`HTML [${htmlFile}] CSS link: ${href} exists on disk`, () => {
        let resolvedPath;
        if (href.startsWith('/')) {
          resolvedPath = path.join(PUBLIC_DIR, href.slice(1));
        } else {
          resolvedPath = path.join(PAGES_DIR, href);
        }
        if (!fs.existsSync(resolvedPath)) {
          throw new Error(`CSS file not found: ${resolvedPath} (from href="${href}")`);
        }
        return true;
      });
    }

    // Extract <script src="...">
    const scriptMatches = [...htmlContent.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)];
    for (const match of scriptMatches) {
      const src = match[1];
      if (src.startsWith('http://') || src.startsWith('https://')) continue;
      check(`HTML [${htmlFile}] Script link: ${src} exists on disk`, () => {
        let resolvedPath;
        if (src.startsWith('/')) {
          resolvedPath = path.join(PUBLIC_DIR, src.slice(1));
        } else {
          resolvedPath = path.join(PAGES_DIR, src);
        }
        if (!fs.existsSync(resolvedPath)) {
          throw new Error(`Script file not found: ${resolvedPath} (from src="${src}")`);
        }
        return true;
      });
    }
  }

  // -----------------------------------------------------------------------------
  // 3. DOM ELEMENT IDS & BINDINGS VERIFICATION
  // -----------------------------------------------------------------------------
  console.log('\n▶ [Tier 5.3] DOM Element ID & Interface Contract Verification...');

  const CONTRACT_PAGE_IDS = {
    'dashboard.html': [
      'sidebarUserName', 'sidebarUserRole', 'approvalLink',
      'totalProjects', 'totalDevelopers', 'pendingRequests', 'approvedRequests', 'rejectedRequests', 'latestVersion',
      'pendingBar', 'pendingBarValue', 'approvedBar', 'approvedBarValue', 'rejectedBar', 'rejectedBarValue',
      'recentRequests', 'projectSummary', 'dashboardNotification', 'backupSection'
    ],
    'projects.html': [
      'sidebarUserName', 'sidebarUserRole', 'approvalLink',
      'addProjectButton', 'projectFormSection', 'formTitle', 'projectId', 'projectName',
      'projectDescription', 'currentVersion', 'projectCount', 'projectsTable'
    ],
    'modules.html': [
      'sidebarUserName', 'sidebarUserRole', 'approvalLink',
      'moduleFormSection', 'formTitle', 'moduleId', 'projectId', 'moduleName',
      'moduleCount', 'modulesTable'
    ],
    'changeRequests.html': [
      'sidebarUserName', 'sidebarUserRole', 'approvalLink',
      'requestFormSection', 'projectId', 'moduleId', 'requestTitle', 'requestDescription',
      'priority', 'attachment', 'requestCount', 'requestsTable'
    ],
    'approval.html': [
      'sidebarUserName', 'sidebarUserRole', 'approvalLink',
      'approvalSection', 'requestId', 'requestTitle', 'requestProject', 'requestModule',
      'requestPriority', 'requestDescription', 'adminComment', 'pendingCount', 'pendingRequestsTable'
    ],
    'versions.html': [
      'sidebarUserName', 'sidebarUserRole', 'approvalLink',
      'versionCount', 'versionsTable', 'olderVersion', 'newerVersion', 'compareVersionsButton',
      'versionComparison'
    ],
    'releaseNotes.html': [
      'sidebarUserName', 'sidebarUserRole', 'approvalLink',
      'releaseNoteFormSection', 'releaseVersion', 'releaseNoteText', 'publishReleaseNoteButton',
      'releaseNoteMessage', 'releaseNoteCount', 'releaseNotesContainer'
    ],
    'reports.html': [
      'sidebarUserName', 'sidebarUserRole', 'approvalLink',
      'totalRequests', 'pendingRequests', 'approvedRequests', 'rejectedRequests', 'totalVersions', 'totalProjects',
      'projectReportTable', 'versionReportTable'
    ],
    'auditLogs.html': [
      'sidebarUserName', 'sidebarUserRole', 'approvalLink',
      'logCount', 'exportAuditButton', 'auditTable'
    ],
    'search.html': [
      'sidebarUserName', 'sidebarUserRole', 'approvalLink',
      'searchInput', 'searchButton', 'statusFilter', 'priorityFilter', 'searchResults'
    ],
    'login.html': [
      'loginFields', 'email', 'password', 'registerFields', 'registerName',
      'employeeId', 'employeeIdHint', 'registerEmail', 'registerPassword', 'confirmPassword',
      'message', 'registerToggle'
    ]
  };

  for (const [page, requiredIds] of Object.entries(CONTRACT_PAGE_IDS)) {
    const htmlPath = path.join(PAGES_DIR, page);
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    for (const elemId of requiredIds) {
      check(`DOM Contract: Page [${page}] contains required element ID #${elemId}`, () => {
        const idPattern = new RegExp(`id=["']${elemId}["']`, 'i');
        if (!idPattern.test(htmlContent)) {
          throw new Error(`Element ID #${elemId} missing in ${page}`);
        }
        return true;
      });
    }
  }

  // -----------------------------------------------------------------------------
  // 4. JS RUNTIME SCRIPT SCAN: ALL getElementById REFERENCED IN JS
  // -----------------------------------------------------------------------------
  console.log('\n▶ [Tier 5.4] Script-to-HTML DOM Binding Reconciliation...');

  const pageScriptMap = {};
  for (const htmlFile of htmlFiles) {
    const htmlContent = fs.readFileSync(path.join(PAGES_DIR, htmlFile), 'utf8');
    const scripts = [...htmlContent.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m => path.basename(m[1]));
    pageScriptMap[htmlFile] = scripts;
  }

  const jsFiles = fs.readdirSync(JS_DIR).filter(f => f.endsWith('.js'));
  for (const jsFile of jsFiles) {
    const jsPath = path.join(JS_DIR, jsFile);
    const jsContent = fs.readFileSync(jsPath, 'utf8');

    const idMatches = [...jsContent.matchAll(/document\.getElementById\(["']([^"']+)["']\)/g)].map(m => m[1]);
    const uniqueIds = [...new Set(idMatches)];
    const includingPages = htmlFiles.filter(p => pageScriptMap[p].includes(jsFile));

    if (includingPages.length > 0) {
      for (const elemId of uniqueIds) {
        check(`JS Binding: ${jsFile} references #${elemId} - present in including pages`, () => {
          let foundInAny = false;
          for (const page of includingPages) {
            const htmlContent = fs.readFileSync(path.join(PAGES_DIR, page), 'utf8');
            if (new RegExp(`id=["']${elemId}["']`, 'i').test(htmlContent)) {
              foundInAny = true;
            }
          }
          if (!foundInAny) {
            throw new Error(`Element #${elemId} referenced in ${jsFile} but not found in any including page (${includingPages.join(', ')})`);
          }
          return true;
        });
      }
    }
  }

  // -----------------------------------------------------------------------------
  // 5. INLINE EVENT HANDLERS (onclick, onsubmit, onchange) VERIFICATION
  // -----------------------------------------------------------------------------
  console.log('\n▶ [Tier 5.5] Inline Event Handler Function Declaration Audit...');

  for (const htmlFile of htmlFiles) {
    const htmlContent = fs.readFileSync(path.join(PAGES_DIR, htmlFile), 'utf8');
    const scriptsForPage = pageScriptMap[htmlFile] || [];
    
    let combinedJs = '';
    for (const script of scriptsForPage) {
      const jsPath = path.join(JS_DIR, script);
      if (fs.existsSync(jsPath)) {
        combinedJs += '\n' + fs.readFileSync(jsPath, 'utf8');
      }
    }

    const handlerMatches = [...htmlContent.matchAll(/on(click|submit|change|input)=["']([^"']+)["']/gi)];
    for (const match of handlerMatches) {
      const handlerType = match[1];
      const handlerCode = match[2];

      const fnMatch = handlerCode.match(/^([a-zA-Z0-9_$]+)\s*\(/);
      if (fnMatch) {
        const fnName = fnMatch[1];
        check(`Handler Scope: [${htmlFile}] on${handlerType}="${fnName}(...)" defined in scripts`, () => {
          const isDefined = (
            new RegExp(`function\\s+${fnName}\\s*\\(`, 'm').test(combinedJs) ||
            new RegExp(`window\\.${fnName}\\s*=`, 'm').test(combinedJs) ||
            new RegExp(`const\\s+${fnName}\\s*=`, 'm').test(combinedJs) ||
            new RegExp(`let\\s+${fnName}\\s*=`, 'm').test(combinedJs) ||
            new RegExp(`var\\s+${fnName}\\s*=`, 'm').test(combinedJs) ||
            fnName === 'alert' || fnName === 'confirm' || fnName === 'prompt'
          );
          if (!isDefined) {
            throw new Error(`Handler function '${fnName}' in ${htmlFile} is not defined in loaded scripts (${scriptsForPage.join(', ')})`);
          }
          return true;
        });
      }
    }
  }

  // -----------------------------------------------------------------------------
  // 6. CSS DESIGN SYSTEM TOKENS & RESPONSIVE BREAKPOINTS AUDIT
  // -----------------------------------------------------------------------------
  console.log('\n▶ [Tier 5.6] CSS Design System & Responsive Breakpoint Validation...');

  const cssPath = path.join(CSS_DIR, 'style.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  check('CSS Audit: Contains design tokens CSS custom properties (:root)', () => {
    if (!cssContent.includes(':root')) {
      throw new Error(':root design tokens not defined in style.css');
    }
    return true;
  });

  check('CSS Audit: Contains standard spacing and neutral color variables', () => {
    const requiredVars = ['--bg-canvas', '--bg-surface', '--text-primary', '--border-default', '--brand'];
    for (const v of requiredVars) {
      if (!cssContent.includes(v)) {
        throw new Error(`Missing CSS token variable: ${v}`);
      }
    }
    return true;
  });

  check('CSS Audit: Contains typography scale tokens', () => {
    const typoVars = ['--font-sans', '--font-size-sm', '--font-size-base', '--font-size-md', '--font-size-lg'];
    for (const v of typoVars) {
      if (!cssContent.includes(v)) {
        throw new Error(`Missing typography token: ${v}`);
      }
    }
    return true;
  });

  check('CSS Audit: Contains responsive breakpoint for Tablet (max-width: 1024px / 768px)', () => {
    if (!/@media\s*\([^)]*max-width:\s*(1024px|768px)/.test(cssContent)) {
      throw new Error('Tablet responsive media queries missing in style.css');
    }
    return true;
  });

  check('CSS Audit: Contains responsive breakpoint for Mobile (max-width: 480px / 640px / 768px)', () => {
    if (!/@media\s*\([^)]*max-width:\s*(480px|640px|768px)/.test(cssContent)) {
      throw new Error('Mobile responsive media queries missing in style.css');
    }
    return true;
  });

  check('CSS Audit: Contains responsive table container / overflow-x support', () => {
    if (!cssContent.includes('overflow-x') && !cssContent.includes('table-container')) {
      throw new Error('Table horizontal overflow protection missing in style.css');
    }
    return true;
  });

  check('CSS Audit: Contains mobile sidebar toggle / drawer styling', () => {
    if (!cssContent.includes('sidebar') || (!cssContent.includes('mobile-open') && !cssContent.includes('transform') && !cssContent.includes('left: 0'))) {
      throw new Error('Sidebar responsive drawer styling missing');
    }
    return true;
  });

  // -----------------------------------------------------------------------------
  // 7. LIVE HTTP ASSET STATUS SCAN VIA EXPRESS SERVER
  // -----------------------------------------------------------------------------
  console.log('\n▶ [Tier 5.7] Live HTTP 200 Status Verification for all Static Endpoints...');

  const requestUrl = (urlPath) => {
    return new Promise((resolve, reject) => {
      http.get(`${BASE_URL}${urlPath}`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
      }).on('error', reject);
    });
  };

  // 1. All 11 HTML pages
  for (const htmlFile of htmlFiles) {
    await asyncCheck(`HTTP 200 Live Serving: /pages/${htmlFile}`, async () => {
      const res = await requestUrl(`/pages/${htmlFile}`);
      if (res.status !== 200) {
        throw new Error(`Expected HTTP 200 for /pages/${htmlFile}, got ${res.status}`);
      }
      if (!res.headers['content-type'] || !res.headers['content-type'].includes('text/html')) {
        throw new Error(`Expected text/html content-type, got ${res.headers['content-type']}`);
      }
      return true;
    });
  }

  // 2. CSS Stylesheet
  await asyncCheck('HTTP 200 Live Serving: /css/style.css', async () => {
    const cssRes = await requestUrl('/css/style.css');
    if (cssRes.status !== 200) {
      throw new Error(`Expected HTTP 200 for /css/style.css, got ${cssRes.status}`);
    }
    if (!cssRes.headers['content-type'] || !cssRes.headers['content-type'].includes('text/css')) {
      throw new Error(`Expected text/css content-type, got ${cssRes.headers['content-type']}`);
    }
    return true;
  });

  // 3. All JS scripts
  for (const jsFile of jsFiles) {
    await asyncCheck(`HTTP 200 Live Serving: /js/${jsFile}`, async () => {
      const jsRes = await requestUrl(`/js/${jsFile}`);
      if (jsRes.status !== 200) {
        throw new Error(`Expected HTTP 200 for /js/${jsFile}, got ${jsRes.status}`);
      }
      if (!jsRes.headers['content-type'] || (!jsRes.headers['content-type'].includes('javascript') && !jsRes.headers['content-type'].includes('application/javascript'))) {
        throw new Error(`Expected javascript content-type, got ${jsRes.headers['content-type']}`);
      }
      return true;
    });
  }

  // 4. Root API endpoint
  await asyncCheck('HTTP 200 Live Serving: GET / API greeting', async () => {
    const rootRes = await requestUrl('/');
    if (rootRes.status !== 200) {
      throw new Error(`Expected HTTP 200 for /, got ${rootRes.status}`);
    }
    return true;
  });

  // -----------------------------------------------------------------------------
  // SUMMARY REPORT
  // -----------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log('  TIER 5 AUDIT EXECUTION SUMMARY');
  console.log('======================================================================');
  console.log(`Total Checks Run: ${totalChecks}`);
  console.log(`Passed:           ${passedChecks} (${((passedChecks / totalChecks) * 100).toFixed(1)}%)`);
  console.log(`Failed:           ${failedChecks}`);

  if (failedChecks > 0) {
    console.error('\nFAILURES ENCOUNTERED:');
    for (const f of failures) {
      console.error(`  - ${f.title}: ${f.error}`);
    }
    process.exit(1);
  } else {
    console.log('\n✅ ALL TIER 5 WHITE-BOX ADVERSARIAL STRESS CHECKS PASSED WITH 100% FIDELITY!\n');
    process.exit(0);
  }
}

runAllAudits().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
