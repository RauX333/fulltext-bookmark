import download from "downloadjs"

/**
 * Converts JSON data to CSV format
 * @param jsonData The JSON data to convert
 * @returns CSV content as a string
 */
export const jsonToCSV = (jsonData) => {
  try {
    console.log('Export data structure:', jsonData);
    
    // Find the pages table in the Dexie export format
    let pages = [];
    let contents = [];
    
    // Based on the screenshot, the structure is jsonData.data.data[0].rows
    if (jsonData.data && jsonData.data.data && Array.isArray(jsonData.data.data) && jsonData.data.data.length > 0) {
      // Find the pages table (first element with tableName === 'pages')
      const pagesTable = jsonData.data.data.find(table => table.tableName === 'pages');
      if (pagesTable && Array.isArray(pagesTable.rows)) {
        pages = pagesTable.rows;
        console.log('Found pages in Dexie export format:', pages.length);
      }
      
      // Find the contents table
      const contentsTable = jsonData.data.data.find(table => table.tableName === 'contents');
      if (contentsTable && Array.isArray(contentsTable.rows)) {
        contents = contentsTable.rows;
        console.log('Found contents in Dexie export format:', contents.length);
      }
    }
    
    // If still not found, check tables array
    if (pages.length === 0 && jsonData.data && jsonData.data.tables && Array.isArray(jsonData.data.tables)) {
      const pagesTable = jsonData.data.tables.find(table => table.name === 'pages');
      if (pagesTable && Array.isArray(pagesTable.rows)) {
        pages = pagesTable.rows;
        console.log('Found pages in tables array:', pages.length);
      }
      
      const contentsTable = jsonData.data.tables.find(table => table.name === 'contents');
      if (contentsTable && Array.isArray(contentsTable.rows)) {
        contents = contentsTable.rows;
        console.log('Found contents in tables array:', contents.length);
      }
    }
    
    // If no pages found, try other possible formats
    if (pages.length === 0) {
      if (Array.isArray(jsonData)) {
        pages = jsonData;
      } else if (jsonData.pages && Array.isArray(jsonData.pages)) {
        pages = jsonData.pages;
      } else if (jsonData.data && Array.isArray(jsonData.data)) {
        pages = jsonData.data;
      }
    }
    
    if (pages.length === 0) {
      // Log the structure to help debug
      console.error('Unable to find pages data in the export. Data structure:', jsonData);
      throw new Error('Pages data not found in export. Check console for details.');
    }
    
    // Create a map of page ID to content for quick lookup
    const contentMap = new Map();
    contents.forEach(content => {
      if (content.pid && content.content) {
        contentMap.set(content.pid, content.content);
      }
    });
    
    // Define CSV headers based on the database schema (removed Page ID column)
    const headers = ['URL', 'Title', 'Date', 'Bookmarked', 'Content'];
    
    // Create CSV content with BOM for UTF-8 encoding
    let csvContent = '\ufeff' + headers.join(',') + '\n';
    
    // Add data rows
    let rowCount = 0;
    pages.forEach(page => {
      // Skip entries without URL (likely not valid page entries)
      if (!page.url) return;
      
      // Get content for this page if available
      const content = contentMap.get(page.id) || '';
      
      const row = [
        `"${(page.url || '').replace(/"/g, '""')}"`,
        `"${(page.title || '').replace(/"/g, '""')}"`,
        `"${new Date(page.date || Date.now()).toLocaleString()}"`,
        `"${page.isBookmarked ? 'Yes' : 'No'}"`,
        `"${(content || '').replace(/"/g, '""')}"` // Add content column
      ];
      csvContent += row.join(',') + '\n';
      rowCount++;
    });
    
    if (rowCount === 0) {
      throw new Error('No valid page data found to export');
    }
    
    console.log(`Successfully converted ${rowCount} pages to CSV`);
    return csvContent;
  } catch (error) {
    console.error('Error converting JSON to CSV:', error);
    alert('Error converting data to CSV format: ' + error.message);
    return '';
  }
};

/**
 * Handles exporting data to Excel (CSV) format
 */
export const handleExportExcel = () => {
  try {
    chrome.runtime.sendMessage({ command: "export" }, (response) => {
      if (!response || chrome.runtime.lastError) {
        console.error('Error exporting data:', chrome.runtime.lastError);
        alert('Error exporting data. Please check console for details.');
        return;
      }
      
      // Convert JSON to CSV
      const csvContent = jsonToCSV(response);
      if (!csvContent) return; // Error already handled in jsonToCSV
      
      // Create Blob and download with UTF-8 encoding
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Use downloadjs library which is already a dependency
      download(blob, "fulltext-bookmark-export.csv", "text/csv;charset=utf-8");
    });
  } catch (error) {
    console.error('Error in export process:', error);
    alert('An unexpected error occurred during export. Please check console for details.');
  }
};

