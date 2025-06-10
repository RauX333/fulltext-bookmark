import { useState } from "react"
import Toggle from "react-toggle"
import { SettingBlock } from "../SettingBlock"
import { SettingItem } from "../SettingItem"
import { SettingItemCol } from "../SettingItemCol"

interface GPTSettingsProps {
  showAskGPT: boolean
  GPTKey: string
  GPTUrl: string
  tempGPTKey: string
  tempGPTUrl: string
  handleGPTKeyChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleGPTUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleBlurGPTKey: () => void
  handleBlurGPTUrl: () => void
  dispatch: any
  toggleShowAskGPT: () => void
}

/**
 * GPT settings component
 */
export const GPTSettings = ({
  showAskGPT,
  GPTKey,
  GPTUrl,
  tempGPTKey,
  tempGPTUrl,
  handleGPTKeyChange,
  handleGPTUrlChange,
  handleBlurGPTKey,
  handleBlurGPTUrl,
  dispatch,
  toggleShowAskGPT
}: GPTSettingsProps) => {
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState("")

  const handleTestGPT = async () => {
    setTestLoading(true)
    setTestResult("")
    try {
      const response = await fetch(GPTUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GPTKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content: "Say hello",
            },
          ],
        }),
      })
      const data = await response.json()
      if (data.error) {
        setTestResult(`Error: ${data.error.message}`)
      } else {
        setTestResult(`Success: ${data.choices[0].message.content}`)
      }
    } catch (e: any) {
      setTestResult(`Error: ${e.message}`)
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <SettingBlock title={chrome.i18n.getMessage("settingPageSettingGPT")}>
      <SettingItem
        description={chrome.i18n.getMessage("settingPageSettingGPTShowDesp")}
        notes={chrome.i18n.getMessage("settingPageSettingGPTShowNote")}
      >
        <Toggle
          defaultChecked={showAskGPT}
          onChange={() => dispatch(toggleShowAskGPT())}
        />
      </SettingItem>
      <p></p>
      <SettingItemCol
        description={chrome.i18n.getMessage("settingPageSettingGPTUrlDesp")}
        notes={chrome.i18n.getMessage("settingPageSettingGPTUrlNote")}
      >
        <input
          type="text"
          className="w-96 h-6"
          value={tempGPTUrl}
          onChange={handleGPTUrlChange}
          onBlur={handleBlurGPTUrl}
        />
      </SettingItemCol>
      <p></p>
      <SettingItemCol
        description={chrome.i18n.getMessage("settingPageSettingGPTKeyDesp")}
        notes={chrome.i18n.getMessage("settingPageSettingGPTKeyNote")}
      >
        <input
          type="password"
          className="w-96 h-6"
          value={tempGPTKey}
          onChange={handleGPTKeyChange}
          onBlur={handleBlurGPTKey}
        />
      </SettingItemCol>
      <p></p>
      <SettingItemCol
        description={chrome.i18n.getMessage("settingPageSettingGPTTestDesp")}
        notes={chrome.i18n.getMessage("settingPageSettingGPTTestNote")}
      >
        <button
          className="text-blue-500 text-lg"
          onClick={handleTestGPT}
          disabled={testLoading}
        >
          {testLoading
            ? chrome.i18n.getMessage("settingPageSettingGPTTestLoading")
            : chrome.i18n.getMessage("settingPageSettingGPTTestBtn")}
        </button>
        {testResult && <div className="mt-2">{testResult}</div>}
      </SettingItemCol>
    </SettingBlock>
  )
}