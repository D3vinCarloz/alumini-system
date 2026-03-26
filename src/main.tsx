
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";
// Add at the top of main.tsx, after imports:
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Function components cannot be given refs')
  ) return;
  originalWarn(...args);
};
  createRoot(document.getElementById("root")!).render(<App />);
  