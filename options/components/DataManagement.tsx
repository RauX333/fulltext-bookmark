import { useRef } from "react"
import { SettingBlock } from "../SettingBlock"
import { SettingItemCol } from "../SettingItemCol"
import { handleExportExcel, handleFileUpload } from "../utils/csvUtils"

interface DataManagementProps {
  setStoreSize: (size: { quota: string; usage: string }) => void
}

/**
 * Data management component for importing and exporting data
 */
export const DataManagement = ({ setStoreSize }: DataManagementProps) => {
  const csvFileInputRef = useRef<HTMLInputElement>(null)

  const handleImportCSV = () => {
    if (csvFileInputRef.current) {
      csvFileInputRef.current.click()
    }
  }

  return (
    <SettingBlock title={chrome.i18n.getMessage("settingPageDataManagementTitle")}>
      <SettingItemCol
        description={chrome.i18n.getMessage("settingPageDataManagementDesc")}
        notes={chrome.i18n.getMessage("settingPageDataManagementNote")}
      >
        <div className="flex gap-4">
          <button
            className="text-blue-500 text-lg"
            onClick={handleImportCSV}
          >
            {chrome.i18n.getMessage("settingPageSettingIndexSizeImportBtn")}
          </button>
          <button
            className="text-blue-500 text-lg"
            onClick={handleExportExcel}
          >
            {chrome.i18n.getMessage("settingPageSettingIndexSizeExportBtn")}
          </button>
        </div>
        <input
          type="file"
          accept=".csv"
          ref={csvFileInputRef}
          style={{ display: "none" }}
          onChange={(e) => handleFileUpload(e, setStoreSize)}
        />
      </SettingItemCol>
    </SettingBlock>
  )
}