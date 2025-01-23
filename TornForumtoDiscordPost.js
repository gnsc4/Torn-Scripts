// ==UserScript==
// @name         Torn Forum to Discord Post
// @namespace    https://github.com/gnsc4
// @version      1.0.21
// @description  Sends Torn Forum posts to Discord via webhook
// @author       GNSC4 [2779998]
// @match        https://www.torn.com/forums.php*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @connect      discord.com
// @connect      api.torn.com
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
            mode: false, // Change to true for debugging
            log: {
                all: false,
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
            console.debug(...args);
        }
    };

    const log = (...args) => {
        if (settings.debug.log.all) {
            console.log(...args);
        }
    };

    // No changes needed in loadScript, cacheKey, setCache, getCache, clearCache

    // --- API Functions ---

    // Function to check API key level using /key/ endpoint
    const checkApiKeyLevel = async (apiKey) => {
        try {
            const response = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: `https://api.torn.com/key/?selections=info&key=${apiKey}&comment=TornForumToDiscordScript-KeyCheck`,
                    onload: (response) => {
                        if (response.status === 200) {
                            resolve(response);
                        } else {
                            reject(response);
                        }
                    },
                    onerror: (error) => {
                        reject(error);
                    }
                });
            });

            const data = JSON.parse(response.responseText);

            if (data.error) {
                debug('[API Key Check] Key check failed:', data.error);
                return ''; // Invalid key or other error
            } else {
                debug('[API Key Check] Key information:', data);
                switch (data.access_level) {
                    case 0:
                        return ''; // Invalid Key
                    case 1:
                        return 'user'; // User Level
                    case 2:
                        return 'user'; // Minimal Access - treating as User level
                    case 3:
                        return 'faction'; // Limited Access
                    case 4:
                        return 'faction'; // Full Access
                    default:
                        return ''; // Unknown
                }
            }
        } catch (error) {
            console.error(`Error checking API key level: ${error}`);
            return ''; // Error
        }
    };

    // Generic function to fetch data from Torn API
    const fetchTornApi = async (endpoint, selections = '', id = '') => {
        const apiKey = settings.torn.api.key;
        const keyLevel = settings.torn.api.keyLevel;
        const cacheKey = `<span class="math-inline">\{endpoint\}\-</span>{id}-${selections}`;

        // Check cache first
        const cachedData = getCache(cacheKey);
        if (cachedData) {
            debug(`[Cache] Fetched data from cache for ${cacheKey}`);
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
        } else {
            debug(`[API] Insufficient API key level or invalid endpoint for ${endpoint}`);
            return null;
        }

        try {
            const response = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: url,
                    onload: (response) => {
                        if (response.status === 200) {
                            resolve(response);
                        } else {
                            reject(response);
                        }
                    },
                    onerror: (error) => {
                        reject(error);
                    }
                });
            });

            const data = JSON.parse(response.responseText);

            if (data.error) {
                console.error('[API Error]', data.error);
                return null;
            }

            // Cache the data
            setCache(cacheKey, data, settings.cache.expiration);
            debug(`[API] Fetched data from API for ${cacheKey}`);
            return data;
        } catch (error) {
            console.error(`[API] Error fetching Torn API data: ${error}`);
            return null;
        }
    };

    // --- Content Parsing ---

    const parseContent = async (content) => {
        const regex = /\[player=(\d+)\]|\[faction=(\d+)\]|\[link=(.*?)\](.*?)\[\/link\]|\[quote=(.*?)(?:&quot;|\u201D|\u201C)(?: timestamp=.*?)?\](.*?)\[\/quote\]|\[img=(.*?)(?:&quot;|\u201D|\u201C)(?: alt=.*?)?\](.*?)\[\/img\]|\[size=(\d+)\](.*?)\[\/size\]|\[color=(.*?)\](.*?)\[\/color\]|\[b\](.*?)\[\/b\]|\[i\](.*?)\[\/i\]|\[u\](.*?)\[\/u\]|\[s\](.*?)\[\/s\]|\[center\](.*?)\[\/center\]|\[right\](.*?)\[\/right\]|\[left\](.*?)\[\/left\]|\[list\](.*?)\[\/list\]|\[\*\](.*?)\[\/\*\]|\[code\](.*?)\[\/code\]/g;
        let parsedContent = "";
        let match;

        while ((match = regex.exec(content)) !== null) {
            const [fullMatch, playerId, factionId, linkUrl, linkText, quoteAuthor, quoteContent, imgUrl, imgAlt, sizeValue, sizeContent, colorValue, colorContent, boldContent, italicContent, underlineContent, strikethroughContent, centerContent, rightContent, leftContent, listContent, listItemContent, codeContent] = match;

            if (playerId) {
                const player = await fetchTornApi('user', 'profile', playerId);
                if (player) {
                    parsedContent += `[<span class="math-inline">\{player\.name\}\]\(https\://www\.torn\.com/profiles\.php?XID\=</span>{playerId})`;
                } else {
                    parsedContent += `[Player <span class="math-inline">\{playerId\}\]\(https\://www\.torn\.com/profiles\.php?XID\=</span>{playerId})`;
                }
            } else if (factionId) {
                const faction = await fetchTornApi('faction', 'basic', factionId);
                if (faction) {
                    parsedContent += `[<span class="math-inline">\{faction\.faction\_name\}\]\(https\://www\.torn\.com/factions\.php?step\=profile&ID\=</span>{factionId})`;
                } else {
                    parsedContent += `[Faction <span class="math-inline">\{factionId\}\]\(https\://www\.torn\.com/factions\.php?step\=profile&ID\=</span>{factionId})`;
                }
            } else if (linkUrl && linkText) {
                parsedContent += `[<span class="math-inline">\{linkText\}\]\(</span>{linkUrl})`;
            } else if (quoteAuthor && quoteContent) {
                parsedContent += `> **${quoteAuthor}:** ${quoteContent}\n`;
            } else if (imgUrl) {
                if (imgAlt) {
                    parsedContent += `\n[<span class="math-inline">\{imgAlt\}\]\(</span>{imgUrl})\n`;
                } else {
                    parsedContent += `\n${imgUrl}\n`;
                }
            } else if (sizeValue && sizeContent) {
                parsedContent += `<font size="<span class="math-inline">\{sizeValue\}"\></span>{sizeContent}</font>`;
            } else if (colorValue && colorContent) {
                parsedContent += `<font color="<span class="math-inline">\{colorValue\}"\></span>{colorContent}</font>`;
            } else if (boldContent) {
                parsedContent += `**${boldContent}**`;
            } else if (italicContent) {
                parsedContent += `*${italicContent}*`;
            } else if (underlineContent) {
                parsedContent += `<u>${underlineContent}</u>`;
            } else if (strikethroughContent) {
                parsedContent += `~~${strikethroughContent}~~`;
            } else if (centerContent) {
                parsedContent += `<center>${centerContent}</center>`;
            } else if (rightContent) {
                parsedContent += `<div align="right">${rightContent}</div>`;
            } else if (leftContent) {
                parsedContent += `<div align="left">${leftContent}</div>`;
            } else if (listContent) {
                parsedContent += `${listContent}`;
            } else if (listItemContent) {
                parsedContent += `* ${listItemContent}\n`;
            } else if (codeContent) {
                parsedContent += `\`\`\`\n${codeContent}\n\`\`\``;
            } else {
                parsedContent += fullMatch;
            }
        }

        parsedContent = parsedContent.replace(/\n/g, "  \n");
        return parsedContent;
    };

    // --- Discord Functions ---

    const postToDiscord = async (content) => {
        const webhookUrl = settings.discord.webhook.url;
        const username = settings.discord.webhook.username;
        const avatarUrl = settings.discord.webhook.avatar_url;

        if (!webhookUrl) {
            console.error('[Discord] Webhook URL is not set.');
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
                        if (response.status === 204) {
                            resolve(response);
                        } else {
                            reject(response);
                        }
                    },
                    onerror: (error) => {
                        reject(error);
                    }
                });
            });
            debug("[Discord] Post successful");
        } catch (error) {
            console.error(`[Discord] Error posting to Discord:`, error);
        }
    };

    // --- Post Selection Functions ---

    const selectPost = (postId) => {
        const index = settings.selectedPosts.indexOf(postId);
        if (index > -1) {
            settings.selectedPosts.splice(index, 1); // Remove post if already selected
            debug(`[Post Selection] Removed post ${postId} from selection`);
        } else {
            settings.selectedPosts.push(postId); // Add post if not selected
            debug(`[Post Selection] Added post ${postId} to selection`);
        }
        updateSelectedPostsDisplay();
    };

    const sendSelectedPosts = async () => {
        debug(`[Post Selection] Sending ${settings.selectedPosts.length} selected posts`);
        for (const postId of settings.selectedPosts) {
            const postElement = document.querySelector(`.post-container[data-post="${postId}"] .post`);
            if (postElement) {
                const content = postElement.innerHTML;
                const parsedContent = await parseContent(content);
                await postToDiscord(parsedContent);
                debug(`[Post Selection] Sent post ${postId} to Discord`);
            }
        }
        settings.selectedPosts = []; // Clear the selection after sending
        updateSelectedPostsDisplay();
    };

    const updateSelectedPostsDisplay = () => {
        const selectedPostsDisplay = document.getElementById("selected-posts-display");
        if (selectedPostsDisplay) {
            selectedPostsDisplay.textContent = `Selected Posts: ${settings.selectedPosts.length}`;
        }
    };

    // --- Post Processing ---

    const processPosts = async () => {
        const currentUrl = window.location.href;
        const isThreadListView = currentUrl.includes("forums.php#/p=threads&f=") && !currentUrl.includes("forums.php#/p=thread");
        const isThreadPage = currentUrl.includes("forums.php#/p=thread");

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

                // Add a "Select Thread" button to each thread
                const selectButton = document.createElement("button");
                selectButton.textContent = "Select Thread";
                selectButton.classList.add("select-post-button");
                selectButton.addEventListener("click", () => {
                    selectAllPostsInThread(threadId);
                    selectButton.classList.toggle("selected"); // Toggle visual indicator
                });

                // Find a suitable location to insert the button
                const threadTitle = thread.querySelector(".thread-title");
                if (threadTitle) {
                    debug(`[Threads] Inserting button for thread: ${threadId}`);
                    threadTitle.parentNode.insertBefore(selectButton, threadTitle.nextSibling);
                } else {
                    console.error(`[Threads] Could not find the thread title element for thread: ${threadId}`);
                }

                thread.setAttribute("data-thread", threadId);
            }

        } else if (isThreadPage) {
            // Code to add "Select Post" buttons to individual posts
            const posts = document.querySelectorAll(".post-container");
            debug(`[Posts] Found ${posts.length} posts`);

            for (const post of posts) {
                const postId = post.getAttribute("data-post");
                if (!postId) {
                    debug(`[Posts] Post ID not found for post:`, post);
                    continue;
                }

                // Add a "Select Post" button to each post
                const selectButton = document.createElement("button");
                selectButton.textContent = "Select Post";
                selectButton.classList.add("select-post-button");
                selectButton.addEventListener("click", () => {
                    selectPost(postId);
                    selectButton.classList.toggle("selected"); // Toggle visual indicator
                });

                // Find the action bar and append the button
                const actionBar = post.querySelector(".post-wrap .action-wrap");
                if (actionBar) {
                    debug(`[Posts] Inserting button for post: ${postId}`);
                    actionBar.appendChild(selectButton);
                } else {
                    console.error(`[Posts] Could not find the action bar element for post: ${postId}`);
                }

                post.setAttribute("data-post", postId);
            }
        }

        // Add a "Send Selected Posts" button (only if not already present)
        if (!document.getElementById("send-selected-posts-button")) {
            const sendButton = document.createElement("button");
            sendButton.textContent = "Send Selected Posts";
            sendButton.id = "send-selected-posts-button";
            sendButton.addEventListener("click", sendSelectedPosts);

            const selectedPostsDisplay = document.createElement("div");
            selectedPostsDisplay.id = "selected-posts-display";
            selectedPostsDisplay.textContent = `Selected Posts: 0`;

            const target = document.querySelector("#forums-page-wrap");
            if (target) {
                debug(`[Main] Inserting "Send Selected Posts" button`);
                target.parentNode.insertBefore(sendButton, target);
                target.parentNode.insertBefore(selectedPostsDisplay, target);
            } else {
                console.error("[Main] Could not find the target element to insert the Send button and display.");
            }
        }
    };

    // --- Select All Posts in Thread ---
    const selectAllPostsInThread = async (threadId) => {
        debug(`[selectAllPostsInThread] Selecting all posts in thread: ${threadId}`);
        // Fetch the thread data from the API to get all post IDs
        const threadData = await fetchTornApi('thread', '', threadId);
        if (threadData && threadData.thread.postIds) {
            const postIds = threadData.thread.postIds;
            for (const postId of postIds) {
                selectPost(postId);
            }
        } else {
            console.error(`[selectAllPostsInThread] Could not fetch posts for thread ID: ${threadId}`);
        }
    };

    // --- Mutation Observer ---

    const observer = new MutationObserver(async (mutations) => {
        debug('[MutationObserver] Mutations detected:', mutations);
        // Re-run processPosts to add buttons to new elements
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
                <input type="text" id="webhook-url" placeholder="Enter your Discord webhook URL" value="${settings.discord.webhook.url}">
                <input type="text" id="webhook-username" placeholder="Enter a custom username (optional)" value="${settings.discord.webhook.username}">
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
        };
    
        const loadSettings = () => {
            // Load settings using GM_getValue
            settings.torn.api.key = GM_getValue("torn_api_key", "");
            settings.torn.api.keyLevel = GM_getValue("torn_api_key_level", "");
            settings.discord.webhook.url = GM_getValue("discord_webhook_url", "");
            settings.discord.webhook.username = GM_getValue("discord_webhook_username", "");
            settings.discord.webhook.avatar_url = GM_getValue("discord_webhook_avatar_url", "");
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
        settings.debug.mode = true;
        settings.debug.log.all = true;
        addStyles();
        createGUI();

        // Hide GUI on startup
        document.getElementById("torn-to-discord-gui").style.display = "none";

        // Add a button to toggle the GUI
        const toggleButton = document.createElement("button");
        toggleButton.textContent = "T2D Settings";
        toggleButton.style.position = "fixed";
        toggleButton.style.top = "10px";
        toggleButton.style.right = "10px";
        toggleButton.style.zIndex = 999;
        toggleButton.addEventListener("click", () => {
            const gui = document.getElementById("torn-to-discord-gui");
            gui.style.display = gui.style.display === "none" ? "block" : "none";
        });
        document.body.appendChild(toggleButton);

        // Start observing for changes after a delay
        setTimeout(() => {
            const targetNode = document.querySelector("#forums-page-wrap");
            if (targetNode) {
                observer.observe(targetNode, {
                    childList: true,
                    subtree: true
                });
                debug(`[Observer] Observing for new posts/threads...`);
                processPosts();
            }
        }, 2000); // 2-second delay
    };


    // --- Start the script ---

    init();

})();