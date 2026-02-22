import { Chart } from 'chart.js';

const THEME_KEY = 'app-theme';
const DARK_MODE_CLASS = 'dark-mode';

export class ThemeService {
  private currentTheme: 'light' | 'dark';
  private mediaQuery?: MediaQueryList;
  // Define the type for the handler more clearly
  private systemThemeChangeHandler: (e: MediaQueryListEvent) => void;

  constructor() {
    const storedTheme = localStorage.getItem(THEME_KEY) as 'light' | 'dark' | null;
    const systemPrefersDark =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (storedTheme) {
      this.currentTheme = storedTheme;
    } else {
      this.currentTheme = systemPrefersDark ? 'dark' : 'light';
    }
    // Apply theme immediately after determining it.
    // this.applyTheme(); // applyTheme calls updateChartDefaults which might be too early if Chart not loaded.
    // Let's apply just the class/attribute first.
    this.applyBaseThemeStyle();

    // Define the handler properly
    this.systemThemeChangeHandler = (e: MediaQueryListEvent): void => {
      // Only update if no theme explicitly set by user
      if (!localStorage.getItem(THEME_KEY)) {
        this.currentTheme = e.matches ? 'dark' : 'light';
        this.applyTheme(); // Full applyTheme which includes chart updates
      }
    };

    // Listen for system theme changes
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (this.mediaQuery.addEventListener) {
      this.mediaQuery.addEventListener('change', this.systemThemeChangeHandler);
    } else if (this.mediaQuery.addListener) {
      // Deprecated but fallback for older browsers
      this.mediaQuery.addListener(this.systemThemeChangeHandler);
    }

    // Initial full theme application, including charts, after constructor setup.
    // This ensures Chart.js (if loaded) gets themed.
    this.applyTheme();
  }

  public dispose(): void {
    if (this.mediaQuery && this.systemThemeChangeHandler) {
      if (this.mediaQuery.removeEventListener) {
        this.mediaQuery.removeEventListener('change', this.systemThemeChangeHandler);
      } else if (this.mediaQuery.removeListener) {
        this.mediaQuery.removeListener(this.systemThemeChangeHandler);
      }
    }
  }

  public toggleTheme(): void {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, this.currentTheme);
    this.applyTheme();
  }

  public getCurrentTheme(): 'light' | 'dark' {
    return this.currentTheme;
  }

  private applyBaseThemeStyle(): void {
    const htmlElement = document.documentElement;
    if (this.currentTheme === 'dark') {
      document.body.classList.add(DARK_MODE_CLASS);
      htmlElement.setAttribute('data-theme', 'dark');
    } else {
      document.body.classList.remove(DARK_MODE_CLASS);
      htmlElement.setAttribute('data-theme', 'light');
    }
  }

  private applyTheme(): void {
    this.applyBaseThemeStyle();
    // Notify Chart.js instances to update.
    // TODO: AGENTS.md - "Refactor chart theming to use CSS variables or context, not just global JS defaults."
    this.updateChartDefaults();
  }

  private updateChartDefaults(): void {
    const isDark = this.currentTheme === 'dark';
    const fontColor = isDark ? '#e0e0e0' : '#333';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    if (typeof Chart !== 'undefined' && Chart.defaults) {
      Chart.defaults.color = fontColor;

      if (Chart.defaults.scale) {
        Chart.defaults.scale.ticks.color = fontColor;
        Chart.defaults.scale.grid.color = gridColor;
      }
      if (Chart.defaults.plugins?.legend?.labels) {
        // Ensure labels exists
        Chart.defaults.plugins.legend.labels.color = fontColor;
      }
      if (Chart.defaults.plugins?.title) {
        Chart.defaults.plugins.title.color = fontColor;
      }

      Object.values(Chart.instances).forEach((instance) => {
        if (instance && typeof instance.update === 'function') {
          // Check instance and update
          instance.update();
        }
      });
    }
  }
}

export const themeService = new ThemeService();
console.log('Theme Service loaded. Current theme:', themeService.getCurrentTheme());
