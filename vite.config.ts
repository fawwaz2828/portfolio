import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on IPv4 and IPv6 so http://localhost works in every browser
    // (by default Vite may bind only to ::1 on Windows).
    host: true,
    port: 5173,
  },
});
