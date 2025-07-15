/**
 * Test setup utilities for AreaFormComponent tests
 */
import { Area } from '../models';

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
    
    resetMocks: () => {
        jest.clearAllMocks();
        testSetup.mockCallbacks.onSubmit.mockClear();
        testSetup.mockCallbacks.onCancel.mockClear();
    },
    
    createMockArea: (overrides: Partial<Area> = {}): Area => ({
        ...testSetup.mockArea,
        ...overrides
    }),
    
    setupDOM: () => {
        document.body.innerHTML = '';
        // Add any global DOM setup needed
    },
    
    teardownDOM: () => {
        document.body.innerHTML = '';
    }
};