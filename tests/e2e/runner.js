/**
 * ConfigFlow Unified E2E Test Runner
 *
 * Standalone, opaque-box test harness for the ConfigFlow application.
 * Boots an in-process Express server with an in-memory MySQL mock driver,
 * executes all 4 test tiers over HTTP, and reports comprehensive results.
 */

const http = require("http");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const MockDatabase = require("./mock_db");

// Configure test environment variables
process.env.JWT_SECRET = "configflow_e2e_test_jwt_secret_key_987654321";
process.env.PORT = "3889";
process.env.NODE_ENV = "test";

const TEST_PORT = Number(process.env.PORT);
const BASE_URL = `http://localhost:${TEST_PORT}`;

// Ensure uploads directory exists for multer
const uploadsDir = path.resolve(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize Mock Database and override require.cache for config/db
const mockDb = new MockDatabase();
const dbPath = path.resolve(__dirname, "../../config/db.js");

require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: mockDb
};

// Start Express Application
const app = require("../../app");

// Test Harness State
const state = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    startTime: Date.now()
};

// Assertion Library
const assert = {
    strictEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
        }
    },
    notStrictEqual(actual, expected, message) {
        if (actual === expected) {
            throw new Error(message || `Expected value not to equal ${JSON.stringify(expected)}`);
        }
    },
    deepStrictEqual(actual, expected, message) {
        const a = JSON.stringify(actual);
        const e = JSON.stringify(expected);
        if (a !== e) {
            throw new Error(message || `Expected deep equality:\nActual:   ${a}\nExpected: ${e}`);
        }
    },
    ok(value, message) {
        if (!value) {
            throw new Error(message || `Expected truthy value but got ${JSON.stringify(value)}`);
        }
    },
    match(string, regex, message) {
        if (!regex.test(string)) {
            throw new Error(message || `Expected string to match ${regex.toString()}, got "${string}"`);
        }
    },
    includes(collection, item, message) {
        if (typeof collection === "string") {
            if (!collection.includes(item)) {
                throw new Error(message || `Expected string to include "${item}"`);
            }
        } else if (Array.isArray(collection)) {
            if (!collection.some(val => JSON.stringify(val) === JSON.stringify(item) || val === item)) {
                throw new Error(message || `Expected array to include item`);
            }
        } else {
            throw new Error(message || `Cannot check includes on non-collection`);
        }
    },
    fail(message) {
        throw new Error(message || "Assertion failed");
    }
};

// HTTP Request Helper
async function request(endpoint, options = {}) {
    const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;
    const headers = { ...(options.headers || {}) };

    let body = options.body;
    if (body && typeof body === "object" && !(body instanceof Buffer) && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(body);
    }

    const response = await fetch(url, {
        method: options.method || "GET",
        headers,
        body,
        redirect: options.redirect || "manual"
    });

    const contentType = response.headers.get("content-type") || "";
    let data;
    const text = await response.text();

    if (contentType.includes("application/json")) {
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }
    } else {
        data = text;
    }

    return {
        status: response.status,
        headers: response.headers,
        data,
        text,
        cookie: response.headers.get("set-cookie")
    };
}

// Multipart Form-Data Request Helper
async function multipartRequest(endpoint, fields = {}, file = null, cookie = null) {
    const boundary = "----ConfigFlowTestBoundary" + Math.random().toString(36).substring(2);
    const chunks = [];

    for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined && value !== null) {
            chunks.push(
                Buffer.from(
                    `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`
                )
            );
        }
    }

    if (file) {
        const filename = file.filename || "test_upload.txt";
        const contentType = file.contentType || "text/plain";
        const content = Buffer.isBuffer(file.content) ? file.content : Buffer.from(file.content || "test content");

        chunks.push(
            Buffer.from(
                `--${boundary}\r\nContent-Disposition: form-data; name="${file.fieldname || "attachment"}"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`
            )
        );
        chunks.push(content);
        chunks.push(Buffer.from("\r\n"));
    }

    chunks.push(Buffer.from(`--${boundary}--\r\n`));
    const fullBody = Buffer.concat(chunks);

    const headers = {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": fullBody.length.toString()
    };
    if (cookie) headers["Cookie"] = cookie;

    return request(endpoint, {
        method: "POST",
        headers,
        body: fullBody
    });
}

// Authentication Helper
async function loginAs(role = "Admin") {
    let email = "admin@configflow.com";
    let password = "Admin@1234";

    if (role.toLowerCase() === "manager") {
        email = "manager@manager.in";
        password = "Manager@1234";
    } else if (role.toLowerCase() === "developer") {
        email = "developer@dev.ac.in";
        password = "Dev@1234";
    }

    const res = await request("/api/login", {
        method: "POST",
        body: { email, password }
    });

    if (res.status !== 200 || !res.cookie) {
        throw new Error(`Failed to log in as ${role}: ${JSON.stringify(res.data)}`);
    }

    const cookie = res.cookie.split(";")[0];
    return {
        cookie,
        user: res.data.user,
        token: cookie.replace("configflow_token=", "")
    };
}

