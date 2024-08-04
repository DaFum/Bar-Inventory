# Bar Inventory Management System

## Overview

The Bar Inventory Management System is a web application designed to help bar managers keep track of their inventory. It allows users to manage categories, areas, and items, and to view inventory levels at different phases: start, end, and difference. The application is built using Vue.js, Vuex, and IndexedDB for local storage.

## Features

- **Category Management**: Add, edit, and remove categories.
- **Area Management**: Add, edit, and remove areas within the bar.
- **Item Management**: Add, edit, and remove inventory items.
- **Phases**: Track inventory at the start and end of a period, and automatically calculate the difference.
- **Formula Input**: Enter formulas for inventory quantities that can be dynamically calculated.
- **View Toggle**: Switch between formula view and sum view for inventory quantities.
- **Export/Import**: Export inventory data to CSV or JSON files, and import data from JSON files.
- **Toasts**: Display toast notifications for successful actions.

## Technologies Used

- **Vue.js**: JavaScript framework for building user interfaces.
- **Vuex**: State management library for Vue.js applications.
- **IndexedDB**: Low-level API for client-side storage of significant amounts of structured data.
- **DaisyUI**: Tailwind CSS components for styling.

## Usage

### Managing Categories

1. Navigate to the "Manage View" tab.
2. Under "Categories", you can add new categories by entering the category name and clicking "Add Category".
3. Existing categories can be removed by clicking the "Remove" button next to the category name.

### Managing Areas

1. Navigate to the "Manage View" tab.
2. Under "Areas", you can add new areas by entering the area name and clicking "Add Area".
3. Existing areas can be removed by clicking the "Remove" button next to the area name.

### Managing Items

1. Navigate to the "Manage View" tab.
2. Under "Add Item", enter the item name and select a category.
3. Click "Add Item" to add the item to the inventory.
4. Existing items can be edited or removed by clicking the respective buttons next to the item name in the inventory list.

### Viewing and Updating Inventory

1. Navigate to the "List View" tab.
2. Switch between "Start", "End", and "Difference" phases using the buttons at the top.
3. Enter inventory quantities using formulas (e.g., `5+10`). The system will dynamically calculate the sum.
4. Toggle between formula view and sum view using the "Show Formula" / "Show Sum" button.
5. Notes can be added for the "Difference" phase.

### Exporting and Importing Data

1. **Export to CSV**: Click the "Export to CSV" button to download the inventory data as a CSV file.
2. **Export Inventory**: Click the "Export Inventory" button to download the inventory data as a JSON file.
3. **Import Inventory**: Click the "Import Inventory" button and select a JSON file to upload and update the inventory data.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [Vue.js](https://vuejs.org/)
- [Vuex](https://vuex.vuejs.org/)
- [DaisyUI](https://daisyui.com/)
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
