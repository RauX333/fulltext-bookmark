# Fulltext Bookmark Handbook

## Project Overview

Fulltext Bookmark is a Chrome extension developed with the Plasmo framework that enhances bookmark and browsing history management. It provides powerful search capabilities by storing and indexing bookmarked pages and browsing history for full-text search.

## Key Features

- 🔍 Enhanced bookmark/browsing history search
- 💾 Storage and indexing of bookmarked pages and visited pages for full-text search
- 🦉 Bookmark and search Weibo posts
- 🥇 Display best-matched search results in search engine pages (Google/Bing/Baidu)
- 📎 Search from Chrome's search bar using the 'kw' prefix
- 📜 Search from the extension's popup page for more comprehensive results
- 😺 Local storage for privacy (no accounts, no cloud)
- ✉️ Optional remote API integration for sending bookmark/browsing history
- 📊 Data export functionality (JSON and Excel formats)

## Project Structure

### Core Components

1. **Background Script** (`background.ts`)
   - Manages the database operations using Dexie
   - Handles message passing between different parts of the extension
   - Processes bookmarks and page content
   - Implements search functionality

2. **Content Scripts**
   - `visitedPage.ts`: Processes and extracts content from visited pages
   - `google.ts`: Integrates with search engine results
   - `weibo.ts`: Provides Weibo-specific functionality

3. **Popup UI** (`popup/`)
   - `index.tsx`: Entry point for the popup
   - `search.tsx`: Implements search functionality in the popup
   - `GPTSearch.tsx`: Provides GPT-assisted search capabilities

4. **Options Page** (`options/`)
   - `settings.tsx`: Main settings interface with various configuration options
   - `Feature.tsx`: Displays feature information
   - `Donate.tsx`: Provides donation information

5. **Libraries** (`lib/`)
   - `interface.ts`: Defines TypeScript interfaces
   - `textsplitter.ts`: Text processing utilities
   - `wordSplit.ts`: Word splitting functionality for search indexing
   - `utils.ts`: General utility functions

### Database Structure

The extension uses Dexie.js (IndexedDB wrapper) with three main stores:

1. **pages**: Stores metadata about pages
   - URL, title, date, bookmark status, page ID

2. **contents**: Stores the actual content of pages
   - Content text, content words (tokenized), title words (tokenized)

3. **vectors**: Stores embedding vectors for semantic search

## User Interface

### Popup

The popup interface provides a search box and displays search results with relevant information such as title, URL, and content snippets.

### Options Page

The options page is divided into several sections:

1. **Display Settings**
   - Search engine adaptation
   - Bookmark adaptation
   - Show only bookmarked results

2. **Search Settings**
   - Maximum results
   - Page expiration time

3. **Indexing Settings**
   - Exclusion rules for URLs
   - Weibo support

4. **Remote Storage**
   - Enable/disable remote storage
   - Configure remote storage URL
   - Option to store every page or only bookmarks

5. **GPT Settings**
   - Enable/disable GPT integration
   - Configure GPT URL and API key
   - Test GPT connection

6. **Data Management**
   - Clear all data
   - Export data (JSON and Excel formats)

## Data Flow

1. When a user visits a page, the content script extracts the page content
2. The content is sent to the background script for processing and storage
3. When a user searches, the query is processed by the background script
4. Search results are retrieved from the database and displayed to the user
5. For GPT-assisted searches, the query is sent to the configured GPT API

## Export Functionality

The extension provides ways to export all stored data in both JSON and CSV (Excel) formats. This is useful for backup purposes or for analyzing the data outside of the extension.

- **JSON Export**: Exports the complete database structure including all tables and metadata.
- **Excel Export**: Exports the pages data in CSV format, which can be opened directly in Excel or other spreadsheet applications. The CSV includes columns for URL, title, description, bookmark status, creation date, and last updated date.

## Development

To build the extension:

```bash
pnpm build
# or
npm run build
```

This creates a production bundle for the extension that can be loaded into Chrome.