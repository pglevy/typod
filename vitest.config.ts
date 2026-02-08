import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use jsdom for src/ tests (need localStorage, DOM)
    // Use default (node) for scripts/ tests
    environmentMatchGlobs: [
      ['src/**', 'jsdom'],
    ],
  },
});
