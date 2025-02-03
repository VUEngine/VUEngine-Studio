import { nls } from '@theia/core';
import React from 'react';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
import { clamp } from '../../Common/Utils';
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
                maxRowsPerCall: clamp(maxRowsPerCall, AFFINE_MAX_ROWS_MIN_VALUE, AFFINE_MAX_ROWS_MAX_VALUE, AFFINE_MAX_ROWS_DEFAULT_VALUE),
            }
        });
    };

    const setMaxScale = (maxScale: number): void => {
        updateData({
            ...data,
            affine: {
                ...(data.affine ?? {}),
                maxScale: clamp(maxScale, AFFINE_MAX_SCALE_MIN_VALUE, AFFINE_MAX_SCALE_MAX_VALUE, AFFINE_MAX_SCALE_DEFAULT_VALUE),
            }
        });
    };

    return (
        <VContainer gap={15}>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/engineConfigEditor/affine/maxRowsPerCall', 'Maximum Rows Per Call')}
                    tooltip={nls.localize(
                        'vuengine/engineConfigEditor/affine/maxRowsPerCallDescription',
                        'The maximum number of rows to write on each call to affine calculation functions.'
                    )}
                />
                <input
                    className="theia-input"
                    style={{ width: 64 }}
                    type="number"
                    value={data.affine?.maxRowsPerCall ?? AFFINE_MAX_ROWS_DEFAULT_VALUE}
                    min={AFFINE_MAX_ROWS_MIN_VALUE}
                    max={AFFINE_MAX_ROWS_MAX_VALUE}
                    onChange={e => setMaxRows(e.target.value === '' ? AFFINE_MAX_ROWS_MIN_VALUE : parseInt(e.target.value))}
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/engineConfigEditor/affine/maxScale', 'Maximum Scale')}
                    tooltip={nls.localize(
                        'vuengine/engineConfigEditor/affine/maxScaleDescription',
                        'The maximum possible scale. Affects param table allocation space.'
                    )}
                />
                <input
                    className="theia-input"
                    style={{ width: 64 }}
                    type="number"
                    value={data.affine?.maxScale ?? AFFINE_MAX_SCALE_DEFAULT_VALUE}
                    min={AFFINE_MAX_SCALE_MIN_VALUE}
                    max={AFFINE_MAX_SCALE_MAX_VALUE}
                    onChange={e => setMaxScale(e.target.value === '' ? AFFINE_MAX_SCALE_MIN_VALUE : parseInt(e.target.value))}
                />
            </VContainer>
        </VContainer>
    );
}
