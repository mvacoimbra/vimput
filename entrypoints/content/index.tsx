import '../../assets/global.css';
import ReactDOM from "react-dom/client";
import App from "./App.tsx";

export default defineContentScript({
  matches: ["*://*/*"],
  cssInjectionMode: "ui",

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: "vimput-editor",
      position: "overlay",
      anchor: "body",
      append: "first",
      onMount: (container) => {
        // Don't mount react app directly on <body>
        const wrapper = document.createElement("div");
        container.append(wrapper);

        const root = ReactDOM.createRoot(wrapper);
        root.render(<App />);
        return { root, wrapper };
      },
      onRemove: (elements) => {
        elements?.root.unmount();
        elements?.wrapper.remove();
      },
    });

    chrome.runtime.onMessage.addListener((message) => {
      console.log('content received:', message)
      if (message.type === 'OPEN_EDITOR') {
        ui.mount();
      }
      if (message.type === 'CLOSE_EDITOR') {
        console.log('blau')
        ui.remove();
      }
    })

  },
});
