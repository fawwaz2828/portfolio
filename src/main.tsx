import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";
import App from "./App";
import Loader from "./components/Loader";
import { LangProvider } from "./i18n";
import "./index.css";

/** Loading screen first; the page mounts underneath just before the loader wipes away. */
function Root() {
  const [phase, setPhase] = useState<"loading" | "revealing" | "done">("loading");
  return (
    <>
      {phase !== "loading" && <App />}
      {phase !== "done" && <Loader onReveal={() => setPhase("revealing")} onDone={() => setPhase("done")} />}
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <LangProvider>
        <Root />
      </LangProvider>
    </MotionConfig>
  </StrictMode>
);
