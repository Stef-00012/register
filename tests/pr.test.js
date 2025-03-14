const t = require("ava");
const fs = require("fs-extra");
const path = require("path");

const requiredEnvVars = ["CHANGED_FILES", "PR_AUTHOR", "PR_AUTHOR_ID"];
const trustedUsers = require("../util/trusted.json").map((u) => u.id);

function getDomainData(subdomain) {
    try {
        const data = fs.readJsonSync(path.join(path.resolve("domains"), `${subdomain}.json`));
        return data;
    } catch (error) {
        throw new Error(`Failed to read JSON for ${subdomain}: ${error.message}`);
    }
}

t("Users can only update their own subdomains", (t) => {
    if (requiredEnvVars.every((v) => process.env[v])) {
        const changedFiles = JSON.parse(process.env.CHANGED_FILES);
        const prAuthor = process.env.PR_AUTHOR.toLowerCase();
        const prAuthorId = process.env.PR_AUTHOR_ID;
        const changedJSONFiles = changedFiles
            .filter((file) => file.startsWith("domains/"))
            .map((file) => path.basename(file));

        if (!changedJSONFiles || trustedUsers.includes(prAuthorId)) return t.pass();
        if (process.env.PR_LABELS && process.env.PR_LABELS.includes("bypass-owner-check")) return t.pass();

        changedJSONFiles.forEach((file) => {
            const subdomain = file.replace(/\.json$/, "");
            const data = getDomainData(subdomain);

            t.true(
                data.owner.username.toLowerCase() === prAuthor,
                `${subdomain}: ${prAuthor} does not own ${subdomain}.is-a.dev`
            );
        });
    }

    t.pass();
});
