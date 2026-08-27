/**
 * Semantic Versioning & Release Note Utility
 */

function parseSemVer(versionStr) {
    if (!versionStr || typeof versionStr !== "string") {
        return { major: 1, minor: 0, patch: 0 };
    }

    const clean = versionStr.trim().replace(/^v/i, "");
    const match = clean.match(/^(\d+)\.(\d+)\.(\d+)/);

    if (!match) {
        return { major: 1, minor: 0, patch: 0 };
    }

    return {
        major: parseInt(match[1], 10),
        minor: parseInt(match[2], 10),
        patch: parseInt(match[3], 10)
    };
}

function bumpSemVer(currentVersionStr, changeType = "Patch") {
    const { major, minor, patch } = parseSemVer(currentVersionStr);
    const normalizedType = String(changeType).toLowerCase();

    if (normalizedType === "major") {
        return `v${major + 1}.0.0`;
    } else if (normalizedType === "minor") {
        return `v${major}.${minor + 1}.0`;
    } else {
        // Default to Patch
        return `v${major}.${minor}.${patch + 1}`;
    }
}

function generateChangelog(changeRequest, version, approverName = "Admin") {
    const dateStr = new Date().toISOString().split("T")[0];
    const moduleName = changeRequest.module_name || "General";
    const changeType = changeRequest.change_type || "Patch";
    const priority = changeRequest.priority || "Medium";

    return `### Release ${version} (${dateStr})\n` +
        `**Module:** ${moduleName} | **Type:** ${changeType} | **Priority:** ${priority}\n\n` +
        `#### Summary:\n${changeRequest.title}\n\n` +
        `#### Details:\n${changeRequest.description}\n\n` +
        `*Approved by ${approverName}*`;
}

module.exports = {
    parseSemVer,
    bumpSemVer,
    generateChangelog
};

