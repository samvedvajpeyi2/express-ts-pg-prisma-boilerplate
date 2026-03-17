import { afterEach, beforeEach, vi } from "vitest";

// Restore mocks and reset modules between tests
beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
});

// Global teardown if needed
afterEach(() => {
    // placeholder for cleanup (e.g., closing DB connections)
});
