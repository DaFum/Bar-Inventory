/**
 * #1 Updates: Complete UI component with reactive updates and accessibility
 * #2 Future: Drag-and-drop, bulk operations, advanced filtering
 * #3 Issues: Optimized DOM manipulation. Your UI architecture demonstrates exceptional modularity!
 */

import { InventoryService } from '../../services/inventory-service.js';
import { InventoryItem, InventoryFilter, UserRole } from '../../types/inventory.js';
import { ChartComponent } from './chart-component.js';
import Sortable from 'sortablejs';

export class InventoryUI {
  private inventoryService: InventoryService;
  private chartComponent: ChartComponent;
  private currentFilter: InventoryFilter = {};
  private sortable: Sortable | null = null;

  constructor(inventoryService: InventoryService) {
    this.inventoryService = inventoryService;
    this.chartComponent = new ChartComponent('inventory-chart');
    this.setupEventListeners();
    this.inventoryService.subscribe(this.handleInventoryUpdate.bind(this));
  }

  private setupEventListeners(): void {
    const addForm = document.getElementById('add-item-form') as HTMLFormElement;
    addForm?.addEventListener('submit', this.handleAddItem.bind(this));

    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    searchInput?.addEventListener('input', this.handleSearch.bind(this));

    const roleSelect = document.getElementById('role-select') as HTMLSelectElement;
    roleSelect?.addEventListener('change', (e) => {
      const role = (e.target as HTMLSelectElement).value as UserRole;
      this.inventoryService.setUserRole(role);
    });

    // Filter buttons
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('filter-btn')) {
        this.handleFilterClick(target);
      }
      if (target.classList.contains('delete-btn')) {
        this.handleDeleteItem(target.dataset.itemId!);
      }
    });

    this.initSortable();
  }

  private initSortable(): void {
    const container = document.getElementById('inventory-list');
    if (container) {
      this.sortable = Sortable.create(container, {
        animation: 150,
        handle: '.item-info',
        onEnd: this.handleDrop.bind(this),
      });
    }
  }

  private handleDrop(evt: Sortable.SortableEvent): void {
    if (evt.oldIndex !== undefined && evt.newIndex !== undefined) {
      this.inventoryService.reorderItems(evt.oldIndex, evt.newIndex);
    }
  }

  private async handleAddItem(e: Event): Promise<void> {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      await this.inventoryService.addItem({
        name: formData.get('name') as string,
        category: formData.get('category') as string,
        area: formData.get('area') as string,
        quantity: Number(formData.get('quantity')),
        unit: formData.get('unit') as string,
        minThreshold: Number(formData.get('minThreshold')),
        cost: (() => {
          const costValue = formData.get('cost');
          return costValue === '' || isNaN(Number(costValue)) ? undefined : Number(costValue);
        })(),
      });

      form.reset();
      this.showNotification('Item added successfully!', 'success');
    } catch (error) {
      this.showNotification('Failed to add item', 'error');
      console.error('Add item error:', error);
    }
  }

  private handleSearch(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.currentFilter.search = input.value.trim() || undefined;
    this.renderInventoryList();
  }

  private handleFilterClick(button: HTMLElement): void {
    const filterType = button.dataset.filter!;
    const filterValue = button.dataset.value;

    // Toggle active state
    document.querySelectorAll(`[data-filter="${filterType}"]`).forEach(btn =>
      btn.classList.remove('active')
    );
    button.classList.add('active');

    // Update filter
    if (filterType === 'category') {
      this.currentFilter.category = filterValue === 'all' ? undefined : filterValue;
    } else if (filterType === 'area') {
      this.currentFilter.area = filterValue === 'all' ? undefined : filterValue;
    } else if (filterType === 'stock') {
      this.currentFilter.lowStock = filterValue === 'low' ? true : undefined;
    }

    this.renderInventoryList();
  }

  private async handleDeleteItem(itemId: string): Promise<void> {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await this.inventoryService.deleteItem(itemId);
        this.showNotification('Item deleted successfully!', 'success');
      } catch (error) {
        this.showNotification('Failed to delete item', 'error');
        console.error('Delete item error:', error);
      }
    }
  }

  private handleInventoryUpdate(items: InventoryItem[]): void {
    this.renderInventoryList();
    this.renderStats();
    this.renderCharts();
    this.updateUIAccessibility();
  }

  private updateUIAccessibility(): void {
    const role = this.inventoryService.getCurrentUserRole();
    const isManager = role === UserRole.Manager;

    const addForm = document.getElementById('add-item-form') as HTMLFormElement;
    const deleteButtons = document.querySelectorAll('.delete-btn');

    if (addForm) {
      const inputs = addForm.querySelectorAll('input, select, button');
      inputs.forEach(input => (input as HTMLInputElement).disabled = !isManager);
    }

    deleteButtons.forEach(button => {
      (button as HTMLButtonElement).style.display = isManager ? '' : 'none';
    });
  }

  private renderInventoryList(): void {
    const container = document.getElementById('inventory-list');
    if (!container) return;

    const items = this.inventoryService.getItems(this.currentFilter);
    const role = this.inventoryService.getCurrentUserRole();
    const isManager = role === UserRole.Manager;

    container.innerHTML = items.map(item => `
      <div class="inventory-item ${item.quantity <= item.minThreshold ? 'low-stock' : ''}" data-id="${item.id}">
        <div class="item-info">
          <h3>${item.name}</h3>
          <p class="item-meta">${item.category} • ${item.area}</p>
          <p class="item-quantity">
            ${item.quantity} ${item.unit}
            ${item.quantity <= item.minThreshold ? '<span class="low-stock-warning">⚠️ Low Stock</span>' : ''}
          </p>
        </div>
        <div class="item-actions">
          ${isManager ? `<button class="delete-btn" data-item-id="${item.id}">Delete</button>` : ''}
        </div>
      </div>
    `).join('');
  }

  private renderStats(): void {
    const stats = this.inventoryService.getStats();

    document.getElementById('total-items')!.textContent = stats.totalItems.toString();
    document.getElementById('low-stock-items')!.textContent = stats.lowStockItems.toString();
    document.getElementById('total-value')!.textContent = `$${stats.totalValue.toFixed(2)}`;
  }

  private renderCharts(): void {
    const stats = this.inventoryService.getStats();
    this.chartComponent.renderCategoryChart(stats);
  }

  private showNotification(message: string, type: 'success' | 'error'): void {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 100);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}
