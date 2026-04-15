// Context menu for right-click → Analyze with TruthLens
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "analyzeSelection",
    title: "Analyze with TruthLens",
    contexts: ["selection"],
  })
  chrome.contextMenus.create({
    id: "analyzePage",
    title: "Analyze this page with TruthLens",
    contexts: ["page"],
  })
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "analyzeSelection" && info.selectionText) {
    // Store selected text and open popup
    await chrome.storage.local.set({
      pendingText: info.selectionText,
      pendingMode: "text",
    })
    chrome.action.openPopup()
  }
  if (info.menuItemId === "analyzePage" && tab?.url) {
    await chrome.storage.local.set({
      pendingUrl: tab.url,
      pendingMode: "url",
    })
    chrome.action.openPopup()
  }
})
