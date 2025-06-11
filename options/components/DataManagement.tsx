import { useRef, useState } from "react"
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
  const [isImporting, setIsImporting] = useState(false)

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
        <div className="flex gap-4 items-center">
          <button
            className="text-blue-500 text-lg"
            onClick={handleImportCSV}
            disabled={isImporting}
          >
            {chrome.i18n.getMessage("settingPageSettingIndexSizeImportBtn")}
          </button>
          <button
            className="text-blue-500 text-lg"
            onClick={handleExportExcel}
            disabled={isImporting}
          >
            {chrome.i18n.getMessage("settingPageSettingIndexSizeExportBtn")}
          </button>
          {isImporting && (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
              <span>Importing...</span>
            </div>
          )}
        </div>
        <input
          type="file"
          accept=".csv"
          ref={csvFileInputRef}
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              setIsImporting(true);
              handleFileUpload(e.target.files[0], () => {
                setIsImporting(false);
                setStoreSize({ quota: "", usage: "" });
              });
            }
          }}
        />
      </SettingItemCol>
    </SettingBlock>
  )
}