// ==UserScript==
// @name         Torn Forum Post Extractor for Discord
// @namespace    https://www.torn.com/
// @version      1.0.49
// @description  Extracts Torn forum posts and formats them for Discord
// @author       GNSC4 [268863]
// @match        https://www.torn.com/forums.php*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
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

    let selectedPosts = [];
    let copyButton;

    GM_addStyle(`
        .select-post-button {
            margin: 0;
            padding: 2px 5px;
            background-color: #777;
            color: #fff;
            border: none;
            border-radius: 3px;
            cursor: pointer;
        }
        .post-selected {
            background-color: #e0f0e0;
        }
        .post-selected, .post-selected * {
            color: #000 !important;
        }
        .copy-parts-container {
            position: fixed;
            top: 50px;
            right: 10px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        .copy-parts-button {
            padding: 5px 10px;
            background-color: #66b266;
            color: #fff;
            border: none;
            border-radius: 3px;
            cursor: pointer;
        }
        .copy-parts-button.copied {
            background-color: #ffcc00;
        }
    `);

    function extractPost(post, index) {
        if (post.querySelector('.select-post-button')) return;
        if (!post.querySelector('div.confirm-wrap > ul.action-wrap')) {
            console.warn("Skipping post without 'ul.action-wrap':", post);
            return;
        }

        const timestampSelector = 'div.time-wrap > div';
        const authorSelector = 'div.poster-wrap.left > div.poster.white-grad > a.user.name';
        const contentElement = post.querySelector('div.column-wrap > div.post-wrap.left > div.post-container.editor-content.bbcode-content > div.post.unreset');

        const timestampElement = post.querySelector(timestampSelector);
        let rawTimestamp = timestampElement ? timestampElement.getAttribute("data-timestamp") : null;

        if (!rawTimestamp) {
            const readableTime = timestampElement ? timestampElement.textContent.trim() : null;
            if (readableTime) {
                const cleanedTime = readableTime
                    .replace(/(Posted on|Thread created on)/i, "")
                    .replace(/\(.*?\)/, "")
                    .replace(/\sago$/, "")
                    .trim();
                rawTimestamp = manualDateParse(cleanedTime);
            }
        }

        const timestamp = rawTimestamp ? `<t:${rawTimestamp}:F>` : "Unknown Timestamp";

        const authorElement = post.querySelector(authorSelector);
        const authorName = authorElement ? authorElement.textContent.trim() : "Unknown Author";
        const authorId = authorElement ? authorElement.href.match(/XID=(\d+)/)[1] : "Unknown ID";
        const author = `${authorName} [${authorId}]`;

        const content = contentElement ? extractContentWithImages(contentElement, post) : "No Content";

        // Create the select button
        const selectButton = document.createElement('button');
        selectButton.classList.add('select-post-button');
        selectButton.textContent = 'Select Post';
        selectButton.addEventListener('click', (event) => {
            event.stopPropagation();
            toggleSelectPost({ post, author, timestamp, content, selectButton, index });
        });

        // Find the 'ul.action-wrap' and prepend the button
        const actionWrap = post.querySelector('div.confirm-wrap > ul.action-wrap');
        if (actionWrap) {
            const listItem = document.createElement('li');
            listItem.appendChild(selectButton);
            actionWrap.insertBefore(listItem, actionWrap.firstChild);
        } else {
            console.error("Could not find 'ul.action-wrap' in post:", post);
        }
    }

    function toggleSelectPost(postData) {
        const index = selectedPosts.findIndex(p => p.post === postData.post);
        if (index > -1) {
            selectedPosts.splice(index, 1);
            postData.post.classList.remove('post-selected');
            postData.selectButton.textContent = 'Select Post';
        } else {
            selectedPosts.push(postData);
            postData.post.classList.add('post-selected');
            postData.selectButton.textContent = 'Deselect Post';
        }
    }

    function extractContentWithImages(contentElement, post) {
        let content = '';
        const elements = contentElement.childNodes;

        for (const element of elements) {
            if (element.nodeType === Node.TEXT_NODE) {
                content += element.textContent;
            } else if (element.tagName === 'A' && element.classList.contains('full') && element.querySelector('IMG')) {
                content += `\n${element.href}\n`;
            } else if (element.tagName === 'IMG') {
                content += `\n${element.src}\n`;
            } else if (element.tagName === 'BR') {
                content += '\n';
            } else if (element.tagName === 'TABLE') {
                content += extractTableContent(element);
            } else if (element.nodeType === Node.ELEMENT_NODE) {
                content += extractContentWithImages(element, post);
            }
        }

        return content.trim();
    }

    function extractTableContent(tableElement) {
        let tableContent = '\n```\n'; // Start of code block for the table

        // Iterate over each row in the table
        const rows = tableElement.querySelectorAll('tr');
        for (const row of rows) {
            const cells = row.querySelectorAll('td, th');
            let rowContent = '';
            for (const cell of cells) {
                // Append cell content, followed by a tab for alignment
                rowContent += cell.textContent.trim() + '\t';
            }
            tableContent += rowContent.trim() + '\n'; // Trim to remove trailing tab, add newline
        }

        tableContent += '```\n'; // End of code block for the table
        return tableContent;
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
        const month = parseInt(dateParts[1], 10) - 1;
        let year = parseInt(dateParts[2], 10);

        if (year < 100) {
            year += 2000;
        }

        const parsedDate = new Date(Date.UTC(year, month, day, hours, minutes, seconds));

        return Math.floor(parsedDate.getTime() / 1000);
    }

    function escapeMarkdown(text) {
        return text.replace(/([_*~`|])/g, '\\$1');
    }

    async function formatSelectedPostsForDiscord() {
        console.log("Formatting selected posts for Discord...");
        const formattedPosts = [];

        // Sort selected posts by their index
        selectedPosts.sort((a, b) => a.index - b.index);

        for (const selectedPost of selectedPosts) {
            const authorName = selectedPost.author.split(' [')[0];
            const authorId = selectedPost.author.match(/\[(\d+)\]/)[1];
            const timestamp = selectedPost.timestamp;
            let content = selectedPost.content;

            content = processContentForDiscord(content);

            const authorLine = config.includeAuthorNames ? `**${authorName} [${authorId}]:**` : "";
            const postText = `${authorLine}\n${timestamp}\n${content}\n`;

            // Split posts if they exceed the character limit
            if (postText.length > config.maxCopyLength) {
                const parts = splitPostIntoParts(postText);
                formattedPosts.push(...parts);
            } else {
                formattedPosts.push(postText);
            }
        }

        console.log("Formatted posts:", formattedPosts);
        return formattedPosts;
    }

    function processContentForDiscord(content) {
        let result = '';
        let inCodeBlock = false;
        const lines = content.split('\n');
        let codeBlockStarted = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.trim().startsWith('```')) {
                inCodeBlock = !inCodeBlock;
                result += line + '\n';
            } else if (!inCodeBlock) {
                if (line.match(/^(https?:\/\/[^\s]+)$/)) {
                    // Close any open code block before a URL
                    if (codeBlockStarted) {
                        result += '```\n';
                        codeBlockStarted = false;
                    }
                    result += line + '\n'; // Keep URLs on their own line
                } else {
                    // Start a new code block if not already started and line is not empty
                    if (!codeBlockStarted && line.trim() !== '') {
                        result += '```\n';
                        codeBlockStarted = true;
                    }
                    if (line.trim() !== '') {
                        result += line + '\n';
                    }
                }
            } else {
                result += line + '\n';
            }
        }

        // Close any open code block at the end
        if (codeBlockStarted) {
            result += '```\n';
        }

        return result.trim();
    }

    function splitPostIntoParts(postText) {
        const parts = [];
        let currentPart = '';
        const lines = postText.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const partNumber = `[Part ${parts.length + 1}/${Math.ceil(postText.length / config.maxCopyLength)}]`;

            if ((currentPart + line + '\n').length + partNumber.length > config.maxCopyLength) {
                parts.push(currentPart.trim());
                currentPart = line + '\n';
            } else {
                currentPart += line + '\n';
            }
        }

        if (currentPart.trim().length > 0) {
            parts.push(currentPart.trim());
        }

        // Add part indicators
        return parts.map((part, index) => {
            return `${part} [Part ${index + 1}/${parts.length}]`;
        });
    }

    function addCopyButton() {
        console.log("Adding copy button...");
        const existingButton = document.querySelector('#copy-forum-posts-button');
        if (existingButton) existingButton.remove();

        const button = document.createElement('button');
        button.id = 'copy-forum-posts-button';
        button.textContent = 'Copy Selected Posts';
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

        button.addEventListener('click', async () => {
            const formattedPosts = await formatSelectedPostsForDiscord();
            const copyPartsContainer = document.querySelector('.copy-parts-container') || createCopyPartsContainer();
            document.body.appendChild(copyPartsContainer);
            copyPartsContainer.innerHTML = '';

            if (formattedPosts.length === 1) {
                navigator.clipboard.writeText(formattedPosts[0])
                    .then(() => console.log("Copied to clipboard."))
                    .catch(err => console.error("Failed to copy:", err));
            } else if (formattedPosts.length > 1) {
                formattedPosts.forEach((post, index) => {
                    const partButton = document.createElement('button');
                    partButton.classList.add('copy-parts-button');
                    partButton.textContent = `Copy Part ${index + 1}`;
                    partButton.title = `Copy part ${index + 1} of ${formattedPosts.length}`;
                    partButton.addEventListener('click', (event) => {
                        event.stopPropagation();
                        copyPartToClipboard(post, partButton);
                    });
                    copyPartsContainer.appendChild(partButton);
                });
            } else {
                console.log("No posts selected to copy.");
            }
        });

        document.body.appendChild(button);
    }

    function createCopyPartsContainer() {
        const container = document.createElement('div');
        container.classList.add('copy-parts-container');
        return container;
    }

    function copyPartToClipboard(part, button) {
        navigator.clipboard.writeText(part)
            .then(() => {
                console.log(`Copied part to clipboard.`);
                button.classList.add('copied');
                button.textContent = 'Copied';
                setTimeout(() => {
                    button.classList.remove('copied');
                    button.textContent = 'Copy Part';
                }, 1000); // Reset button text after 1 second
            })
            .catch(err => console.error(`Failed to copy part:`, err));
    }

    function observeDOM() {
        waitForElement('#forums-page-wrap > div.forums-thread-wrap.view-wrap > div > ul').then(targetNode => {
            const observerConfig = { childList: true, subtree: false };

            const callback = (mutationList, observer) => {
                for (const mutation of mutationList) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        Array.from(mutation.addedNodes)
                            .filter(node => node.nodeType === Node.ELEMENT_NODE && node.matches('li'))
                            .forEach(post => {
                                const index = Array.from(targetNode.children).indexOf(post);
                                extractPost(post, index);
                            });
                    }
                }
            };

            const observer = new MutationObserver(callback);
            observer.observe(targetNode, observerConfig);
            console.log("MutationObserver started");
        });
    }

    function initialize() {
        waitForElement('#forums-page-wrap > div.forums-thread-wrap.view-wrap > div > ul').then(targetNode => {
            const initialPosts = targetNode.querySelectorAll('li');
            Array.from(initialPosts).forEach((post, index) => {
                extractPost(post, index);
            });
            observeDOM();
            addCopyButton();
        });
    }

    function waitForElement(selector) {
        return new Promise(resolve => {
            const interval = setInterval(() => {
                const element = document.querySelector(selector);
                if (element) {
                    clearInterval(interval);
                    resolve(element);
                }
            }, 100);
        });
    }

    initialize();
})();