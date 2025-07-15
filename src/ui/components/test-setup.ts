/**
 * Shared test setup utilities for component tests
 */

import { Area } from '../../models';

export const testSetup = {
    mockCallbacks: {
        onSubmit: jest.fn(),
        onCancel: jest.fn()
    },
    
    mockArea: {
        id: 'test-area-1',
        name: 'Test Area',
        description: 'Test Description',
        displayOrder: 10,
        inventoryItems: []
    } as Area,
    
    resetMocks() {
        this.mockCallbacks.onSubmit.mockReset();
        this.mockCallbacks.onCancel.mockReset();
    }
};