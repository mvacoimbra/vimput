import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
	modules: ["@wxt-dev/module-react"],
	manifest: {
		name: "Vimput",
		description:
			"Edit any text input with a Vim-powered editor. Right-click on any input field to open the Vimput editor.",
		version: "1.3.2",
		permissions: ["contextMenus", "storage", "activeTab"],
		icons: {
			16: "icons/png/icon-16.png",
			32: "icons/png/icon-32.png",
			48: "icons/png/icon-48.png",
			128: "icons/png/icon-128.png",
		},
		web_accessible_resources: [
			{
				resources: ["pageScript.js", "vimput-formatter.py"],
				matches: ["<all_urls>"],
			},
		],
		browser_specific_settings: {
			gecko: {
				id: "vimput@extension",
				data_collection_permissions: {
					data_collection_enabled: false,
					required: ["none"],
				},
			} as {
				id: string;
				data_collection_permissions: {
					data_collection_enabled: boolean;
					required: string[];
				};
			},
		},
	},
});
