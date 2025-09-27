/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        coverage: {
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'test/',
                '**/*.d.ts',
                '**/*.config.*',
                'coverage/',
            ],
        },
    },
    resolve: {
        alias: {
            '@': new URL('../backend/src', import.meta.url).pathname,
            'shared': new URL('../shared/src', import.meta.url).pathname,
        },
    },
})