// This will be the main entry point after app.ts, setting up the UI or core app logic.
// For now, it can be simple.

import { initializeApp } from "./ui/ui-manager"; // Corrected import

class Application {
  constructor() {
    this.initialize();
  }

  private initialize(): void {
    console.log("Application initializing...");
    // Setup basic event listeners or initial UI components
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        this.setupApp();
      });
    } else {
      this.setupApp();
    }
  }

  private setupApp(): void {
    const appContainer = document.getElementById("app-container");
    if (appContainer) {
      console.log("DOM content loaded, app container found.");
      initializeApp(appContainer); // Corrected function call
    } else {
      console.error("App container not found in HTML.");
    }
  }
}

// Instantiate the application
new Application();
