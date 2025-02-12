export default defineBackground(() => {
  // console.log('Hello background!', { id: browser.runtime.id });
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: 'vimput-editor',
      title: 'Edit with Vimput',
      contexts: ['editable'],
    })
  })

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'vimput-editor' && tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: "OPEN_EDITOR" })
    }
  })

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('background received:', message, sender)
    if (message.type === 'CLOSE_EDITOR') {
      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, { type: "CLOSE_EDITOR" })
      }
    }
  })
});
