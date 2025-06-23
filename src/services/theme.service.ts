import { Chart } from 'chart.js';

const THEME_KEY = 'app-theme';
const DARK_MODE_CLASS = 'dark-mode';

export class ThemeService {
    private currentTheme: 'light' | 'dark';

    constructor() {
        const storedTheme = localStorage.getItem(THEME_KEY) as 'light' | 'dark' | null;
        // Prefer system theme if no theme is stored, otherwise use stored theme.
        // Default to 'light' if system preference is not dark and nothing is stored.
        const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (storedTheme) {
            this.currentTheme = storedTheme;
        } else {
            this.currentTheme = systemPrefersDark ? 'dark' : 'light';
        }
        this.applyTheme();

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            // Only update if no theme explicitly set by user
            if (!localStorage.getItem(THEME_KEY)) {
                this.currentTheme = e.matches ? 'dark' : 'light';
                this.applyTheme();
            }
        });
    }

    public toggleTheme(): void {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem(THEME_KEY, this.currentTheme);
        this.applyTheme();
    }

    public getCurrentTheme(): 'light' | 'dark' {
        return this.currentTheme;
    }

    private applyTheme(): void {
        const htmlElement = document.documentElement;
        if (this.currentTheme === 'dark') {
            document.body.classList.add(DARK_MODE_CLASS);
            htmlElement.setAttribute('data-theme', 'dark');
        } else {
            document.body.classList.remove(DARK_MODE_CLASS);
            htmlElement.setAttribute('data-theme', 'light');
        }
        // Notify Chart.js instances to update, if possible and necessary
        // This might involve re-rendering charts with new color options.
        // For now, CSS overrides for chart text colors are in style.css
        // A more robust solution would be to update Chart.defaults or specific chart instances.
        this.updateChartDefaults();
    }

    private updateChartDefaults(): void {
        // This is a global override. More specific chart updates might be needed.
        // Chart.js v3+ uses `Chart.defaults.color`, `Chart.defaults.borderColor`, etc.
        const isDark = this.currentTheme === 'dark';
        const fontColor = isDark ? '#e0e0e0' : '#333';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

        // Check if Chart is available (it might not be if this service is loaded before Chart.js components)
        if (typeof Chart !== 'undefined' && Chart.defaults) {
            Chart.defaults.color = fontColor;
            // Chart.defaults.borderColor = gridColor; // This might be too broad

            if (Chart.defaults.scale) { // For scales like x, y axes
                 Chart.defaults.scale.ticks.color = fontColor;
                 Chart.defaults.scale.grid.color = gridColor;
                 Chart.defaults.scale.title.color = fontColor;
            }
            if (Chart.defaults.plugins?.legend) {
                Chart.defaults.plugins.legend.labels.color = fontColor;
            }
            if (Chart.defaults.plugins?.title) {
                Chart.defaults.plugins.title.color = fontColor;
            }
            // Force update all active charts
            Object.values(Chart.instances).forEach(instance => {
                instance.update();
            });
        }
    }
}

export const themeService = new ThemeService();
console.log("Theme Service loaded. Current theme:", themeService.getCurrentTheme());
