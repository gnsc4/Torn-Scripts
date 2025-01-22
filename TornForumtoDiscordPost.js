// ==UserScript==
// @name         Torn Forum Post Extractor for Discord
// @namespace    https://www.torn.com/
// @version      0.69
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

    /**
     * Logs a debug message to the console if debug mode is enabled.
     * @param {...any} args The arguments to log.
     */
    function logDebug(...args) {
        if (config.debugMode) {
            console.log(...args);
        }
    }

    /**
     * Logs an error message to the console.
     * @param {...any} args The arguments to log.
     */
    function logError(...args) {
        console.error(...args);
    }

    // --- Functions ---

    /**
     * Extracts posts from the current forum page.
     * @returns {Promise<Array>} An array of extracted post data (author, content, timestamp).
     */
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

                    // Author Extraction:
                    let author = "Unknown Author";
                    try {
                        const authorElement = await waitForAuthorElement(post);
                        if (authorElement) {
                            const href = authorElement.getAttribute('href');
                            const match = href.match(/XID=(\d+)/);
                            let authorName = authorElement.textContent.trim();

                            if (match) {
                                const userID = match[1];
                                author = (authorName && authorName !== "") ? authorName + "[" + userID + "]" : "Unknown [" + userID + "]";
                            } else {
                                author = (authorName && authorName !== "") ? authorName : author;
                            }
                        } else {
                            logError("Failed to find author element for post:", post);
                        }
                    } catch (error) {
                        logError("Error extracting author:", error);
                    }

                    // Content Extraction:
                    let content = "";
                    try {
                        content = await extractContent(post);
                    } catch (error) {
                        logError("Error extracting content:", error);
                        content = "Error extracting content.";
                    }

                    // Timestamp Extraction:
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

    /**
     * Waits for an element to be present in the DOM using a polling mechanism.
     * @param {string} selector - The CSS selector of the element to wait for.
     * @param {number} timeout - The maximum time to wait in milliseconds.
     * @returns {Promise<HTMLElement>} A promise that resolves with the element when it's found or null if timed out.
     */
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

    // --- Updated Initialization ---
    async function initializeExtraction() {
        logDebug("initializeExtraction called");
        try {
            if (isExtracting) {
                logDebug("Extraction already in progress. Skipping.");
                return;
            }

            isExtracting = true;

            // Extract posts from the current forum page
            const newExtractedData = await extractPosts();

            // Format and display the extracted data
            const discordFormattedPosts = await formatForDiscord(newExtractedData);
            addCopyButton(discordFormattedPosts);

        } catch (error) {
            logError("Error initializing extraction:", error);
            displayNotification(`Error initializing extraction: ${error.message}`, true);
        } finally {
            isExtracting = false;
        }
    }

    // --- Initial Setup ---
    const storedApiKey = GM_getValue("tornApiKey");
    if (!storedApiKey) {
        promptForApiKey();
    } else {
        config.apiKey = storedApiKey;
        waitForElement('.thread-list', 30000) // Updated selector
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
