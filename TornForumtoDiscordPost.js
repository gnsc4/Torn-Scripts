// ==UserScript==
// @name         Torn Forum Post Extractor for Discord
// @namespace    https://www.torn.com/
// @version      0.75
// @description  Extracts Torn forum posts and formats them for Discord
// @author       GNSC4 [268863]
// @include      https://www.torn.com/forums.php*
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function() {
    'use strict';

    // --- Configuration (User-Customizable) ---
    const config = {
        targetAuthor: "",           // Optional: Specify a target author (case-sensitive). Leave empty to extract all.
        highlightKeywords: [],      // Optional: Add keywords (case-insensitive) to highlight.
        codeBlockKeywords: ["```", "[code]"], // Optional: Add keywords that trigger a code block (case-insensitive). Defaults are for Torn syntax.
        includeAuthorNames: true,     // Whether to include author names in the output.
        maxPostsToExtract: 100,       // Maximum number of posts to extract per page (set to -1 for unlimited).
        maxDataAge: 60 * 60 * 1000,   // Maximum age of data in milliseconds (1 hour).
        maxForumsToStore: 10,         // Maximum number of forums to store data for.
        notificationTimeout: 3000,    // Timeout for the notification message (in milliseconds).
        debugMode: true,            // Enable debug logging to the console.
        retryDelay: 500,             // Delay between retries when waiting for elements to load (in milliseconds).
        maxCopyLength: 2000,         // Maximum length of text to copy to clipboard, in characters
        authorElementTimeout: 5000   // Timeout for waiting for author element
    };

    // --- Global Variables ---
    let extractedData = [];         // Array to store extracted data across multiple forums
    let isExtracting = false;       // Flag to prevent concurrent extractions
    let observer = null;            // Global variable for the mutation observer
    let highlightKeywordsRegex = null; // Global variable for precompiled regex for keyword highlighting

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
     * Formats the extracted data for Discord, including nested quote handling.
     * @param {Array} data The extracted post data.
     * @returns {Promise<string>} The formatted string ready for Discord.
     */
    async function formatForDiscord(data) {
        logDebug("formatForDiscord called with data:", data);
        const formatPromises = data.map(async (post) => {
            let formattedContent = post.content;

            // Highlight keywords (optimized)
            if (highlightKeywordsRegex) {
                formattedContent = formattedContent.replace(highlightKeywordsRegex, "**$1**");
            }

            // Format code blocks based on specified keywords.
            config.codeBlockKeywords.forEach(keyword => {
                if (formattedContent.includes(keyword) && !formattedContent.startsWith("`") && !formattedContent.endsWith("`")) {
                    formattedContent = "`" + formattedContent + "`";
                }
            });

            // Include author names if enabled
            if (config.includeAuthorNames) {
                return `**${post.author}:**\n${formattedContent}`;
            } else {
                return `${formattedContent}`;
            }
        });

        const discordFormattedPosts = await Promise.all(formatPromises);
        logDebug("formatForDiscord returning:", discordFormattedPosts.join('\n\n---\n\n'));
        return discordFormattedPosts.join('\n\n---\n\n');
    }

    /**
     * Adds or updates the copy button to the page.
     * @param {string} formattedPosts The formatted text to copy.
     */
    function addCopyButton(formattedPosts) {
        logDebug("Adding copy button with formatted posts (summary):", formattedPosts.length, "posts");

        // Remove any existing button
        const existingButton = document.querySelector('#copy-forum-posts-button');
        if (existingButton) {
            existingButton.remove();
        }

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

        button.addEventListener('click', function() {
            copyToClipboard(formattedPosts);
        });

        document.body.appendChild(button);
    }

    /**
     * Copies the formatted posts to the clipboard, with a limit for very long text.
     * @param {string} formattedPosts The formatted text to copy.
     */
    function copyToClipboard(formattedPosts) {
        logDebug("copyToClipboard called with formattedPosts (summary):", formattedPosts.length, "characters");
        if (formattedPosts.length > config.maxCopyLength) {
            const truncatedPosts = formattedPosts.substring(0, config.maxCopyLength) + "... (truncated)";
            navigator.clipboard.writeText(truncatedPosts)
                .then(() => {
                    logDebug("Copied truncated text to clipboard (summary):", truncatedPosts.length, "characters");
                    displayNotification(`The text was too long (${formattedPosts.length} characters) and has been truncated for copying to ${config.maxCopyLength} characters.`);
                    updateCopyButtonText();
                })
                .catch(err => {
                    logError('Failed to copy: ', err);
                    displayNotification("Failed to copy posts.", true);
                });
        } else {
            // Normal copying (no truncation)
            navigator.clipboard.writeText(formattedPosts)
                .then(() => {
                    logDebug("Copied to clipboard (summary):", formattedPosts.length, "characters");
                    displayNotification("Forum posts copied to clipboard!");
                    updateCopyButtonText();
                })
                .catch(err => {
                    logError('Failed to copy: ', err);
                    displayNotification("Failed to copy posts.", true);
                });
        }
    }

    /**
     * Updates the copy button text.
     */
    function updateCopyButtonText() {
        logDebug("updateCopyButtonText called");
        const button = document.querySelector('#copy-forum-posts-button');
        if (button) {
            button.textContent = 'Copied!';
            setTimeout(() => button.textContent = 'Copy to Clipboard', 2000);
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

    /**
     * Waits for the author element within a post to be fully loaded and visible.
     * @param {HTMLElement} post The post element to search within.
     * @returns {Promise<HTMLElement>} A promise that resolves with the author element when it's found and visible.
     */
    async function waitForAuthorElement(post) {
        logDebug("waitForAuthorElement called with post:", post);
        return new Promise((resolve) => {
            const startTime = Date.now();
            const timeout = 10000; // 10 seconds timeout

            const checkAuthor = () => {
                const authorElement = post.querySelector('.user.left a[href*="profiles.php"]') ||
                                    post.querySelector('.heading-name a[href*="profiles.php"]') ||
                                    post.querySelector('.first-post .user-name a[href*="profiles.php"]');
                if (authorElement) {
                    const authorName = authorElement.textContent.trim();
                    if (authorName !== "" && !/^\[\d+\]$/.test(authorName)) {
                        logDebug("Author element found:", authorElement);
                        resolve(authorElement);
                        return;
                    }
                }

                if (Date.now() - startTime > timeout) {
                    logError("Timeout waiting for author element in post:", post);
                    resolve(null);
                    return;
                }

                setTimeout(checkAuthor, config.retryDelay);
            };

            checkAuthor();
        });
    }

    /**
     * Extracts the content from a post, handling text and YouTube embeds.
     * @param {HTMLElement} post The post element to extract content from.
     * @returns {Promise<string>} The extracted content.
     */
    async function extractContent(post) {
        logDebug("extractContent called with post:", post);
        let content = '';
        const contentElement = post.querySelector('.post, .post-content');

        if (contentElement) {
            content = await processPostContent(contentElement);
        } else {
            const embed = post.querySelector('.iframe-wrap');
            if (embed) {
                content = "Youtube Embed.";
            }
        }

        logDebug("extractContent returning:", content);
        return content;
    }

    /**
     * Processes a post's content, handling nested quotes recursively.
     * @param {HTMLElement} element The element to process.
     * @returns {Promise<string>} The processed content.
     */
    async function processPostContent(element) {
        logDebug("processPostContent called with element:", element);
        let content = '';
        for (let node of element.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                content += node.textContent + ' ';
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.classList.contains('quote')) {
                    content += await processQuote(node);
                } else if (node.classList.contains('spoiler')) {
                    content += await processSpoiler(node);
                } else if (node.querySelector('.quote')) {
                    content += await processPostContent(node);
                } else {
                    content += node.outerHTML + ' ';
                }
            }
        }
        logDebug("processPostContent returning:", content.trim());
        return content.trim();
    }

    /**
     * Processes a quote element and formats it for Discord.
     * @param {HTMLElement} quoteElement The quote element to process.
     * @returns {Promise<string>} The formatted quote.
     */
    async function processQuote(quoteElement) {
        logDebug("processQuote called with element:", quoteElement);
        const authorElement = quoteElement.querySelector('.quote-header a[href*="profiles.php"]');
        const author = authorElement ? authorElement.textContent.trim() + ' said:' : 'Quote:';

        const quoteBody = quoteElement.querySelector('.quote-body');
        if (quoteBody) {
            const innerContent = await processPostContent(quoteBody);
            logDebug("processQuote returning:", `> **${author}**\n> ${innerContent}\n`);
            return `> **${author}**\n> ${innerContent}\n`;
        }
        logDebug("processQuote returning empty string");
        return '';
    }

    /**
     * Processes a spoiler element by extracting its content.
     * @param {HTMLElement} spoilerElement The spoiler element to process.
     * @returns {Promise<string>} The content of the spoiler.
     */
    async function processSpoiler(spoilerElement) {
        logDebug("processSpoiler called with element:", spoilerElement);
        const spoilerContent = await processPostContent(spoilerElement);
        logDebug("processSpoiler returning:", spoilerContent);
        return spoilerContent;
    }

    /**
     * Displays a notification message to the user.
     * @param {string} message The message to display.
* @param {boolean} isError Whether the message is an error message.
     */
function displayNotification(message, isError = false) {
    logDebug("displayNotification called with message:", message, "isError:", isError);
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '50px'; // Position above the copy button
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.backgroundColor = isError ? '#f44336' : '#4CAF50';
    notification.style.color = 'white';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '1000';
    notification.style.textAlign = 'center';
    notification.style.fontSize = '16px';
    notification.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';

    document.body.appendChild(notification);

    setTimeout(() => {
        document.body.removeChild(notification);
    }, config.notificationTimeout);
}

/**
 * Logs an error message to the console if debug mode is enabled.
 * @param {...any} args The arguments to log.
 */
function logError(...args) {
    if (config.debugMode) {
        console.error(...args);
    }
}

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
 * Precompiles the highlight keywords into a single regular expression.
 */
function precompileHighlightKeywords() {
    logDebug("precompileHighlightKeywords called");
    if (config.highlightKeywords.length > 0) {
        const escapedKeywords = config.highlightKeywords.map(keyword => keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        highlightKeywordsRegex = new RegExp(`\\b(${escapedKeywords.join('|')})\\b`, 'gi');
    }
}

// --- Main Execution ---

/**
 * Initializes the extraction process.
 */
async function initializeExtraction() {
    logDebug("initializeExtraction called");
    try {
        // Prevent concurrent extractions
        if (isExtracting) {
            logDebug("Extraction already in progress. Skipping.");
            return;
        }

        isExtracting = true;

        // Precompile highlight keywords regex
        precompileHighlightKeywords();

        // Get the current forum URL
        const currentForumUrl = window.location.href;

        // Remove outdated data
        extractedData = extractedData.filter(data => Date.now() - data.timestamp < config.maxDataAge);

        // Find the index of the forum data for the current URL
        const existingForumIndex = extractedData.findIndex(data => data.forumUrl === currentForumUrl);

        // If data for this forum exists, remove older data from the same forum
        if (existingForumIndex !== -1) {
            extractedData.splice(existingForumIndex, 1);
        }

        // Extract posts from the current forum page
        const newExtractedData = await extractPosts();

        // Add the current forum URL and timestamp to the extracted data
        extractedData.push({ forumUrl: currentForumUrl, timestamp: Date.now(), posts: newExtractedData });

        // Limit the number of stored forums
        if (extractedData.length > config.maxForumsToStore) {
            extractedData.shift(); // Remove the oldest forum data
        }

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

/**
 * Sets up the MutationObserver to watch for changes in the forum.
 */
function setupObserver() {
    logDebug("setupObserver called");
    // Disconnect any existing observer
    if (observer) {
        observer.disconnect();
        logDebug("Existing observer disconnected.");
    }

    // Set up a new MutationObserver
    observer = new MutationObserver(debounce(async (mutations) => {
        logDebug("Mutation observer triggered.");
        try {
            let shouldExtract = false;
            for (let mutation of mutations) {
                if (mutation.addedNodes) {
                    for (let node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.classList.contains('post-container') || node.querySelector('.post-container')) {
                                shouldExtract = true;
                                break;
                            }
                        }
                    }
                }
                if (shouldExtract) break;
            }

            if (shouldExtract) {
                logDebug("Mutation detected, initializing extraction.");
                await initializeExtraction();
            }
        } catch (error) {
            logError("Error in observer callback:", error);
            displayNotification(`Error in observer: ${error.message}`, true);
        }
    }, config.retryDelay));

    // Start observing the body for changes in the childList and subtree
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    logDebug("Mutation observer set up.");
}

// --- Helper Function ---
/**
 * Debounces a function call to prevent it from being called too frequently.
 * @param {function} func The function to debounce.
 * @param {number} wait The delay in milliseconds.
 * @returns {function} The debounced function.
 */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// --- API Key Management ---

/**
* Prompts the user to enter their API key.
*/
function promptForApiKey() {
    logDebug("promptForApiKey called");
    let apiKey = prompt("Please enter your Torn API key:");
    if (apiKey) {
        logDebug("API key entered");
        GM_setValue("tornApiKey", apiKey);
        config.apiKey = apiKey;
        
    } else {
        logError("API key prompt cancelled or empty key entered.");
        displayNotification("API key is required for the script to function.", true);
    }
}

// --- Initial Setup ---

// Check for stored API key
let storedApiKey = GM_getValue("tornApiKey");
logDebug("Stored API key:", storedApiKey);

if (storedApiKey) {
    config.apiKey = storedApiKey;
    logDebug("Using stored API key.");

    // Initialize extraction on page load after waiting for .posts-list
    waitForElement('.thread-list', 30000)
        .then(forumContainer => {
            if (forumContainer) {
                logDebug("thread-list found on page load, initializing extraction.");
                initializeExtraction()
                    .then(() => {
                        logDebug("Initial extraction completed, setting up observer.");
                        setupObserver();
                    })
                    .catch(error => {
                        logError("Error during initial extraction:", error);
                        displayNotification(`Error during initial extraction: ${error.message}`, true);
                    });
            } else {
                logError("thread-list not found within the timeout period.");
                displayNotification("Error: Forum content not detected.", true);
            }
        })
        .catch(error => {
            logError("Error waiting for thread-list:", error);
            displayNotification(`Error: ${error.message}`, true);
        });
} else {
    logDebug("No API key found.");
    promptForApiKey();
}

})();