// ==UserScript==
// @name         Torn Forum to Discord Post
// @namespace    https://github.com/gnsc4
// @version      1.0.65
// @description  Sends Torn Forum posts to Discord via webhook
// @author       GNSC4 [2779998]
// @match        https://www.torn.com/forums.php*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @grant        GM_getResouceText
// @grant        GM_getResourceURL
// @connect      discord.com
// @connect      api.torn.com
// @resource     turndown https://unpkg.com/turndown/dist/turndown.js
// @require      https://unpkg.com/turndown/dist/turndown.js
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    const settings = {
        torn: {
            api: {
                key: "",
                keyLevel: "" // Automatically detected: '', 'user', or 'faction'
            },
            img: {
                default: {
                    alt: "torn",
                    url: "https://cdn4.iconfinder.com/data/icons/various-icons-2/48/v-07-512.png",
                },
                show: {
                    url: false,
                }
            }
        },
        discord: {
            webhook: {
                url: "",
                username: "",
                avatar_url: ""
            },
            img: {
                size: 25
            }
        },
        debug: {
            mode: true, // Enable debug mode here
            log: {
                all: true, // Enable verbose logging here
            }
        },
        cache: {
            enabled: true,
            expiration: 60, // minutes
        },
        selectedPosts: [] // Array to store selected posts (post IDs)
    };

    // --- Helper Functions ---

    const debug = (...args) => {
        if (settings.debug.mode) {
            console.debug('[T2D]', ...args);
        }
    };

    const log = (...args) => {
        if (settings.debug.log.all) {
            console.log('[T2D]', ...args);
        }
    };

    // --- API Functions ---

    // Function to check API key level using /key/ endpoint
    const checkApiKeyLevel = async (apiKey) => {
        debug(`[checkApiKeyLevel] Checking API key level for key: ${apiKey}`);
        try {
            const response = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: `https://api.torn.com/key/?selections=info&key=${apiKey}&comment=TornForumToDiscordScript-KeyCheck`,
                    onload: (response) => {
                        if (response.status === 200) {
                            resolve(response);
                        } else {
                            debug(`[checkApiKeyLevel] API request failed with status: ${response.status}`);
                            reject(response);
                        }
                    },
                    onerror: (error) => {
                        debug(`[checkApiKeyLevel] API request error:`, error);
                        reject(error);
                    }
                });
            });

            const data = JSON.parse(response.responseText);

            if (data.error) {
                debug('[checkApiKeyLevel] Key check failed:', data.error);
                return ''; // Invalid key or other error
            } else {
                debug('[checkApiKeyLevel] Key information:', data);
                let keyLevel = '';
                switch (data.access_level) {
                    case 0:
                        keyLevel = ''; // Invalid Key
                        break;
                    case 1:
                        keyLevel = 'user'; // User Level
                        break;
                    case 2:
                        keyLevel = 'user'; // Minimal Access - treating as User level
                        break;
                    case 3:
                        keyLevel = 'faction'; // Limited Access
                        break;
                    case 4:
                        keyLevel = 'faction'; // Full Access
                        break;
                    default:
                        keyLevel = ''; // Unknown
                        break;
                }
                debug(`[checkApiKeyLevel] Detected key level: ${keyLevel}`);
                return keyLevel;
            }
        } catch (error) {
            console.error(`[checkApiKeyLevel] Error checking API key level: ${error}`);
            return ''; // Error
        }
    };

    // Generic function to fetch data from Torn API
    const fetchTornApi = async (endpoint, selections = '', id = '') => {
        const apiKey = settings.torn.api.key;
        const keyLevel = settings.torn.api.keyLevel;
        const cacheKey = `<span class="math-inline">\{endpoint\}\-</span>{id}-${selections}`;

        debug(`[fetchTornApi] Fetching ${endpoint} data with ID ${id} and selections ${selections}`);

        // Check cache first
        const cachedData = getCache(cacheKey);
        if (cachedData) {
            debug(`[fetchTornApi] Fetched data from cache for ${cacheKey}`);
            return cachedData;
        }

        // Determine the appropriate API endpoint based on key level
        let url;
        if (endpoint === 'user' && id && keyLevel === 'user') {
            url = `https://api.torn.com/user/<span class="math-inline">\{id\}?selections\=</span>{selections}&key=${apiKey}&comment=TornForumToDiscordScript`;
        } else if (endpoint === 'faction' && id && keyLevel === 'faction') {
            url = `https://api.torn.com/faction/<span class="math-inline">\{id\}?selections\=</span>{selections}&key=${apiKey}&comment=TornForumToDiscordScript`;
        } else if (endpoint === 'user' && keyLevel === 'faction') {
            url = `https://api.torn.com/user/?selections=<span class="math-inline">\{selections\}&key\=</span>{apiKey}&comment=TornForumToDiscordScript`;
        } else if (endpoint === 'faction' && keyLevel === 'faction') {
            url = `https://api.torn.com/faction/?selections=<span class="math-inline">\{selections\}&key\=</span>{apiKey}&comment=TornForumToDiscordScript`;
        } else if (endpoint === 'thread' && id && keyLevel === 'faction') {
            url = `https://api.torn.com/torn/<span class="math-inline">\{id\}?selections\=</span>{selections}&key=${apiKey}&comment=TornForumToDiscordScript`;
        } else {
            debug(`[fetchTornApi] Insufficient API key level or invalid endpoint for ${endpoint}`);
            return null;
        }

        try {
            const response = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: url,
                    onload: (response) => {
                        if (response.status === 200) {
                            debug(`[fetchTornApi] API request successful: ${response.status}`);
                            resolve(response);
                        } else {
                            debug(`[fetchTornApi] API request failed with status: ${response.status}`);
                            reject(response);
                        }
                    },
                    onerror: (error) => {
                        debug(`[fetchTornApi] API request error:`, error);
                        reject(error);
                    }
                });
            });

            const data = JSON.parse(response.responseText);

            if (data.error) {
                console.error('[fetchTornApi] API Error:', data.error);
                return null;
            }

            // Cache the data
            setCache(cacheKey, data, settings.cache.expiration);
            debug(`[fetchTornApi] Fetched data from API for ${cacheKey}`);
            return data;
        } catch (error) {
            console.error(`[fetchTornApi] Error fetching Torn API data: ${error}`);
            return null;
        }
    };

    // --- Content Parsing ---
    const parseContent = async (content) => {
        debug('[parseContent] Started parsing content');
        debug('[parseContent] Content before parsing:', content);
    
        try {
            // Initialize Turndown service with desired options
            const turndownService = new TurndownService({
                headingStyle: 'atx', // Use '#' for headings
                codeBlockStyle: 'fenced', // Use fenced code blocks (```)
            });
    
            // Add a custom rule for Torn's [player] tags
            turndownService.addRule('playerTag', {
                filter: function (node, options) {
                    return (
                        node.nodeName === 'A' &&
                        node.href &&
                        node.href.includes('profiles.php?XID=')
                    );
                },
                replacement: function (content, node, options) {
                    const playerId = node.href.split('=')[1];
                    debug(`[parseContent] Parsing player ID: ${playerId}`);
                    // No need to await here, just return the formatted string
                    return `[${content}](https://www.torn.com/profiles.php?XID=${playerId})`;
                }
            });
            
            // Add a custom rule for Torn's [faction] tags
            turndownService.addRule('factionTag', {
                filter: function (node, options) {
                    return (
                        node.nodeName === 'A' &&
                        node.href &&
                        node.href.includes('factions.php?step=profile&ID=')
                    );
                },
                replacement: function (content, node, options) {
                    const factionId = node.href.split('=')[2];
                    debug(`[parseContent] Parsing faction ID: ${factionId}`);
                    // No need to await here, just return the formatted string
                    return `[${content}](https://www.torn.com/factions.php?step=profile&ID=${factionId})`;
                }
            });
    
            // Convert the content using Turndown
            let parsedContent = turndownService.turndown(content);
    
            debug('[parseContent] Parsed content:', parsedContent);
            return parsedContent;
        } catch (error) {
            console.error(`[parseContent] Error parsing content: ${error}`);
            return content; // Fallback to original content in case of error
        }
    };

    // --- Discord Functions ---
    const postToDiscord = async (content) => {
        const webhookUrl = settings.discord.webhook.url;
        const username = settings.discord.webhook.username;
        const avatarUrl = settings.discord.webhook.avatar_url;

        debug(`[postToDiscord] Posting to Discord webhook: ${webhookUrl}`);

        if (!webhookUrl) {
            console.error('[postToDiscord] Webhook URL is not set.');
            return;
        }

        try {
            const response = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "POST",
                    url: webhookUrl,
                    headers: {
                        "Content-Type": "application/json",
                    },
                    data: JSON.stringify({
                        username: username,
                        avatar_url: avatarUrl,
                        content: content,
                    }),
                    onload: (response) => {
                        debug("[postToDiscord] Post response:", response);
                        if (response.status === 204 || response.status === 200) {
                            debug("[postToDiscord] Post successful");
                            resolve(response);
                        } else {
                            debug(`[postToDiscord] Post failed with status: ${response.status}`);
                            reject(response);
                        }
                    },
                    onerror: (error) => {
                        debug(`[postToDiscord] Post error:`, error);
                        reject(error);
                    }
                });
            });

            // Handle response or error if needed
        } catch (error) {
            console.error(`[postToDiscord] Error posting to Discord:`, error);

            if (error.status) {
                try {
                    const errorBody = JSON.parse(error.responseText);
                    console.error(`[postToDiscord] Discord API Error:`, errorBody);
                } catch (e) {
                    console.error(`[postToDiscord] Error parsing Discord API response:`, e);
                }
            }
        }
    };

    // --- Post Selection Functions ---

    const selectPost = (postId) => {
        debug(`[selectPost] Selecting post with ID: ${postId}`);
        const index = settings.selectedPosts.indexOf(postId);
        if (index > -1) {
            settings.selectedPosts.splice(index, 1); // Remove post if already selected
            debug(`[selectPost] Removed post ${postId} from selection`);
        } else {
            settings.selectedPosts.push(postId); // Add post if not selected
            debug(`[selectPost] Added post ${postId} to selection`);
        }
        updateSelectedPostsDisplay();
    };

    // --- Select All Posts in Thread ---
    const selectAllPostsInThread = async (threadId) => {
        debug(`[selectAllPostsInThread] Selecting all posts in thread: ${threadId}`);
        try {
            const threadData = await fetchTornApi('thread', '', threadId);
            if (threadData && threadData.thread.postIds) {
                const postIds = threadData.thread.postIds;
                debug(`[selectAllPostsInThread] Found post IDs: ${postIds.join(', ')}`);
                for (const postId of postIds) {
                    selectPost(postId);
                }
            } else {
                console.error(`[selectAllPostsInThread] Could not fetch posts for thread ID: ${threadId}`);
            }
        } catch (error) {
            console.error(`[selectAllPostsInThread] Error selecting all posts in thread: ${error}`);
        }
    };

    // --- Send Selected Posts ---
    const sendSelectedPosts = async () => {
        debug(`[sendSelectedPosts] Sending ${settings.selectedPosts.length} selected posts`);
        let sendError = false;
        for (const postId of settings.selectedPosts) {
            try {
                const postElement = document.querySelector(`li[data-id="${postId}"] .post-container .post`);
                if (postElement) {
                    const content = postElement.innerHTML;
                    debug(`[sendSelectedPosts] Content for post ${postId}: ${content}`);
                    const parsedContent = await parseContent(content);
                    debug(`[sendSelectedPosts] Parsed content for post ${postId}: ${parsedContent}`);
                    if (parsedContent) {
                        await postToDiscord(parsedContent);
                        debug(`[sendSelectedPosts] Sent post ${postId} to Discord`);
                    } else {
                        console.error(`[sendSelectedPosts] Parsed content is empty for post ${postId}`);
                        sendError = true; // Set error flag
                    }
                } else {
                    debug(`[sendSelectedPosts] Could not find post element for post ID: ${postId}`);
                }
            } catch (error) {
                console.error(`[sendSelectedPosts] Error sending post ${postId}: ${error}`);
                sendError = true; // Set error flag
            }
        }
    
        // Clear the selection only if no error occurred
        if (!sendError) {
            settings.selectedPosts = [];
            updateSelectedPostsDisplay();
            debug('[sendSelectedPosts] Selected posts cleared');
        } else {
            debug('[sendSelectedPosts] Some posts were not sent due to errors. Selected posts not cleared.');
        }
    };

    const updateSelectedPostsDisplay = () => {
        debug(`[updateSelectedPostsDisplay] Updating selected posts display`);
        const selectedPostsDisplay = document.getElementById("selected-posts-display");
        if (selectedPostsDisplay) {
            selectedPostsDisplay.textContent = `Selected Posts: ${settings.selectedPosts.length}`;
        } else {
            debug(`[updateSelectedPostsDisplay] Could not find selected posts display element`);
        }
    };

    // --- Post Processing ---

    let processingPosts = false; // Flag to prevent processPosts from running concurrently


    const processPosts = async () => {
        // Check if processPosts is already running
        if (processingPosts) {
            debug(`[processPosts] processPosts is already running, skipping this run.`);
            return;
        }

        processingPosts = true; // Set the flag to indicate that processing is in progress
        debug(`[processPosts] Starting processPosts`);

        try {
            const isThreadListView = window.location.href.includes("forums.php#/p=threads&f=") && !window.location.href.includes("forums.php#/p=thread");
            const isThreadPage = window.location.href.includes("forums.php#/p=thread");

            debug(`[processPosts] isThreadListView: ${isThreadListView}`);
            debug(`[processPosts] isThreadPage: ${isThreadPage}`);

            if (isThreadListView) {
                // Code to add "Select Thread" buttons to thread list
                const threads = document.querySelectorAll("div.thread-list-item > div.wrap");
                debug(`[Threads] Found ${threads.length} threads`);

                for (const thread of threads) {
                    // Extract thread ID from the link within the thread element
                    const threadLink = thread.querySelector('a[href*="forums.php#/p=thread"]');
                    if (!threadLink) {
                        debug(`[Threads] Thread link not found for thread:`, thread);
                        continue;
                    }
                    const threadIdMatch = threadLink.href.match(/&t=(\d+)/);
                    if (!threadIdMatch) {
                        debug(`[Threads] Thread ID not found in link:`, threadLink.href);
                        continue;
                    }
                    const threadId = threadIdMatch[1];

                    // Check if thread already processed
                    if (!thread.dataset.threadId) {
                        // Add a "Select Thread" button to each thread
                        const selectButton = document.createElement("button");
                        selectButton.textContent = "Select Thread";
                        selectButton.classList.add("select-post-button");
                        selectButton.addEventListener("click", () => {
                            selectAllPostsInThread(threadId);
                            selectButton.classList.toggle("selected"); // Toggle visual indicator
                        });

                        // Find the thread info wrap element to insert the button
                        const threadInfoWrap = thread.querySelector(".thread-info-wrap");
                        if (threadInfoWrap) {
                            debug(`[Threads] Inserting button for thread: ${threadId}`);
                            threadInfoWrap.appendChild(selectButton);
                        } else {
                            console.error(`[Threads] Could not find the thread info wrap for thread: ${threadId}`);
                        }

                        // Set data-thread attribute to mark as processed
                        thread.setAttribute("data-thread", threadId);
                    }
                }
            } else if (isThreadPage) {
                // Code to add "Select Post" buttons to individual posts
                debug(`[processPosts] Processing thread page`);

                // Use waitForPosts to ensure posts are loaded
                const posts = await waitForPosts();
                debug(`[processPosts] Found ${posts.length} posts with data-id`);

                for (const post of posts) {
                    const postId = post.dataset.id;
                    if (!postId) {
                        debug(`[processPosts] Post ID not found for post:`, post);
                        continue;
                    }

                    // Check if the post has already been processed
                    if (!post.dataset.processed) {
                        debug(`[processPosts] Processing post with ID: ${postId}`);

                        // Add a "Select Post" button to each post
                        const selectButton = document.createElement("button");
                        selectButton.textContent = "Select Post";
                        selectButton.classList.add("select-post-button");
                        selectButton.style.order = '-1';
                        selectButton.addEventListener("click", () => {
                            selectPost(postId);
                            selectButton.classList.toggle("selected");
                        });

                        // Find the action bar and append the button
                        const actionBar = post.querySelector(".action-wrap");
                        if (actionBar) {
                            debug(`[processPosts] Inserting button for post: ${postId}`);
                            actionBar.insertBefore(selectButton, actionBar.firstChild);
                        } else {
                            console.error(`[processPosts] Could not find the action bar element for post: ${postId}`);
                        }

                        // Set data-post attribute and mark as processed
                        post.setAttribute("data-post", postId);
                        post.dataset.processed = "true";
                    } else {
                        debug(`[processPosts] Post with ID ${postId} already processed. Skipping.`);
                    }
                }
            }

            // Add a "Send Selected Posts" button (only if not already present)
            if (!document.getElementById("send-selected-posts-button")) {
                debug(`[processPosts] Adding "Send Selected Posts" button`);
                const sendButton = document.createElement("button");
                sendButton.textContent = "Send Selected Posts";
                sendButton.id = "send-selected-posts-button";
                sendButton.addEventListener("click", sendSelectedPosts);

                const selectedPostsDisplay = document.createElement("div");
                selectedPostsDisplay.id = "selected-posts-display";
                selectedPostsDisplay.textContent = `Selected Posts: 0`;

                const target = document.querySelector("#forums-page-wrap");
                if (target) {
                    debug(`[processPosts] Inserting "Send Selected Posts" button`);
                    target.parentNode.insertBefore(sendButton, target);
                    target.parentNode.insertBefore(selectedPostsDisplay, target);
                } else {
                    console.error("[processPosts] Could not find the target element to insert the Send button and display.");
                }
            }
        } catch (error) {
            console.error(`[processPosts] Error in processPosts: ${error}`);
        } finally {
            processingPosts = false; // Reset the flag when processing is complete
        }
    };

    // --- Helper Function to Wait for Posts ---
    const waitForPosts = () => {
        debug(`[waitForPosts] Waiting for posts to load`);
        return new Promise((resolve) => {
            const timeout = 10000; // Timeout after 10 seconds
            const interval = 100; // Check every 100 milliseconds
            let elapsedTime = 0;

            const checkPosts = () => {
                const posts = document.querySelectorAll("li[data-id]");
                if (posts.length > 0) {
                    debug(`[waitForPosts] Found ${posts.length} posts`);
                    resolve(posts);
                } else {
                    elapsedTime += interval;
                    if (elapsedTime < timeout) {
                        debug(`[waitForPosts] No posts found yet, checking again in ${interval}ms`);
                        setTimeout(checkPosts, interval);
                    } else {
                        debug(`[waitForPosts] Timeout reached, no posts found`);
                        resolve([]); // Resolve with an empty array if no posts are found after timeout
                    }
                }
            };

            checkPosts();
        });
    };

    // --- Mutation Observer ---
    let observer = new MutationObserver(async (mutations) => {
        debug('[MutationObserver] A change was detected in the DOM, re-running processPosts');
        processPosts();
    });

    // --- GUI Functions ---

    const createGUI = () => {
        // Load saved settings
        loadSettings();

        // Create a container for the GUI
        const guiContainer = document.createElement("div");
        guiContainer.id = "torn-to-discord-gui";
        document.body.appendChild(guiContainer);

        // Create the API Key section
        const apiKeySection = document.createElement("div");
        apiKeySection.innerHTML = `
            <h3>Torn API Key</h3>
            <input type="text" id="api-key" placeholder="Enter your Torn API key" value="${settings.torn.api.key}">
            <p class="help-text api-key-level-text"></p>
        `;
        guiContainer.appendChild(apiKeySection);

        // Set the initial API key level text based on saved settings
        const apiKeyLevelText = guiContainer.querySelector(".api-key-level-text");
        if (apiKeyLevelText) {
            apiKeyLevelText.textContent = settings.torn.api.keyLevel ? `Key Level: ${settings.torn.api.keyLevel === "faction" ? "Faction (or higher)" : "User"}` : '';
        }

        // Create the Discord Webhook section
        const discordSection = document.createElement("div");
        discordSection.innerHTML = `
            <h3>Discord Webhook</h3>
            <input type="text" id="webhook-url" placeholder="Enter your Discord webhook URL" value="<span class="math-inline">\{settings\.discord\.webhook\.url\}"\>
<input type\="text" id\="webhook\-username" placeholder\="Enter a custom username \(optional\)" value\="</span>{settings.discord.webhook.username}">
            <input type="text" id="webhook-avatar" placeholder="Enter a custom avatar URL (optional)" value="${settings.discord.webhook.avatar_url}">
        `;
        guiContainer.appendChild(discordSection);

        // Create the Help section
        const helpSection = document.createElement("div");
        helpSection.innerHTML = `
            <h3>Help</h3>
            <p class="help-text"><b>Torn API Key:</b> You can find your API key at <a href="https://www.torn.com/preferences.php#tab=api" target="_blank">https://www.torn.com/preferences.php#tab=api</a></p>
            <p class="help-text"><b>API Key Level:</b></p>
            <ul class="help-text">
                <li><b>User Level:</b> Required for reading user-related information (e.g., player names from forum posts).</li>
                <li><b>Faction Level:</b> Required if you want to fetch faction names from faction links in forum posts.</li>
            </ul>
            <p class="help-text"><b>Discord Webhook:</b> To create a webhook, go to your Discord server settings -> Integrations -> Webhooks -> New Webhook.</p>
            <p class="help-text"><b>Webhook URL:</b> Enter the URL of your Discord webhook. This is required for the script to function.</p>
            <p class="help-text"><b>Custom Username (Optional):</b> You can specify a custom username that will be displayed with each message sent to Discord. Leave this blank to use the default webhook username.</p>
            <p class="help-text"><b>Custom Avatar URL (Optional):</b> You can specify a custom avatar URL for the messages sent to Discord. Leave this blank to use the default webhook avatar.</p>
        `;
        guiContainer.appendChild(helpSection);

        // Create the Save button
        const saveButton = document.createElement("button");
        saveButton.id = "save-settings-button";
        saveButton.textContent = "Save Settings";
        saveButton.addEventListener("click", saveSettings);
        guiContainer.appendChild(saveButton);

        // Create the Close button
        const closeButton = document.createElement("button");
        closeButton.id = "close-gui-button";
        closeButton.textContent = "Close";
        closeButton.addEventListener("click", () => {
            guiContainer.style.display = "none";
        });
        guiContainer.appendChild(closeButton);

    };

    // --- Settings Functions ---

    const saveSettings = async () => {
        try {
            debug('[saveSettings] Saving settings');
            // Torn API Key
            settings.torn.api.key = document.getElementById("api-key").value;
            settings.torn.api.keyLevel = await checkApiKeyLevel(settings.torn.api.key);

            // Update the API key level display in the GUI
            const apiKeyLevelText = document.querySelector(".api-key-level-text");
            if (apiKeyLevelText) {
                apiKeyLevelText.textContent = settings.torn.api.keyLevel ? `Key Level: ${settings.torn.api.keyLevel === "faction" ? "Faction (or higher)" : "User"}` : '';
            }

            // Discord Webhook
            settings.discord.webhook.url = document.getElementById("webhook-url").value;
            settings.discord.webhook.username = document.getElementById("webhook-username").value;
            settings.discord.webhook.avatar_url = document.getElementById("webhook-avatar").value;

            // Save settings using GM_setValue
            GM_setValue("torn_api_key", settings.torn.api.key);
            GM_setValue("torn_api_key_level", settings.torn.api.keyLevel);
            GM_setValue("discord_webhook_url", settings.discord.webhook.url);
            GM_setValue("discord_webhook_username", settings.discord.webhook.username);
            GM_setValue("discord_webhook_avatar_url", settings.discord.webhook.avatar_url);

            alert("Settings saved!");
        } catch (error) {
            console.error(`[saveSettings] Error saving settings: ${error}`);
        }
    };

    const loadSettings = () => {
        // Load settings using GM_getValue
        debug('[loadSettings] Loading settings');
        settings.torn.api.key = GM_getValue("torn_api_key", "");
        settings.torn.api.keyLevel = GM_getValue("torn_api_key_level", "");
        settings.discord.webhook.url = GM_getValue("discord_webhook_url", "");
        settings.discord.webhook.username = GM_getValue("discord_webhook_username", "");
        settings.discord.webhook.avatar_url = GM_getValue("discord_webhook_avatar_url", "");
        debug('[loadSettings] Loaded settings:', settings);
    };

    // --- CSS Styles ---

    const addStyles = () => {
        GM_addStyle(`
            #torn-to-discord-gui {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: #36393f; /* Dark gray background */
                border: 1px solid #ccc;
                padding: 20px;
                z-index: 1000;
                font-family: Arial, sans-serif;
                color: white; /* White text color */
            }

            #torn-to-discord-gui h3 {
                margin-top: 0;
                color: white; /* White text for headings */
            }

            #torn-to-discord-gui input[type="text"] {
                width: calc(100% - 22px); /* Adjust width to fix formatting */
                padding: 5px;
                margin-bottom: 10px;
                border: 1px solid #ccc;
                background-color: #40444b; /* Slightly darker background for inputs */
                color: white; /* White text for inputs */
            }

            #torn-to-discord-gui select {
                width: 100%;
                padding: 5px;
                margin-bottom: 10px;
                border: 1px solid #ccc;
                background-color: #40444b; /* Slightly darker background for select */
                color: white; /* White text for select */
            }

            #torn-to-discord-gui button {
                padding: 8px 15px;
                background-color: #4CAF50;
                color: white;
                border: none;
                cursor: pointer;
                margin-right: 5px;
            }

            #torn-to-discord-gui button:hover {
                background-color: #3e8e41;
            }

            #torn-to-discord-gui ul {
                padding-left: 20px;
                margin-top: 5px;
            }

            #torn-to-discord-gui a { /* Style for links */
                color: #1b87e5; /* Light blue link color */
                text-decoration: none;
            }

            #torn-to-discord-gui a:hover {
                text-decoration: underline;
            }

            .api-key-level-text {
                margin-top: -5px;
                margin-bottom: 10px;
            }

            #torn-to-discord-gui .help-text { /* Class for help text - slightly less bright */
                color: #ccc;
            }

            .select-post-button {
                padding: 5px 10px;
                background-color: #7289da; /* Discord Blue */
                color: white;
                border: none;
                cursor: pointer;
                margin-right: 5px;
                border-radius: 5px; /* Rounded corners */
                font-size: 12px; /* Smaller font size */
            }

            .select-post-button:hover {
                background-color: #677bc4; /* Darker shade on hover */
                }

            .select-post-button.selected {
                background-color: #5b6e9e; /* Even darker shade for selected state */
            }

            #send-selected-posts-button {
                padding: 8px 15px;
                background-color: #04aa6d;
                color: white;
                border: none;
                cursor: pointer;
                margin-top: 10px;
                font-size: 16px;
            }

            #send-selected-posts-button:hover {
                background-color: #048a58;
            }

            #selected-posts-display {
                margin-top: 5px;
                font-size: 14px;
            }

            #save-settings-button, #close-gui-button {
                margin: 5px;
                padding: 8px 16px;
                font-size: 14px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }
            #close-gui-button{
                background-color: #dc3545;
            }
            #close-gui-button:hover{
                background-color: #c82333;
            }
            #save-settings-button {
                background-color: #28a745;
            }
            #save-settings-button:hover {
                background-color: #218838;
            }
        `);
    };

    // --- Script Initialization ---
    const init = () => {
        debug('[init] Initializing script');
        settings.debug.mode = true;
        settings.debug.log.all = true;
    
        // Load and add CSS styles
        addStyles();
        debug('[init] Styles added');
    
        // Create the settings GUI
        createGUI();
        debug('[init] GUI created');
    
        // Hide GUI on startup
        const gui = document.getElementById("torn-to-discord-gui");
        if (gui) {
            gui.style.display = "none";
            debug('[init] GUI hidden on startup');
        } else {
            debug('[init] GUI element not found');
        }
    
        // Add a button to toggle the GUI
        const toggleButton = document.createElement("button");
        toggleButton.textContent = "T2D Settings";
        toggleButton.style.position = "fixed";
        toggleButton.style.top = "10px";
        toggleButton.style.right = "10px";
        toggleButton.style.zIndex = 999;
        toggleButton.addEventListener("click", () => {
            const gui = document.getElementById("torn-to-discord-gui");
            if (gui) {
                gui.style.display = gui.style.display === "none" ? "block" : "none";
            } else {
                debug('[init] GUI element not found when toggling');
            }
        });
        document.body.appendChild(toggleButton);
        debug('[init] GUI toggle button added');
    
        // Get the target node for the observer
        const targetNode = document.querySelector('#forums-page-wrap');
    
        // Start observing for changes after a delay
        if (targetNode) {
            // Set up the observer
            observer.observe(targetNode, {
                childList: true,
                subtree: true
            });
            debug('[init] Observer set up to watch for new posts within #forums-page-wrap');
    
            // Initial processing of posts after a delay
            setTimeout(() => {
                debug('[init] Processing initial posts after delay');
                processPosts();
            }, 2000);
        } else {
            console.error('[init] Target node #forums-page-wrap not found.');
        }
    };
    
    // --- Start the script ---
    
    init();
    
    })();