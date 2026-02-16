// Copyright (C) 2025 Intel Corporation
// SPDX-License-Identifier: Apache-2.0

import { ThemeProvider } from '@geti/ui/theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http } from 'src/api/utils';
import { server } from 'src/msw-node-setup';

import { REQUIRED_NUMBER_OF_NORMAL_IMAGES_TO_TRIGGER_TRAINING } from '../dataset/utils';
import { TrainModelButton } from './train-model-button.component';

const renderButton = () => {
    return render(
        <QueryClientProvider client={new QueryClient()}>
            <ThemeProvider>
                <MemoryRouter initialEntries={['/projects/project-123/inspect']}>
                    <Routes>
                        <Route path='/projects/:projectId/inspect' element={<TrainModelButton />} />
                    </Routes>
                </MemoryRouter>
            </ThemeProvider>
        </QueryClientProvider>
    );
};

describe('TrainModelButton', () => {
    it('shows tooltip with image counter when training is disabled', async () => {
        server.use(
            http.get('/api/projects/{project_id}/images', () => {
                return HttpResponse.json({
                    media: Array.from({ length: 18 }, (_, index) => ({ id: `image-${index}` })),
                    pagination: { offset: 0, limit: 100, count: 18, total: 18 },
                });
            })
        );

        renderButton();

        const trainButton = await screen.findByRole('button', { name: /train model/i });
        expect(trainButton).toBeDisabled();

        await userEvent.hover(trainButton.closest('span') ?? trainButton);

        await waitFor(() => {
            expect(
                screen.getByText(
                    `Model training requires a minimum of ${REQUIRED_NUMBER_OF_NORMAL_IMAGES_TO_TRIGGER_TRAINING} images to start training (18/${REQUIRED_NUMBER_OF_NORMAL_IMAGES_TO_TRIGGER_TRAINING} uploaded, 2 more needed).`
                )
            ).toBeVisible();
        });
    });

    it('enables button when minimum images threshold is met', async () => {
        server.use(
            http.get('/api/projects/{project_id}/images', () => {
                return HttpResponse.json({
                    media: Array.from({ length: REQUIRED_NUMBER_OF_NORMAL_IMAGES_TO_TRIGGER_TRAINING }, (_, index) => ({
                        id: `image-${index}`,
                    })),
                    pagination: {
                        offset: 0,
                        limit: 100,
                        count: REQUIRED_NUMBER_OF_NORMAL_IMAGES_TO_TRIGGER_TRAINING,
                        total: REQUIRED_NUMBER_OF_NORMAL_IMAGES_TO_TRIGGER_TRAINING,
                    },
                });
            })
        );

        renderButton();

        const trainButton = await screen.findByRole('button', { name: /train model/i });
        expect(trainButton).toBeEnabled();
    });
});
