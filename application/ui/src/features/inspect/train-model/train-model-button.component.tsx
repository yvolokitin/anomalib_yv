import { Suspense } from 'react';

import { $api } from '@anomalib-studio/api';
import { useProjectIdentifier } from '@anomalib-studio/hooks';
import { Button, DialogTrigger, Tooltip, TooltipTrigger } from '@geti/ui';

import { REQUIRED_NUMBER_OF_NORMAL_IMAGES_TO_TRIGGER_TRAINING } from '../dataset/utils';
import { TrainModelDialog } from './train-model-dialog.component';

const useTrainingButtonState = () => {
    const { projectId } = useProjectIdentifier();
    const { data } = $api.useQuery('get', '/api/projects/{project_id}/images', {
        params: { path: { project_id: projectId } },
    });

    const uploadedNormalImages = data?.media.length ?? 0;
    const missingImages = Math.max(REQUIRED_NUMBER_OF_NORMAL_IMAGES_TO_TRIGGER_TRAINING - uploadedNormalImages, 0);
    const isDisabled = missingImages > 0;

    return {
        isDisabled,
        uploadedNormalImages,
        missingImages,
    };
};

export const TrainModelButton = () => {
    const { isDisabled, uploadedNormalImages, missingImages } = useTrainingButtonState();
    const tooltipMessage =
        `Model training requires a minimum of ${REQUIRED_NUMBER_OF_NORMAL_IMAGES_TO_TRIGGER_TRAINING} images to start training ` +
        `(${uploadedNormalImages}/${REQUIRED_NUMBER_OF_NORMAL_IMAGES_TO_TRIGGER_TRAINING} uploaded, ${missingImages} more needed).`;

    return (
        <Suspense
            fallback={
                <Button isDisabled isPending>
                    Train model
                </Button>
            }
        >
            {isDisabled ? (
                <TooltipTrigger delay={300}>
                    <span style={{ display: 'inline-flex', cursor: 'pointer' }} title={tooltipMessage}>
                        <Button isDisabled UNSAFE_style={{ cursor: 'pointer' }}>
                            Train model
                        </Button>
                    </span>
                    <Tooltip>{tooltipMessage}</Tooltip>
                </TooltipTrigger>
            ) : (
                <DialogTrigger type='modal'>
                    <Button UNSAFE_style={{ cursor: 'pointer' }}>Train model</Button>
                    {(close) => <TrainModelDialog close={close} />}
                </DialogTrigger>
            )}
        </Suspense>
    );
};
