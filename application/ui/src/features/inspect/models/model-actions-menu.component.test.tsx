import { ThemeProvider } from '@geti/ui/theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getMockedModelData } from 'mocks/mock-model';
import { vi } from 'vitest';

import { ModelActionsMenu } from './model-actions-menu.component';

vi.mock('@anomalib-studio/api', () => ({
    $api: {
        useMutation: vi.fn(() => ({
            isPending: false,
            mutateAsync: vi.fn(),
        })),
    },
}));

vi.mock('@anomalib-studio/hooks', () => ({
    useProjectIdentifier: vi.fn(() => ({ projectId: 'project-123' })),
    usePatchPipeline: vi.fn(() => ({
        isPending: false,
        mutateAsync: vi.fn(),
    })),
}));

describe('ModelActionsMenu', () => {
    const renderComponent = (model = getMockedModelData(), selectedModelId: string | undefined = undefined) => {
        return render(
            <QueryClientProvider client={new QueryClient()}>
                <ThemeProvider>
                    <ModelActionsMenu model={model} selectedModelId={selectedModelId} />
                </ThemeProvider>
            </QueryClientProvider>
        );
    };

    it('shows delete action for persisted canceled models', async () => {
        renderComponent(
            getMockedModelData({
                id: 'model-2',
                status: 'Failed',
                isPersisted: true,
                job: {
                    id: 'job-2',
                    status: 'canceled',
                    progress: 0.2,
                    payload: { model_name: 'Model 2' },
                },
            })
        );

        await userEvent.click(screen.getByRole('button', { name: /model actions/i }));

        expect(screen.getByRole('menuitem', { name: /Delete model/i })).toBeVisible();
    });

    it('does not show delete action for non-persisted failed jobs', async () => {
        renderComponent(
            getMockedModelData({
                id: 'job-3',
                status: 'Failed',
                isPersisted: false,
                job: {
                    id: 'job-3',
                    status: 'failed',
                    progress: 0.1,
                    payload: { model_name: 'Model 3' },
                },
            })
        );

        await userEvent.click(screen.getByRole('button', { name: /model actions/i }));

        expect(screen.queryByRole('menuitem', { name: /Delete model/i })).not.toBeInTheDocument();
    });
});
