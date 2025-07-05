// It's tricky to test the side effect of `import './main';` directly in Jest
// without complex module system manipulations or ensuring `main.ts` itself has testable exports or effects.

// However, we can check if `app.ts` attempts to load `main.ts`.
// One way is to see if `main.ts`'s code (like console logs from Application class) runs when `app.ts` is imported.

// Mock main.ts to see if app.ts tries to load it.
// This is a bit of a "presence" test.
let mainTSRun = false;
jest.mock('./main', () => {
  // This mock will be used when app.ts executes `import './main';`
  // We can set a flag or log something here.
  mainTSRun = true;
  // console.log("Mocked main.ts loaded"); // For debugging test setup
});

describe('App Module (app.ts)', () => {
  beforeEach(() => {
    // Reset the flag before each test
    mainTSRun = false;
    // Reset modules to ensure app.ts runs its top-level code again if needed,
    // though for simple import, this might not be strictly necessary for this test.
    jest.resetModules();
  });

  test('should load and execute main.ts', () => {
    // When app.ts is imported, it should in turn import './main'.
    // Our mock for './main' will set mainTSRun to true.
    require('./app');
    expect(mainTSRun).toBe(true);
  });

  test('should log to console when app module is loaded', () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    require('./app');
    // Check for the specific log message from app.ts
    expect(consoleLogSpy).toHaveBeenCalledWith("App module loaded. Main execution starts in main.ts.");
    consoleLogSpy.mockRestore();
  });
});
