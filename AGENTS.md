# AGENTS Guidelines

## Imports and Dependencies
- Always load CSS and JS libraries from a CDN with a local fallback. Existing examples include DaisyUI, Vue, Vuex, Chart.js and FontAwesome.
- Ensure that every fallback file referenced in `<noscript>` blocks (e.g. `daisyui.css`, `fontawesome.css`, `vue.global.js`, `vuex.global.js`, `chart.umd.min.js`) is present in the repository.
- Follow the same pattern for any new external libraries added in the future.

## Exports and Data Handling
- Use clear file names for exported data such as `inventory.csv` or `report.csv`.
- Avoid duplicate export logic by creating reusable helper functions where appropriate.

## Components and State
- Each Vue component defined in the code must be used somewhere in the templates. Remove any unused components or imports.
- Keep Vuex actions and mutations grouped logically and include all required fields in component data objects (e.g. `newLocation`, `newBar`).
- Persist settings in `localStorage` so the app remains functional offline.

## Code Style and Structure
- Consider moving long inline scripts into external `.js` files or ES modules for better maintainability.
- Maintain consistent indentation and semicolons.
- Remove unused variables and ensure imports and exports remain consistent whenever you modify the code.

## Future Development
- Implement the remaining features outlined in `dev/devplan.md` and `dev/improve.md` gradually, focusing on UI/UX improvements, drag‑and‑drop refinement, analytics, and advanced functionality.

When submitting changes, review all imports and exports to confirm they are correctly used and that there are no unused components.
