// Main application entry point.
// Handles DOMContentLoaded and initializes the UI.

import { initializeApp } from "./ui/ui-manager";
import { storageService } from './services/storage.service';
import { AppState } from './state/app-state';

class Application {
  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    console.log("Application initializing...");
    // Setup basic event listeners or initial UI components
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", async () => {
        await this.setupApp();
      });
    } else {
      // DOMContentLoaded has already fired
      await this.setupApp();
    }
  }

  private async setupApp(): Promise<void> {
    const appState = AppState.getInstance();
    await storageService.loadState(appState);

    const appContainer = document.getElementById("app-container");
    if (appContainer) {
      console.log("DOM content loaded, app container found. Initializing UI.");
      initializeApp(appContainer);
    } else {
      console.error("App container 'app-container' not found in HTML. UI cannot be initialized.");
      // Consider showing a user-facing error here if possible, though
      // if app-container is missing, there's nowhere to put it.
      // A simple alert could be a last resort for such a critical failure.
      // alert("Kritischer Fehler: App-Container nicht gefunden. Die Anwendung kann nicht starten.");
    }
  }
}

// Instantiate the application to start it
new Application();

console.log("App module (app.ts) loaded and application instantiated.");
