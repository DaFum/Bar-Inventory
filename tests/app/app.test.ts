// It's tricky to test the side effect of `import './main';` directly in Jest
// without complex module system manipulations or ensuring `main.ts` itself has testable exports or effects.

// However, we can check if `app.ts` attempts to load `main.ts`.
// One way is to see if `main.ts`'s code (like console logs from Application class) runs when `app.ts` is imported.

// app.ts now contains the Application class directly.
// We'll test that instantiating it (which happens on import) logs expected messages.

// Mock ui-manager as app.ts will try to initialize it.
jest.mock('../../src/ui/ui-manager', () => ({
  initializeApp: jest.fn(),
}));

describe('App Module (app.ts) - Consolidated', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset modules to ensure app.ts runs its top-level code again.
    jest.resetModules();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  test('should log initialization messages when loaded', () => {
    // Importing/requiring app.ts will execute its top-level code, including `new Application()`.
    require('../../src/app');

    // Check for the messages logged by the Application constructor and the final log from app.ts
    expect(consoleLogSpy).toHaveBeenCalledWith('Application initializing...');
    // The DOM related logs ("DOM content loaded...") are conditional and harder to test here
    // without full DOM setup, which is covered by app-initialization.test.ts.
    // So we focus on the direct logs from app.ts execution.
    expect(consoleLogSpy).toHaveBeenCalledWith("App module (app.ts) loaded and application instantiated.");
  });
});
