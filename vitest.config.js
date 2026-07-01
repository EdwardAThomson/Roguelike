import { defineConfig } from 'vitest/config';

// Convention: Vitest files use `.test.js`, Playwright specs use `.spec.js`.
// Restricting `include` to *.test.js keeps the two suites from bleeding into
// each other (the e2e specs use Playwright's `test` global and would blow up
// under Vitest).
export default defineConfig({
    test: {
        include: ['**/*.test.js']
    }
});
