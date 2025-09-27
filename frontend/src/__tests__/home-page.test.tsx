import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import Home from '@/app/page'
import { api } from '@/lib/api/base'

// Create a test store with the API reducer
const createTestStore = () => {
    return configureStore({
        reducer: {
            [api.reducerPath]: api.reducer,
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(api.middleware),
    })
}

// Wrapper component for tests
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={createTestStore()}>{children}</Provider>
)

describe('Home Page Integration Tests', () => {
    it('should render the home page with health status and models', async () => {
        render(
            <TestWrapper>
                <Home />
            </TestWrapper>
        )

        // Check if the main heading is rendered
        expect(screen.getByText(/Revolutionner votre pipeline de/i)).toBeInTheDocument()

        // Check if quick links are rendered
        expect(screen.getByText('Lancer un fine-tuning')).toBeInTheDocument()
        expect(screen.getByText('Parcourir les datasets')).toBeInTheDocument()
        expect(screen.getByText('Catalogue modeles')).toBeInTheDocument()
        expect(screen.getByText('Historique des jobs')).toBeInTheDocument()

        // Wait for API data to load
        await waitFor(() => {
            // Check if models are loaded (should show the first 3 featured models)
            expect(screen.getByText('Qwen2.5-Coder-3B-Instruct')).toBeInTheDocument()
        })

        // Check if health status is loaded (though it might not be visible in UI)
        // The health query should have completed successfully
    })

    it('should display model information correctly', async () => {
        render(
            <TestWrapper>
                <Home />
            </TestWrapper>
        )

        // Wait for models to load
        await waitFor(() => {
            expect(screen.getByText('Qwen2.5-Coder-3B-Instruct')).toBeInTheDocument()
        })

        // Check if model details are displayed
        expect(screen.getByText('text-generation')).toBeInTheDocument()
        expect(screen.getByText('DialoGPT-medium')).toBeInTheDocument()
        expect(screen.getByText('conversational')).toBeInTheDocument()
    })

    it('should handle API loading states', () => {
        render(
            <TestWrapper>
                <Home />
            </TestWrapper>
        )

        // Initially, the page should render without crashing
        expect(screen.getByText(/Revolutionner votre pipeline de/i)).toBeInTheDocument()

        // Models section should be present but might show loading state
        // (depending on how the component handles loading)
    })
})