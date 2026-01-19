export default defineBackground(() => {
	// Create context menu on extension install/update
	browser.runtime.onInstalled.addListener(() => {
		browser.contextMenus.create({
			id: "vimput-edit",
			title: "Edit with Vimput",
			contexts: ["editable"],
		});
	});

	// Handle context menu clicks
	browser.contextMenus.onClicked.addListener(async (info, tab) => {
		if (info.menuItemId === "vimput-edit" && tab?.id) {
			try {
				await browser.tabs.sendMessage(tab.id, {
					type: "OPEN_VIMPUT_EDITOR",
				});
			} catch (error) {
				console.error("Failed to send message to content script:", error);
			}
		}
	});

	console.log("Vimput background script loaded", { id: browser.runtime.id });
});
