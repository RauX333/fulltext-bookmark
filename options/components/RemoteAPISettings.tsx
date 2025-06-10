import Toggle from "react-toggle"
import { SettingBlock } from "../SettingBlock"
import { SettingItem } from "../SettingItem"
import { SettingItemCol } from "../SettingItemCol"

interface RemoteAPISettingsProps {
  remoteStore: boolean
  remoteStoreEveryPage: boolean
  remoteStoreURL: string
  tempRemoteStoreURL: string
  handleRemoteStoreURLChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleBlurRemoteStoreURL: () => void
  dispatch: any
  toggleRemoteStore: () => void
  toggleRemoteStoreEveryPage: () => void
}

/**
 * Remote API settings component
 */
export const RemoteAPISettings = ({
  remoteStore,
  remoteStoreEveryPage,
  remoteStoreURL,
  tempRemoteStoreURL,
  handleRemoteStoreURLChange,
  handleBlurRemoteStoreURL,
  dispatch,
  toggleRemoteStore,
  toggleRemoteStoreEveryPage
}: RemoteAPISettingsProps) => {
  return (
    <SettingBlock title={chrome.i18n.getMessage("settingPageRemoteTitle")}>
      <SettingItem
        description={chrome.i18n.getMessage("settingPageRemoteSendDesp")}
        notes={chrome.i18n.getMessage("settingPageRemoteSendnote")}
      >
        <Toggle
          defaultChecked={remoteStore}
          onChange={() => dispatch(toggleRemoteStore())}
        />
      </SettingItem>
      
      <SettingItem
        description={chrome.i18n.getMessage("settingPageRemoteSendEveryDesp")}
        notes={chrome.i18n.getMessage("settingPageRemoteSendEveryNote")}
      >
        <Toggle
          defaultChecked={remoteStoreEveryPage}
          onChange={() => dispatch(toggleRemoteStoreEveryPage())}
        />
      </SettingItem>
      
      <SettingItemCol
        description={chrome.i18n.getMessage("settingPageRemoteAPIDesp")}
        notes={chrome.i18n.getMessage("settingPageRemoteAPINote")}
      >
        <textarea
          className="w-96"
          onChange={handleRemoteStoreURLChange}
          onBlur={handleBlurRemoteStoreURL}
          value={tempRemoteStoreURL}
          rows={tempRemoteStoreURL.split("\n").length || 4}
        />
      </SettingItemCol>
    </SettingBlock>
  )
}