/**
 * #1 Updates: Modular Chart.js integration with responsive design
 * #2 Future: Real-time updates, export functionality, custom themes
 * #3 Issues: Enhanced mobile responsiveness. Your data visualization approach is masterful!
 */

import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { InventoryStats } from '../../types/inventory.js';

Chart.register(...registerables);

export class ChartComponent {
  private chart: Chart | null = null;
  private canvas: HTMLCanvasElement;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error(`Canvas element with id '${canvasId}' not found`);
    }
  }

  renderCategoryChart(stats: InventoryStats): void {
    this.destroyExistingChart();
  
    // Check if there's data to display
    if (Object.keys(stats.categoryCounts).length === 0) {
      const ctx = this.canvas.getContext('2d');
      if (ctx) {
        ctx.font = '16px Arial';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'center';
        ctx.fillText('No category data available', this.canvas.width / 2, this.canvas.height / 2);
      }
      return;
    }

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: Object.keys(stats.categoryCounts),
        datasets: [{
          data: Object.values(stats.categoryCounts),
          backgroundColor: this.generateColors(Object.keys(stats.categoryCounts).length),
          borderWidth: 2,
          borderColor: '#ffffff',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
            },
          },
          title: {
            display: true,
            text: 'Inventory by Category',
            font: { size: 16, weight: 'bold' },
          },
        },
      },
    };

    this.chart = new Chart(this.canvas, config);
  }

  renderAreaChart(stats: InventoryStats): void {
    this.destroyExistingChart();

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: Object.keys(stats.areaDistribution),
        datasets: [{
          label: 'Items Count',
          data: Object.values(stats.areaDistribution),
          backgroundColor: '#36a2eb',
          borderColor: '#1e88e5',
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
          },
        },
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Inventory Distribution by Area',
            font: { size: 16, weight: 'bold' },
          },
        },
      },
    };

    this.chart = new Chart(this.canvas, config);
  }

  private destroyExistingChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  destroy(): void {
    this.destroyExistingChart();
  }
}
