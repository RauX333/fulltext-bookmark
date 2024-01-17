import { SettingBlock } from "./SettingBlock"
import { SettingItem } from "./SettingItem"
import { SettingItemCol } from "./SettingItemCol"
// import '@assets/style/tailwind.css';
import "~style.css"

export const Feature = () => {
    return (
        <>
            <SettingBlock
              title={chrome.i18n.getMessage("settingPageFeatureTitle")}>
              
              <p>
                🤖&nbsp;&nbsp;{chrome.i18n.getMessage("settingPageFeatureGPT")}
              </p>
              <p>
                🔍&nbsp;&nbsp;{chrome.i18n.getMessage("settingPageFeatureA")}
              </p>
              <p>
                💾&nbsp;&nbsp;{chrome.i18n.getMessage("settingPageFeatureB")}
              </p>
              <p>
                🦉&nbsp;&nbsp;{chrome.i18n.getMessage("settingPageFeatureI")}
              </p>

              <p>
                🥇&nbsp;&nbsp;{chrome.i18n.getMessage("settingPageFeatureC")}
              </p>
              <p>
                📎&nbsp;&nbsp;{chrome.i18n.getMessage("settingPageFeatureD")}
              </p>
              <p>
                📜&nbsp;&nbsp;{chrome.i18n.getMessage("settingPageFeatureE")}
              </p>
              <p>
                😺&nbsp;&nbsp;{chrome.i18n.getMessage("settingPageFeatureF")}
              </p>
              <p>
                ✉️&nbsp;&nbsp;{chrome.i18n.getMessage("settingPageFeatureG")}
              </p>
              <p>
                ⌨️&nbsp;&nbsp;{chrome.i18n.getMessage("settingPageFeatureH")}
              </p>
            </SettingBlock>
            <SettingBlock
              title={chrome.i18n.getMessage("settingPageAboutTitle")}>
              <p>
                Developed by:{" "}
                <a className="text-blue-300" href="https://github.com/RauX333">
                  RauX333
                </a>{" "} &nbsp;with ❤️
              </p>

              <p>
                Email:{" "}
                <a href="xenoncancer@gmail.com" className="text-blue-300">
                  xenoncancer@gmail.com
                </a>
              </p>

              <p>{chrome.i18n.getMessage("settingPageAboutThanks")}</p>
            </SettingBlock>
          </>
    )
}