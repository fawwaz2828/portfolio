import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";
import App from "./App";
import Loader from "./components/Loader";
import { LangProvider } from "./i18n";
import { ContentProvider } from "./content";
// Self-hosted fonts (bundled; no Google Fonts request, which is slow/blocked on some networks
// and left the variable-weight hover effects running on a fallback font)
import "@fontsource-variable/big-shoulders-display";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/inter-tight";
import "@fontsource-variable/noto-sans-sc";
import "@fontsource/space-mono/400.css";
import "@fontsource/space-mono/700.css";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
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
        {/* fetches the Supabase content while the loader runs */}
        <ContentProvider>
          <Root />
        </ContentProvider>
      </LangProvider>
    </MotionConfig>
  </StrictMode>
);