/**
 * Converts CSV data to JSON format
 * @param csvData The CSV data to convert
 * @returns Array of JSON objects
 */
export const csvToJSON = (csvData) => {
  try {
    // Check for BOM and remove if present
    if (csvData.charCodeAt(0) === 0xFEFF) {
      csvData = csvData.slice(1);
    }

    const lines = csvData.split('\n');
    if (lines.length < 2) {
      throw new Error('CSV file must contain at least a header row and one data row');
    }

    // Parse header row
    const headers = parseCSVLine(lines[0]);
    
    // Validate required headers
    const requiredHeaders = ['URL', 'Title', 'Date', 'Bookmarked'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    // Find column indices
    const urlIndex = headers.indexOf('URL');
    const titleIndex = headers.indexOf('Title');
    const dateIndex = headers.indexOf('Date');
    const bookmarkedIndex = headers.indexOf('Bookmarked');
    const contentIndex = headers.indexOf('Content');

    const result = [];

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      const values = parseCSVLine(line);
      if (values.length < requiredHeaders.length) continue; // Skip invalid lines

      // Extract URL and skip if empty
      const url = values[urlIndex].trim();
      if (!url) continue;

      // Create data object
      const pageData = {
        url: url,
        title: values[titleIndex].trim(),
        date: parseDate(values[dateIndex]),
        isBookmarked: values[bookmarkedIndex].toLowerCase().includes('yes'),
        pageId: generateUUID(), // Always generate a new UUID
        content: contentIndex >= 0 ? values[contentIndex].trim() : ''
      };

      result.push(pageData);
    }

    return result;
  } catch (error) {
    console.error('Error converting CSV to JSON:', error);
    alert('Error converting CSV to JSON: ' + error.message);
    return [];
  }
};

/**
 * Parse a CSV line respecting quoted values
 * @param line The CSV line to parse
 * @returns Array of values
 */
export const parseCSVLine = (line) => {
  const result = [];
  let inQuotes = false;
  let currentValue = '';
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = i < line.length - 1 ? line[i + 1] : null;
    
    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      if (nextChar === '"') {
        // Double quotes inside quotes - add a single quote
        currentValue += '"';
        i++; // Skip the next quote
      } else {
        inQuotes = false;
      }
    } else if (char === ',' && !inQuotes) {
      // End of value
      result.push(currentValue);
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  
  // Add the last value
  result.push(currentValue);
  return result;
};

/**
 * Parse date from various formats
 * @param dateStr The date string to parse
 * @returns Timestamp in milliseconds
 */
export const parseDate = (dateStr) => {
  try {
    // Try to parse the date string
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.getTime();
    }
    // If parsing fails, return current time
    return Date.now();
  } catch (error) {
    return Date.now();
  }
};

/**
 * Generate a UUID for new records
 * @returns UUID string
 */
export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Handles importing data from CSV
 * @param file The CSV file to import
 * @param onComplete Callback function to run after import is complete
 */
export const handleFileUpload = async (file, onComplete) => {
  if (!file) return;

  try {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csvData = e.target.result;
        const jsonData = csvToJSON(csvData.toString());
        
        if (jsonData.length === 0) {
          alert('No valid data found in the CSV file.');
          return;
        }

        // Show confirmation with count of records
        if (!confirm(`Import ${jsonData.length} records to the database?`)) {
          return;
        }

        // Process data in batches to avoid overwhelming the browser
        const batchSize = 50;
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < jsonData.length; i += batchSize) {
          const batch = jsonData.slice(i, i + batchSize);
          
          // Process each item in the batch
          for (const item of batch) {
            try {
              await new Promise((resolve) => {
                chrome.runtime.sendMessage({
                  command: "import",
                  data: item
                }, (response) => {
                  if (response === "ok") {
                    successCount++;
                  } else {
                    errorCount++;
                  }
                  resolve();
                });
              });
            } catch (error) {
              console.error('Error importing item:', error, item);
              errorCount++;
            }
          }
        }
        
        // Show results
        alert(`Import completed: ${successCount} records imported successfully, ${errorCount} errors.`);
        
        // Call the completion callback if provided
        if (onComplete && typeof onComplete === 'function') {
          onComplete();
        }
      } catch (error) {
        console.error('Error processing CSV file:', error);
        alert('Error processing CSV file: ' + error.message);
      }
    };
    reader.readAsText(file, 'UTF-8');
  } catch (error) {
    console.error('Error reading file:', error);
    alert('Error reading file: ' + error.message);
  }
};