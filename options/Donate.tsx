import { SettingBlock } from "~components/SettingBlock"
import { SettingItem } from "~components/SettingItem"
import { SettingItemCol } from "~components/SettingItemCol"

import "~style.css"

export const Donate = () => {
    return (
        <>
            <SettingBlock
              title={chrome.i18n.getMessage("settingPageDonateTitle")}>
              <p>
                PayPal:{" "}
                <a className="text-blue-300" href="https://paypal.me/dongxiajun">
                  paypal.me/dongxiajun
                </a>
              </p>
            </SettingBlock>

            <SettingBlock title={chrome.i18n.getMessage("settingPageAboutTitle")}>
              <p>
                Developed by:{" "}
                <a className="text-blue-300" href="https://github.com/RauX333">
                  RauX333
                </a>
                 &nbsp;with ❤️
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