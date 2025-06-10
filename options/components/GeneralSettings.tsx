import Toggle from "react-toggle"
import { SettingBlock } from "../SettingBlock"
import { SettingItem } from "../SettingItem"
import { SettingItemCol } from "../SettingItemCol"

interface GeneralSettingsProps {
  searchEngineAdaption: boolean
  weiboSupport: boolean
  showOnlyBookmarkedResults: boolean
  tempMaxResults: string | number
  handleMaxResultsChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleMaxResultsSubmit: () => void
  dispatch: any
  toggleSearchEngineAdaption: () => void
  toggleWeiboSupport: () => void
  toggleShowOnlyBookmarkedResults: () => void
}

/**
 * General settings component for display and search settings
 */
export const GeneralSettings = ({
  searchEngineAdaption,
  weiboSupport,
  showOnlyBookmarkedResults,
  tempMaxResults,
  handleMaxResultsChange,
  handleMaxResultsSubmit,
  dispatch,
  toggleSearchEngineAdaption,
  toggleWeiboSupport,
  toggleShowOnlyBookmarkedResults
}: GeneralSettingsProps) => {
  return (
    <>
      {chrome.i18n.getMessage("settingPageNotice")}
      
      <SettingBlock title={chrome.i18n.getMessage("settingPageSettingDisplay")}>
        <SettingItem
          description={chrome.i18n.getMessage("settingPageSettingSearchPageDesp")}
          notes={chrome.i18n.getMessage("settingPageSettingSearchPageNote")}
        >
          <Toggle
            defaultChecked={searchEngineAdaption}
            onChange={() => dispatch(toggleSearchEngineAdaption())}
          />
        </SettingItem>
        <SettingItem
          description={chrome.i18n.getMessage("settingPageSettingWeiboDesp")}
          notes={chrome.i18n.getMessage("settingPageSettingWeiboNote")}
        >
          <Toggle
            defaultChecked={weiboSupport}
            onChange={() => dispatch(toggleWeiboSupport())}
          />
        </SettingItem>
      </SettingBlock>

      <SettingBlock title={chrome.i18n.getMessage("settingPageSettingSearch")}>
        <SettingItem
          description={chrome.i18n.getMessage("settingPageSettingSearchShowBookDesp")}
        >
          <Toggle
            defaultChecked={showOnlyBookmarkedResults}
            onChange={() => dispatch(toggleShowOnlyBookmarkedResults())}
          />
        </SettingItem>
        <p></p>
        <SettingItemCol
          description={chrome.i18n.getMessage("settingPageSettingSearchMaxDesp")}
          notes={chrome.i18n.getMessage("settingPageSettingSearchMaxNote")}
        >
          <input
            type="text"
            className="w-32 h-6"
            value={tempMaxResults}
            onChange={handleMaxResultsChange}
            onBlur={handleMaxResultsSubmit}
          />{" "}
        </SettingItemCol>
      </SettingBlock>
    </>
  )
}