// ==UserScript==
// @name         Torn Forum Post Extractor for Discord
// @namespace    https://www.torn.com/
// @version      0.70
// @description  Extracts Torn forum posts and formats them for Discord
// @author       GNSC4 [268863]
// @include      https://www.torn.com/forums.php*
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
    'use strict';

    // --- Configuration (User-Customizable) ---
    const config = {
        targetAuthor: "", // Optional: Specify a target author (case-sensitive). Leave empty to extract all.
        highlightKeywords: [], // Optional: Add keywords (case-insensitive) to highlight.
        codeBlockKeywords: ["```", "[code]"], // Optional: Add keywords that trigger a code block (case-insensitive). Defaults are for Torn syntax.
        includeAuthorNames: true, // Whether to include author names in the output.
        maxPostsToExtract: 100, // Maximum number of posts to extract per page (set to -1 for unlimited).
        maxDataAge: 60 * 60 * 1000, // Maximum age of data in milliseconds (1 hour).
        maxForumsToStore: 10, // Maximum number of forums to store data for.
        notificationTimeout: 3000, // Timeout for the notification message (in milliseconds).
        debugMode: true, // Enable debug logging to the console.
        retryDelay: 250, // Delay between retries when waiting for elements to load (in milliseconds).
        maxCopyLength: 2000, // Maximum length of text to copy to clipboard, in characters.
    };

    let extractedData = []; // Array to store extracted data across multiple forums.
    let isExtracting = false; // Flag to prevent concurrent extractions.
    let observer = null; // Global variable for the mutation observer.
    let highlightKeywordsRegex = null; // Global variable for precompiled regex for keyword highlighting.

    function logDebug(...args) {
        if (config.debugMode) {
            console.log(...args);
        }
    }

    function logError(...args) {
        console.error(...args);
    }

    async function waitForAuthorElement(post) {
        logDebug("waitForAuthorElement called with post:", post);
        return new Promise((resolve) => {
            const observer = new MutationObserver((mutations, obs) => {
                const authorElement = post.querySelector(
                    '.user.left a[href*="profiles.php"], .post-container .user-name a[href*="profiles.php"]'
                );
                if (authorElement) {
                    const authorName = authorElement.textContent.trim();
                    if (authorName !== "" && !/^\[\d+\]$/.test(authorName)) {
                        logDebug("Author element found:", authorElement);
                        obs.disconnect();
                        resolve(authorElement);
                        return;
                    }
                }
            });

            observer.observe(post, {
                childList: true,
                subtree: true,
                attributes: true,
                characterData: true,
            });

            setTimeout(() => {
                observer.disconnect();
                logError("Timeout waiting for author element in post:", post.innerHTML);
                resolve(null);
            }, 10000);
        });
    }

    async function extractPosts() {
        logDebug("extractPosts called");
        try {
            const forumContainer = await waitForElement('.thread-list', 10000);
            if (!forumContainer) {
                throw new Error("Forum container element (.thread-list) not found.");
            }

            const posts = forumContainer.querySelectorAll('.post-container');
            const promises = [];

            for (const [index, post] of Array.from(posts).entries()) {
                if (config.maxPostsToExtract !== -1 && index >= config.maxPostsToExtract) {
                    logDebug("Reached maxPostsToExtract limit. Stopping extraction.");
                    break;
                }

                promises.push((async () => {
                    logDebug("Processing post:", post);

                    let author = "Unknown Author";
                    try {
                        const authorElement = await waitForAuthorElement(post);
                        if (authorElement) {
                            const href = authorElement.getAttribute('href');
                            const match = href ? href.match(/XID=(\d+)/) : null;
                            let authorName = authorElement.textContent.trim();

                            if (match) {
                                const userID = match[1];
                                author = (authorName && authorName !== "") ? `${authorName}[${userID}]` : `Unknown [${userID}]`;
                            } else {
                                author = authorName || author;
                            }
                        } else {
                            logError("Failed to find author element for post:", post);
                        }
                    } catch (error) {
                        logError("Error extracting author:", error);
                    }

                    let content = "";
                    try {
                        const contentElement = post.querySelector('.post.unreset');
                        if (contentElement) {
                            content = contentElement.innerText.trim();
                        } else {
                            logError("Content element not found in post:", post);
                            content = "Content not found.";
                        }
                    } catch (error) {
                        logError("Error extracting content:", error);
                        content = "Error extracting content.";
                    }

                    const timestampElement = post.querySelector('.post-time');
                    const timestamp = timestampElement ? new Date(timestampElement.getAttribute('data-timestamp') * 1000).toISOString() : "Unknown Timestamp";

                    logDebug("Extracted post data:", { author, content, timestamp });
                    return { author, content, timestamp };
                })());
            }

            const newExtractedData = await Promise.all(promises);
            logDebug("extractPosts returning:", newExtractedData);
            return newExtractedData;

        } catch (error) {
            logError("Error extracting posts:", error);
            displayNotification(`Error extracting posts: ${error.message}`, true);
            return [];
        }
    }

    function waitForElement(selector, timeout = 10000) {
        logDebug("waitForElement called with selector:", selector, "timeout:", timeout);
        return new Promise((resolve) => {
            const startTime = Date.now();

            const checkElement = () => {
                const element = document.querySelector(selector);
                if (element) {
                    logDebug("Element found:", selector);
                    resolve(element);
                } else {
                    if (Date.now() - startTime >= timeout) {
                        logError("Timeout waiting for element:", selector);
                        resolve(null);
                    } else {
                        setTimeout(checkElement, config.retryDelay);
                    }
                }
            };

            checkElement();
        });
    }

    async function initializeExtraction() {
        logDebug("initializeExtraction called");
        try {
            if (isExtracting) {
                logDebug("Extraction already in progress. Skipping.");
                return;
            }

            isExtracting = true;

            const newExtractedData = await extractPosts();

            const discordFormattedPosts = await formatForDiscord(newExtractedData);
            addCopyButton(discordFormattedPosts);

        } catch (error) {
            logError("Error initializing extraction:", error);
            displayNotification(`Error initializing extraction: ${error.message}`, true);
        } finally {
            isExtracting = false;
        }
    }

    const storedApiKey = GM_getValue("tornApiKey");
    if (!storedApiKey) {
        promptForApiKey();
    } else {
        config.apiKey = storedApiKey;
        waitForElement('.thread-list', 30000)
            .then((forumContainer) => {
                if (forumContainer) {
                    logDebug("thread-list found, initializing extraction.");
                    initializeExtraction().then(() => setupObserver());
                } else {
                    logError("thread-list not found within the timeout period.");
                    displayNotification("Error: Forum content not detected.", true);
                }
            })
            .catch((error) => {
                logError("Error waiting for thread-list:", error);
                displayNotification(`Error: ${error.message}`, true);
            });
    }
})();