import { themeService } from '../services/theme.service'; // Import ThemeService
import { initInventoryView } from './components/inventory-view';
import { initLocationManager } from './components/location-manager';
import { initProductManager } from './components/product-manager';
import { initAnalyticsView } from './components/analytics-view';

// Main application container element
let appContainer: HTMLElement | null = null;

// Current active view
type ViewName = 'locations' | 'products' | 'inventory' | 'analytics' | 'settings'; // Added 'analytics'
let currentView: ViewName = 'inventory'; /**
 * Initialisiert die Benutzeroberfläche der Anwendung im angegebenen Container und lädt die Startansicht.
 *
 * @param container - Das HTML-Element, in dem die Hauptanwendung aufgebaut wird
 */

export function exampleAppSetup(container: HTMLElement): void {
    appContainer = container;
    renderLayout();
    navigateTo(currentView); // Navigate to default view
}

/**
 * Rendert das Hauptlayout der Anwendung mit Navigationsleiste, Theme-Umschalter und Inhaltsbereich im App-Container.
 *
 * Initialisiert die Navigations- und Theme-Buttons mit Event-Listenern, um Ansichtswechsel und das Umschalten des Farbschemas zu ermöglichen.
 */
function renderLayout(): void {
    if (!appContainer) return;

    appContainer.innerHTML = `
        <nav id="main-nav" class="navbar">
            <div role="menubar"> <!-- Group for view buttons -->
                <button data-view="inventory" class="nav-button" role="menuitem">Inventur</button>
                <button data-view="analytics" class="nav-button" role="menuitem">Analyse</button>
                <button data-view="products" class="nav-button" role="menuitem">Produktkatalog</button>
                <button data-view="locations" class="nav-button" role="menuitem">Standorte Verwalten</button>
                <button data-view="settings" class="nav-button" role="menuitem">Einstellungen</button>
            </div>
            <div> <!-- Group for theme toggle -->
                <button id="theme-toggle-btn" class="btn btn-sm btn-secondary" aria-label="Toggle Dark Mode">Theme wechseln</button>
            </div>
        </nav>
        <main id="view-container" class="view-content" role="main" aria-live="polite">
            <!-- Specific view content will be rendered here -->
        </main>
    `;

    document.querySelectorAll('#main-nav .nav-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const viewName = (e.target as HTMLElement).dataset.view as ViewName;
            if (viewName) {
                navigateTo(viewName);
            }
        });
    });

    document.getElementById('theme-toggle-btn')?.addEventListener('click', () => {
        themeService.toggleTheme();
        // Update button text or icon if needed based on themeService.getCurrentTheme()
        // For now, charts are updated globally by themeService.
    });
}

/**
 * Navigiert zur angegebenen Ansicht und lädt den entsprechenden Inhalt in den Hauptbereich.
 *
 * @param viewName - Name der Zielansicht, die angezeigt werden soll
 */
function navigateTo(viewName: ViewName): void {
    currentView = viewName;
    const viewContainer = document.getElementById('view-container');
    if (!viewContainer) {
        console.error("View container not found!");
        return;
    }

    // Clear previous view content
    viewContainer.innerHTML = '';
    updateActiveNavButton();

    switch (viewName) {
        case 'locations':
            initLocationManager(viewContainer);
            break;
        case 'products':
            initProductManager(viewContainer);
            break;
        case 'inventory':
            initInventoryView(viewContainer);
            break;
        case 'analytics': // Handle Analytics View
            initAnalyticsView(viewContainer);
            break;
        case 'settings':
            viewContainer.innerHTML = '<h2>Einstellungen (Demnächst)</h2>';
            break;
        default:
            viewContainer.innerHTML = '<p>Unbekannte Ansicht.</p>';
    }
    console.log(`Navigated to ${viewName}`);
}

/**
 * Hebt die Navigationsschaltfläche der aktuell aktiven Ansicht hervor und entfernt die Hervorhebung von allen anderen.
 */
function updateActiveNavButton(): void {
    document.querySelectorAll('#main-nav .nav-button').forEach(button => {
        if (button.getAttribute('data-view') === currentView) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

console.log("UI Manager initialized.");
