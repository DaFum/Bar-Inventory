/**
 * Common test utilities and mocks for the application tests
 */

export const createMockElement = (id: string, tagName: string = 'div'): HTMLElement => {
  const element = document.createElement(tagName);
  element.id = id;
  return element;
};

export const mockConsole = () => ({
  log: jest.spyOn(console, 'log').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation(),
  warn: jest.spyOn(console, 'warn').mockImplementation()
});

export const mockDocumentReadyState = (state: DocumentReadyState) => {
  Object.defineProperty(document, 'readyState', {
    value: state,
    writable: true,
    configurable: true
  });
};

export const setupDOMMocks = () => {
  const mockAddEventListener = jest.fn();
  const mockGetElementById = jest.fn();
  
  Object.defineProperty(document, 'addEventListener', {
    value: mockAddEventListener,
    writable: true
  });
  
  Object.defineProperty(document, 'getElementById', {
    value: mockGetElementById,
    writable: true
  });
  
  return { mockAddEventListener, mockGetElementById };
};

export const simulateDOMContentLoaded = (mockAddEventListener: jest.Mock) => {
  const eventListener = mockAddEventListener.mock.calls
    .find(call => call[0] === 'DOMContentLoaded')?.[1];
  
  if (eventListener) {
    eventListener();
  }
};