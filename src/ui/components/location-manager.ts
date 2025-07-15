import { LocationManagerComponent } from './location-manager.component';

export function initLocationManager(container: HTMLElement): void {
    const locationManagerComponent = new LocationManagerComponent();
    locationManagerComponent.appendTo(container);
}
