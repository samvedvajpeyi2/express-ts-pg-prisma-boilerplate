import { beforeEach } from "vitest";

import { cleanDatabase } from "./db-helpers.js";

beforeEach(async () => {
    await cleanDatabase();
});
