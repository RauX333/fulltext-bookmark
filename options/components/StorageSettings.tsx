import Toggle from "react-toggle"
import { SettingBlock } from "../SettingBlock"
import { SettingItem } from "../SettingItem"
import { SettingItemCol } from "../SettingItemCol"
import { showEstimatedQuota, clearAllData } from "../utils/storageUtils"

interface StorageSettingsProps {
  storeEveryPage: boolean
  bookmarkAdaption: boolean
  tempPageExpireTimeInDays: string | number
  tempForbiddenURLs: string
  storeSize: { quota: string; usage: string }
  setStoreSize: (size: { quota: string; usage: string }) => void
  handlePageExpireTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handlePageExpireTimeSubmit: () => void
  handleForbiddenURLsChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleBlurForbiddenURLs: () => void
  dispatch: any
  toggleStoreEveryPage: () => void
  toggleBookmarkAdaption: () => void
}

/**
 * Storage settings component for index and storage management
 */
export const StorageSettings = ({
  storeEveryPage,
  bookmarkAdaption,
  tempPageExpireTimeInDays,
  tempForbiddenURLs,
  storeSize,
  setStoreSize,
  handlePageExpireTimeChange,
  handlePageExpireTimeSubmit,
  handleForbiddenURLsChange,
  handleBlurForbiddenURLs,
  dispatch,
  toggleStoreEveryPage,
  toggleBookmarkAdaption
}: StorageSettingsProps) => {
  
  const handleClearAllData = async () => {
    await clearAllData()
    alert(chrome.i18n.getMessage("settingPageSettingIndexSizeClearAlert"))
    const newSize = await showEstimatedQuota()
    setStoreSize(newSize)
  }

  return (
    <SettingBlock title={chrome.i18n.getMessage("settingPageSettingIndex")}>
      <SettingItemCol
        description={chrome.i18n.getMessage("settingPageSettingIndexSizeDesp")}
        notes={chrome.i18n.getMessage("settingPageSettingIndexSizeNote")}
      >
        <button
          className="text-blue-500 mr-8 text-lg"
          onClick={async () => {
            const size = await showEstimatedQuota()
            setStoreSize(size)
          }}
        >
          {chrome.i18n.getMessage("settingPageSettingIndexSizeButton")}
        </button>
        <span className="text-lg">{storeSize.usage}</span>
        {storeSize.usage !== "0" && (
          <>
            <button
              className="text-blue-500 ml-8 mr-4 text-lg"
              onClick={handleClearAllData}
            >
              {chrome.i18n.getMessage("settingPageSettingIndexSizeClearBtn")}
            </button>
          </>
        )}
      </SettingItemCol>

      <p></p>
      <SettingItem
        description={chrome.i18n.getMessage("settingPageSettingIndexEveryDesp")}
        notes={chrome.i18n.getMessage("settingPageSettingIndexEveryNote")}
      >
        <Toggle
          defaultChecked={storeEveryPage}
          onChange={() => dispatch(toggleStoreEveryPage())}
        />
      </SettingItem>
      <SettingItem
        description={chrome.i18n.getMessage("settingPageSettingIndexBookDesp")}
        notes={chrome.i18n.getMessage("settingPageSettingIndexBookNote")}
      >
        <Toggle
          defaultChecked={bookmarkAdaption}
          onChange={() => dispatch(toggleBookmarkAdaption())}
        />
      </SettingItem>
      <p></p>
      <SettingItemCol
        description={chrome.i18n.getMessage("settingPageSettingIndexDurDesp")}
        notes={chrome.i18n.getMessage("settingPageSettingIndexDurNote")}
      >
        <input
          type="text"
          className="w-32 h-6"
          value={tempPageExpireTimeInDays}
          onChange={handlePageExpireTimeChange}
          onBlur={handlePageExpireTimeSubmit}
        />{" "}
        {chrome.i18n.getMessage("days")}
      </SettingItemCol>
      <p></p>
      <SettingItemCol
        description={chrome.i18n.getMessage("settingPageSettingIndexExclDesp")}
        notes={chrome.i18n.getMessage("settingPageSettingIndexExclNote")}
      >
        <textarea
          className="w-96"
          onChange={handleForbiddenURLsChange}
          onBlur={handleBlurForbiddenURLs}
          value={tempForbiddenURLs}
          rows={tempForbiddenURLs.split("\n").length || 4}
        />
      </SettingItemCol>
    </SettingBlock>
  )
}