import '@testing-library/jest-dom/vitest';
import MockEventSource from './mock-event-source';

beforeEach(() => {
  MockEventSource.instances = [];
  vi.stubGlobal('EventSource', MockEventSource);
});

afterEach(() => {
  vi.unstubAllGlobals();
});
