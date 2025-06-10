import { byteConvert } from "~/lib/utils"

/**
 * Shows the estimated storage quota and usage
 * @returns Object containing quota and usage in human-readable format
 */
export async function showEstimatedQuota() {
  if (navigator.storage && navigator.storage.estimate) {
    const estimation = await navigator.storage.estimate()
    return {
      quota: byteConvert(estimation.quota),
      usage: byteConvert(estimation.usage)
    }
  } else {
    console.error("StorageManager not found")
    return {
      quota: "0",
      usage: "0"
    }
  }
}

/**
 * Clears all data from storage
 * @returns Promise that resolves when data is cleared
 */
export function clearAllData() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ command: "clearAllData" }).then((response) => {
      resolve(response)
    })
  })
}