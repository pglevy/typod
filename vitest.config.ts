import { defineConfig } from 'vitest/config';
import os from 'node:os';
import path from 'node:path';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environmentMatchGlobs: [
      ['src/**', 'jsdom'],
    ],
    // Node 25 ships a native localStorage that requires --localstorage-file.
    // Point it at a temp file so it doesn't shadow jsdom's implementation.
    env: {
      NODE_OPTIONS: `--localstorage-file=${path.join(os.tmpdir(), 'vitest-localstorage')}`,
    },
  },
});
