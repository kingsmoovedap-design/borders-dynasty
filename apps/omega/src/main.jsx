import { useEffect } from "react";
import "./dashboard.js";

export default function App() {
  useEffect(() => {
    if (window.init) {
      window.init();
    }
  }, []);

  return (
    <div id="app"></div>
  );
}
