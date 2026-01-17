import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test/setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            reportsDirectory: './coverage',
            exclude: [
                'node_modules/',
                'src/test/',
                '**/*.d.ts',
                '**/*.config.*',
                '**/*.test.*',
                '**/__tests__/**',
                'amplify/',
                '.next/',
                'coverage/',
                'public/',
                'docs/',
                '*.config.js',
                '*.config.ts',
                'src/types/index.ts', // Type definitions
                'src/lib/mock-auth.ts', // Mock utilities
            ],
            include: [
                'src/**/*.{ts,tsx}',
            ],
            thresholds: {
                global: {
                    branches: 80,
                    functions: 80,
                    lines: 80,
                    statements: 80,
                },
                // Per-file thresholds for critical components
                'src/components/healthcare/**/*.{ts,tsx}': {
                    branches: 85,
                    functions: 85,
                    lines: 85,
                    statements: 85,
                },
                'src/hooks/**/*.{ts,tsx}': {
                    branches: 85,
                    functions: 85,
                    lines: 85,
                    statements: 85,
                },
                'src/lib/stores/**/*.{ts,tsx}': {
                    branches: 90,
                    functions: 90,
                    lines: 90,
                    statements: 90,
                },
            },
        },
        // Test timeout for slower E2E tests
        testTimeout: 10000,
        // Retry failed tests once
        retry: 1,
        // Run tests in parallel
        pool: 'threads',
        poolOptions: {
            threads: {
                singleThread: false,
            },
        },
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
    css: {
        postcss: null, // Disable PostCSS processing
    },
});