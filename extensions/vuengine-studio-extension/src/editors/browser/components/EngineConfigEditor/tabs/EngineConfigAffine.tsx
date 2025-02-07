import { nls } from '@theia/core';
import React from 'react';
import Input from '../../Common/Base/Input';
import VContainer from '../../Common/Base/VContainer';
import {
    AFFINE_MAX_ROWS_DEFAULT_VALUE,
    AFFINE_MAX_ROWS_MAX_VALUE,
    AFFINE_MAX_ROWS_MIN_VALUE,
    AFFINE_MAX_SCALE_DEFAULT_VALUE,
    AFFINE_MAX_SCALE_MAX_VALUE,
    AFFINE_MAX_SCALE_MIN_VALUE,
    EngineConfigData
} from '../EngineConfigEditorTypes';

interface EngineConfigAffineProps {
    data: EngineConfigData
    updateData: (data: EngineConfigData) => void
}

export default function EngineConfigAffine(props: EngineConfigAffineProps): React.JSX.Element {
    const { data, updateData } = props;

    const setMaxRows = (maxRowsPerCall: number): void => {
        updateData({
            ...data,
            affine: {
                ...(data.affine ?? {}),
                maxRowsPerCall,
            }
        });
    };

    const setMaxScale = (maxScale: number): void => {
        updateData({
            ...data,
            affine: {
                ...(data.affine ?? {}),
                maxScale,
            }
        });
    };

    return (
        <VContainer gap={15}>
            <Input
                label={nls.localize('vuengine/editors/engineConfig/affine/maxRowsPerCall', 'Maximum Rows Per Call')}
                tooltip={nls.localize(
                    'vuengine/editors/engineConfig/affine/maxRowsPerCallDescription',
                    'The maximum number of rows to write on each call to affine calculation functions.'
                )}
                type="number"
                value={data.affine?.maxRowsPerCall ?? AFFINE_MAX_ROWS_DEFAULT_VALUE}
                setValue={setMaxRows}
                min={AFFINE_MAX_ROWS_MIN_VALUE}
                max={AFFINE_MAX_ROWS_MAX_VALUE}
                defaultValue={AFFINE_MAX_ROWS_DEFAULT_VALUE}
                width={64}
            />
            <Input
                label={nls.localize('vuengine/editors/engineConfig/affine/maxScale', 'Maximum Scale')}
                tooltip={nls.localize(
                    'vuengine/editors/engineConfig/affine/maxScaleDescription',
                    'The maximum possible scale. Affects param table allocation space.'
                )}
                type="number"
                value={data.affine?.maxScale ?? AFFINE_MAX_SCALE_DEFAULT_VALUE}
                setValue={setMaxScale}
                min={AFFINE_MAX_SCALE_MIN_VALUE}
                max={AFFINE_MAX_SCALE_MAX_VALUE}
                defaultValue={AFFINE_MAX_SCALE_DEFAULT_VALUE}
                width={64}
            />
        </VContainer>
    );
}
