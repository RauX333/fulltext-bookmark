# Privacy Policy for Fulltext Bookmark

This Privacy Policy describes how Fulltext Bookmark ("the Extension") collects, uses, and handles your information when you use our Chrome Extension. (visit https://chromewebstore.google.com/ and search for Fulltext Bookmark for more detail about the extension )

## 1. Data Collection and Storage

Fulltext Bookmark is designed with privacy in mind. All data processed by the Extension is stored locally on your device using IndexedDB (which is in your Chrome application). Actually we don't have a server to store your data.

### Information We Store Locally:

* **Bookmark data**: When you bookmark a page, we store the URL, title, and date.
* **Page content**: For bookmarked pages and (optionally) pages you visit, we store the page content to enable full-text search functionality.
* **Search vectors**: We generate and store text embeddings to enable semantic search capabilities.
* **User preferences**: Your extension settings and preferences are stored locally.

This data is stored exclusively on your local device and is not transmitted to our servers.

## 2. Optional External Services Integration

### Remote API Integration

The Extension includes an optional feature to send bookmark data to a custom remote API of your choice. This feature is:

* **Disabled by default**
* **Entirely optional**
* **Configurable by you**

If you choose to enable this feature:

* You must provide the remote API URL
* The Extension will send limited data (URL, title, date, and bookmark status) to your specified API
* You can choose to send only bookmarked pages or all stored pages
* The security and privacy practices of your chosen remote API are not covered by this policy

### GPT Integration

The Extension also includes an optional feature to ask GPT about your archived pages. This feature is:

* **Disabled by default**
* **Entirely optional**
* **Configurable by you**

If you choose to enable this feature:

* You must provide your own GPT API address and key
* The Extension will send your query and relevant content from your archived pages to the GPT service
* The Extension will display the GPT response with references to your archived pages
* The security and privacy practices of your chosen GPT service are not covered by this policy
* Your API key is stored locally and is never shared with our servers

## 3. Permissions Used

The Extension requests the following permissions to function:

* **tabs**: Required to access the current tab's URL and title for bookmarking and content extraction. This allows the background script to query the current active tab and send instructions to save the current tab's data to the background IndexedDB database.

* **bookmarks**: Required to integrate with Chrome's bookmark system and adapt to bookmark changes. This permission is used for listening to user bookmark events to synchronize bookmark status with the background IndexedDB data, enabling users to search the database for bookmarks.

* **storage**: Required for persistent storage of user settings and contents of the indexed data of their browsing history. This ensures your preferences and indexed content remain available between browser sessions.

* **offscreen**: Required for sending messages to the background service worker every 20 seconds to keep it persistent, making the user experience better by ensuring the extension remains responsive.

* **host permissions** (https://*/*, http://*/*): Required for being able to store web contents of every user page for later search. This permission also enables the extension to show search results in search engine pages like Google, Bing, and Baidu.

These permissions are essential for the core functionality of the Extension.

## 4. Data Security

We take the security of your data seriously:

* All data is stored locally on your device
* No data is transmitted to our servers
* If you enable the optional remote API feature, data is transmitted using secure HTTPS connections

## 5. Data Retention and User Control

You have full control over your data:

* You can export your stored data in CSV format at any time
* You can clear all stored data through the Extension's settings page
* You can set expiration times for non-bookmarked pages
* You can specify URLs to exclude from being stored

## 6. Third-Party Services

The Extension does not use third-party analytics or tracking services. External data transmission only occurs in the following cases:

* If you explicitly enable and configure the optional remote API feature
* If you explicitly enable and configure the optional GPT integration feature by providing your own GPT API address and key

In both cases, these features are disabled by default and require your explicit configuration to function.

## 7. Changes to This Privacy Policy

We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.

## 8. Contact Us

If you have any questions about this Privacy Policy, please contact us at:

Email: xenoncancer@gmail.com

GitHub: [RauX333](https://github.com/RauX333)

---

Last updated: June 2025