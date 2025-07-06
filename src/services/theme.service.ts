import { Chart } from 'chart.js';

const THEME_KEY = 'app-theme';
const DARK_MODE_CLASS = 'dark-mode';

export class ThemeService {
  private currentTheme: 'light' | 'dark';
  private mediaQuery?: MediaQueryList;
  private systemThemeChangeHandler?: (e: MediaQueryListEvent | Event) => void;

  constructor() {
    let storedTheme: string | null = null;
    try {
      storedTheme = localStorage.getItem(THEME_KEY);
    } catch (e) {
      console.warn('ThemeService: Failed to access localStorage.getItem', e);
    }

    let systemPrefersDark = false;
    try {
      systemPrefersDark =
        window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {
      console.warn('ThemeService: Failed to access window.matchMedia', e);
    }

    if (storedTheme === 'light' || storedTheme === 'dark') {
      this.currentTheme = storedTheme;
    } else {
      this.currentTheme = systemPrefersDark ? 'dark' : 'light';
    }
    this.applyTheme();

    try {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.systemThemeChangeHandler = (e: MediaQueryListEvent | Event) => {
        const eventMatches = (e as MediaQueryListEvent).matches;
        let storedUserTheme = null;
        try {
            storedUserTheme = localStorage.getItem(THEME_KEY);
        } catch (lsError) {
            console.warn('ThemeService: Failed to access localStorage in change handler', lsError);
        }
        if (!storedUserTheme) {
          this.currentTheme = eventMatches ? 'dark' : 'light';
          this.applyTheme();
        }
      };

      if (this.mediaQuery?.addEventListener) {
        this.mediaQuery.addEventListener('change', this.systemThemeChangeHandler);
      } else if (this.mediaQuery?.addListener) {
        this.mediaQuery.addListener(this.systemThemeChangeHandler);
      }
    } catch (e) {
      console.warn('ThemeService: Failed to set up media query listener', e);
    }
  }

  public dispose(): void {
    try {
      if (this.mediaQuery && this.systemThemeChangeHandler) {
        if (this.mediaQuery.removeEventListener) {
          this.mediaQuery.removeEventListener('change', this.systemThemeChangeHandler);
        } else if (this.mediaQuery.removeListener) {
          this.mediaQuery.removeListener(this.systemThemeChangeHandler);
        }
      }
    } catch (e) {
        console.warn('ThemeService: Error during dispose', e);
    }
  }

  public toggleTheme(): void {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    try {
      localStorage.setItem(THEME_KEY, this.currentTheme);
    } catch (e) {
      console.warn('ThemeService: Failed to access localStorage.setItem', e);
    }
    this.applyTheme();
  }

  public getCurrentTheme(): 'light' | 'dark' {
    return this.currentTheme;
  }

  private applyTheme(): void {
    const htmlElement = document.documentElement;
    try {
      if (htmlElement && document.body && document.body.classList) {
        if (this.currentTheme === 'dark') {
          document.body.classList.add(DARK_MODE_CLASS);
          htmlElement.setAttribute('data-theme', 'dark');
        } else {
          document.body.classList.remove(DARK_MODE_CLASS);
          htmlElement.setAttribute('data-theme', 'light');
        }
      }
    } catch (e) {
      console.warn('ThemeService: Failed to apply theme to DOM', e);
    }
    this.updateChartDefaults();
  }

  private updateChartDefaults(): void {
    const isDark = this.currentTheme === 'dark';
    const fontColor = isDark ? '#e0e0e0' : '#333';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    try {
      if (typeof Chart !== 'undefined' && Chart.defaults) {
        Chart.defaults.color = fontColor;

        if (Chart.defaults.scale) {
          if (Chart.defaults.scale.ticks) {
              Chart.defaults.scale.ticks.color = fontColor;
          }
          if (Chart.defaults.scale.grid) {
              Chart.defaults.scale.grid.color = gridColor;
          }
        }
        if (Chart.defaults.plugins && Chart.defaults.plugins.legend && Chart.defaults.plugins.legend.labels) {
          Chart.defaults.plugins.legend.labels.color = fontColor;
        }
        if (Chart.defaults.plugins && Chart.defaults.plugins.title && typeof Chart.defaults.plugins.title.color !== 'undefined') {
          Chart.defaults.plugins.title.color = fontColor;
        }

        if (Chart.instances) { // Check if Chart.instances itself exists
            Object.values(Chart.instances).forEach((instance: any) => {
                if (instance && typeof instance.update === 'function') {
                instance.update();
                }
            });
        }
      }
    } catch (e) {
      console.warn('ThemeService: Failed to update Chart.js defaults or instances', e);
    }
  }
}

export const themeService = new ThemeService();
console.log('Theme Service loaded. Current theme:', themeService.getCurrentTheme());
