import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeStorageCleanup } from "./utils/cleanupStorage";
import { checkAndCleanupStorage } from "./integrations/supabase/storage";

// Initialize storage cleanup on app start
initializeStorageCleanup();
checkAndCleanupStorage();

createRoot(document.getElementById("root")!).render(<App />);
