// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_SELECTION") {
    sendResponse({ text: window.getSelection().toString().trim() })
  }
})
