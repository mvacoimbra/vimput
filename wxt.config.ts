import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
	modules: ["@wxt-dev/module-react"],
	manifest: {
		name: "Vimput",
		description:
			"Edit any text input with a Vim-powered editor. Right-click on any input field to open the Vimput editor.",
		version: "1.0.0",
		permissions: ["contextMenus", "storage", "activeTab"],
		icons: {
			16: "icon/16.png",
			32: "icon/32.png",
			48: "icon/48.png",
			96: "icon/96.png",
			128: "icon/128.png",
		},
	},
});