// Reset Database Helper
function resetDatabase() {
    mockDb.reset();
}

// Test Runner Functions
const testSuites = [];
let currentSuite = "General";

function suite(name, fn) {
    testSuites.push({ name, fn });
}

const testsInCurrentSuite = [];

function test(name, fn) {
    testsInCurrentSuite.push({ suite: currentSuite, name, fn });
}

// Master Runner Execution
async function runAll() {
    console.log("\n" + "=".repeat(70));
    console.log("  CONFIGFLOW E2E TEST SUITE RUNNER");
    console.log("=".repeat(70));
    console.log(`Server URL:   ${BASE_URL}`);
    console.log(`Node Version: ${process.version}`);
    console.log(`Started at:   ${new Date().toISOString()}\n`);

    const args = process.argv.slice(2);
    const tierArg = args.find(a => a.startsWith("--tier="));
    const targetTier = tierArg ? tierArg.split("=")[1] : null;

    const tierFiles = [
        { tier: "1", file: "./test_tier1_features.js", title: "Tier 1: Feature Coverage" },
        { tier: "2", file: "./test_tier2_boundaries.js", title: "Tier 2: Boundary & Corner Cases" },
        { tier: "3", file: "./test_tier3_combos.js", title: "Tier 3: Cross-Feature Combinations" },
        { tier: "4", file: "./test_tier4_workloads.js", title: "Tier 4: Real-World Enterprise Workloads" }
    ];

    const tiersToRun = targetTier
        ? tierFiles.filter(t => t.tier === targetTier)
        : tierFiles;

    for (const tierInfo of tiersToRun) {
        console.log(`\n▶ Loading ${tierInfo.title} (${tierInfo.file})...`);
        currentSuite = tierInfo.title;
        testsInCurrentSuite.length = 0;

        const tierModule = require(tierInfo.file);
        if (typeof tierModule.registerTests === "function") {
            tierModule.registerTests({ test, assert, request, multipartRequest, loginAs, resetDatabase, mockDb, BASE_URL });
        }

        console.log(`  Found ${testsInCurrentSuite.length} test cases in ${tierInfo.title}\n`);

        for (const testCase of testsInCurrentSuite) {
            state.total++;
            const testStart = Date.now();
            try {
                resetDatabase();
                await testCase.fn();
                const duration = Date.now() - testStart;
                state.passed++;
                console.log(`  ✓ [PASS] [${testCase.suite}] ${testCase.name} (${duration}ms)`);
            } catch (err) {
                const duration = Date.now() - testStart;
                state.failed++;
                state.errors.push({
                    suite: testCase.suite,
                    name: testCase.name,
                    error: err.stack || err.message
                });
                console.log(`  ✗ [FAIL] [${testCase.suite}] ${testCase.name} (${duration}ms)`);
                console.log(`    Error: ${err.message}`);
            }
        }
    }

    const totalDuration = ((Date.now() - state.startTime) / 1000).toFixed(2);
    console.log("\n" + "=".repeat(70));
    console.log("  TEST RUN SUMMARY");
    console.log("=".repeat(70));
    console.log(`Total Tests Run:  ${state.total}`);
    console.log(`Passed:           ${state.passed} (\x1b[32m${((state.passed / (state.total || 1)) * 100).toFixed(1)}%\x1b[0m)`);
    console.log(`Failed:           ${state.failed} ${state.failed > 0 ? "\x1b[31m(FAILURES DETECTED)\x1b[0m" : "\x1b[32m(ALL PASSED)\x1b[0m"}`);
    console.log(`Duration:         ${totalDuration}s\n`);

    if (state.failed > 0) {
        console.log("FAILED TESTS DETAILS:");
        state.errors.forEach((e, idx) => {
            console.log(`\n${idx + 1}) [${e.suite}] ${e.name}`);
            console.log(e.error);
        });
        console.log("\n" + "=".repeat(70));
        process.exit(1);
    } else {
        console.log("✅ 100% OF E2E TEST SUITE PASSED SUCCESSFULLY\n");
        process.exit(0);
    }
}

if (require.main === module) {
    runAll().catch(err => {
        console.error("Fatal Test Runner Error:", err);
        process.exit(1);
    });
}

module.exports = {
    runAll,
    assert,
    request,
    multipartRequest,
    loginAs,
    resetDatabase,
    mockDb,
    BASE_URL
};
