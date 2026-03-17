import "vitest";

declare global {
    // Example global constant for tests
    const TEST_TIMEOUT_MS: number;

    // Example global helper object available in tests
    interface TestHelpers {
        createTestUser(): Promise<{ id: string }>;
        getAuthToken(userId: string): Promise<string>;
    }
    var testHelpers: TestHelpers;
}
