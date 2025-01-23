// ==UserScript==
// @name         Torn Forum Post Extractor for Discord
// @namespace    https://www.torn.com/
// @version      1.0.11
// @description  Extracts Torn forum posts and formats them for Discord
// @author       GNSC4 [268863]
// @include      https://www.torn.com/forums.php*
// @grant        GM_getValue
// @grant        GM_setValue
// @require      https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js
// ==/UserScript==

(function() {
    'use strict';

    const config = {
        targetAuthor: "",
        highlightKeywords: [],
        codeBlockKeywords: ["```","[code]"],
        includeAuthorNames: true,
        maxPostsToExtract: 100,
        maxDataAge: 60 * 60 * 1000,
        maxForumsToStore: 10,
        notificationTimeout: 3000,
        debugMode: true,
        retryDelay: 500,
        maxCopyLength: 2000,
        authorElementTimeout: 5000
    };

    let extractedData = [];

    async function extractPosts() {
        console.log("Extracting posts...");
        const posts = document.querySelectorAll('#forums-page-wrap > div.forums-thread-wrap.view-wrap > div > ul > li');
        const extracted = [];

        for (const post of posts) {
            const timestampSelector = 'div.time-wrap > div';
            const authorSelector = 'div.poster-wrap.left > div.poster.white-grad > a.user.name';

            const timestampElement = post.querySelector(timestampSelector);
            let rawTimestamp = timestampElement ? timestampElement.getAttribute("data-timestamp") : null;
            console.log("Initial raw timestamp value:", rawTimestamp);

            if (!rawTimestamp) {
                const readableTime = timestampElement ? timestampElement.textContent.trim() : null;
                console.log("Readable time detected:", readableTime);
                if (readableTime) {
                    // Remove extra text like "Posted on" or "Thread created on" and anything in parentheses
                    const cleanedTime = readableTime
                        .replace(/(Posted on|Thread created on)/i, "") // Remove extra labels
                        .replace(/\(.*?\)/, "") // Remove text inside parentheses
                        .replace(/\sago$/, "") //Remove the word "ago" and any whitespace preceding it.
                        .trim();
                    console.log("Cleaned time:", cleanedTime);

                    // Manual parsing
                    rawTimestamp = manualDateParse(cleanedTime);
                }
            }

            console.log("Final raw timestamp value:", rawTimestamp);

            const timestamp = rawTimestamp ? `<t:${rawTimestamp}:F>` : "Unknown Timestamp";

            const authorElement = post.querySelector(authorSelector);
            const author = authorElement ? authorElement.textContent.trim() : "Unknown Author";

            const contentElement = post.querySelector('div.column-wrap > div.post-wrap.left > div.post-container.editor-content.bbcode-content > div.post.unreset');
            const content = contentElement ? contentElement.innerText.trim() : "No Content";

            extracted.push({ author, timestamp, content });
        }

        console.log("Posts extracted:", extracted);
        return extracted;
    }

    function manualDateParse(dateString) {
        const parts = dateString.split(" - ");
        if (parts.length !== 2) {
            console.error("Failed to parse timestamp: Invalid format", dateString);
            return null;
        }

        const timeParts = parts[0].split(":");
        const dateParts = parts[1].split("/");

        if (timeParts.length !== 3 || dateParts.length !== 3) {
            console.error("Failed to parse timestamp: Invalid format", dateString);
            return null;
        }

        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        const seconds = parseInt(timeParts[2], 10);
        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed in JavaScript Date
        let year = parseInt(dateParts[2], 10);

        // Handle two-digit year (assuming 2000s)
        if (year < 100) {
            year += 2000;
        }

        // Create a UTC date
        const parsedDate = new Date(Date.UTC(year, month, day, hours, minutes, seconds));

        return Math.floor(parsedDate.getTime() / 1000); // Convert to Unix timestamp (seconds)
    }

    function escapeMarkdown(text) {
        return text.replace(/([_*~`|])/g, '\\$1'); // Escapes *, _, ~, `, and |
    }

    async function formatForDiscord(data) {
        console.log("Formatting posts for Discord...");
        let formatted = "";
        let currentLength = 0;

        for (const post of data) {
            const authorLine = config.includeAuthorNames ? `**${post.author}:**` : "";
            const escapedContent = escapeMarkdown(post.content);
            const content = `\n\`\`\`\n${escapedContent}\n\`\`\`\n`;
            const postText = `${authorLine}\n${post.timestamp}${content}---\n\n`;

            if (currentLength + postText.length > config.maxCopyLength) {
                console.warn("Post truncated due to character limit.");
                break;
            }

            formatted += postText;
            currentLength += postText.length;
        }

        console.log("Formatted posts:", formatted);
        return formatted;
    }

    function addCopyButton(formattedPosts) {
        console.log("Adding copy button...");

        const existingButton = document.querySelector('#copy-forum-posts-button');
        if (existingButton) existingButton.remove();

        const button = document.createElement('button');
        button.id = 'copy-forum-posts-button';
        button.textContent = 'Copy to Clipboard';
        button.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 1000;
            padding: 5px 10px;
            background-color: #777;
            color: #fff;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        `;

        button.addEventListener('click', () => {
            navigator.clipboard.writeText(formattedPosts)
                .then(() => console.log("Copied to clipboard."))
                .catch(err => console.error("Failed to copy:", err));
        });

        document.body.appendChild(button);
    }

    function addTestButton() {
        const button = document.createElement('button');
        button.textContent = "Extract Forum Data";
        button.style.position = "fixed";
        button.style.top = "50px";
        button.style.right = "10px";
        button.style.zIndex = "1000";

        button.addEventListener('click', async () => {
            const data = await extractPosts();
            const formattedPosts = await formatForDiscord(data);
            console.log("Formatted posts for Discord:", formattedPosts);
            addCopyButton(formattedPosts);
        });

        document.body.appendChild(button);
    }

    addTestButton();
})();