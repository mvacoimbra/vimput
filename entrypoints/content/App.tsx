import { useState } from "react";

export default () => {
  const [count, setCount] = useState(1);
  const increment = () => setCount((count) => count + 1);

  const closeModal = () => {
    chrome.runtime.sendMessage({ type: "CLOSE_EDITOR" });
  }

  chrome.runtime.onMessage.addListener((message) => {
    console.log('ui received:', message)
    if (message.type === 'CLOSE_EDITOR') {
      console.log('blau')
    }
  })

  return (
    <div className="bg-red-500 absolute p-32 z-[999999]">
      <p>This is React. {count}</p>
      <button onClick={increment}>Increment</button>
      <button onClick={closeModal}>CLOSE</button>
    </div>
  );
};
