import { useState, useEffect } from "react"
import { NavButton } from "../NavButton"

interface SettingsSidebarProps {
  navPage: number
  onNavChange: (pageNum: number) => void
  onCollapse?: (collapsed: boolean) => void
}

/**
 * Sidebar navigation component for settings
 * Includes collapsible functionality for responsive design
 */
export const SettingsSidebar = ({ navPage, onNavChange, onCollapse }: SettingsSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) { // lg breakpoint
        setIsMobile(true)
        setIsCollapsed(true)
      } else {
        setIsMobile(false)
        // Don't automatically uncollapse on desktop - let user control it
        // setIsCollapsed(false)
      }
    }

    // Initial check
    handleResize()

    // Add event listener
    window.addEventListener('resize', handleResize)
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Notify parent component when collapse state changes
  useEffect(() => {
    if (onCollapse) {
      onCollapse(isCollapsed)
    }
  }, [isCollapsed, onCollapse])

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <>
      {/* Toggle button - visible only when collapsed */}
      <button 
        className={`fixed top-4 left-4 z-30 p-2 rounded-md bg-white shadow-md ${isCollapsed ? 'block' : 'hidden'}`}
        onClick={toggleCollapse}
        aria-label="Toggle sidebar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {isCollapsed ? (
            <>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </>
          ) : (
            <>
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </>
          )}
        </svg>
      </button>
      {/* Sidebar */}
      <div 
        className={`fixed z-20 inset-0 right-auto w-[16rem] py-10 px-6 overflow-y-auto bg-white transition-transform duration-300 ease-in-out ${isCollapsed ? '-translate-x-full' : 'translate-x-0'} ${isMobile ? 'shadow-lg' : ''}`}
      >
        <div className="lg:leading-6 relative">
          {/* Close button positioned at top right of sidebar */}
          {!isCollapsed && (
            <button 
              className="absolute top-0 right-0 p-2 rounded-md hover:bg-gray-100"
              onClick={toggleCollapse}
              aria-label="Close sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
          <h1 className="lg:text-2xl font-bold pl-4">
            {chrome.i18n.getMessage("extensionName")}
          </h1>
          <div className="text-lg font-normal flex flex-col gap-8 mt-10">
            <NavButton
              title={chrome.i18n.getMessage("settingPageNavSettings")}
              onClick={() => onNavChange(0)}
            />
            <NavButton
              title={chrome.i18n.getMessage("settingPageDataManagementTitle")}
              onClick={() => onNavChange(5)}
            />
            <NavButton
              title={chrome.i18n.getMessage("settingPageNavRemoteAPI")}
              onClick={() => onNavChange(1)}
            />
            <NavButton
              title={chrome.i18n.getMessage("settingPageNavGPT")}
              onClick={() => onNavChange(2)}
            />
            <NavButton
              title={chrome.i18n.getMessage("settingPageNavAbout")}
              onClick={() => onNavChange(3)}
            />
            <NavButton
              title={chrome.i18n.getMessage("settingPageNavDonate")}
              onClick={() => onNavChange(4)}
            />
          </div>
        </div>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {!isCollapsed && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
          onClick={toggleCollapse}
        />
      )}
    </>
  )
}