import React from 'react';
import VContainer from '../../Common/Base/VContainer';
import {
    BGMAPS_PER_SEGMENT_DEFAULT_VALUE,
    BGMAPS_PER_SEGMENT_MAX_VALUE,
    BGMAPS_PER_SEGMENT_MIN_VALUE,
    EngineConfigData,
    PARAM_TABLE_SEGMENTS_DEFAULT_VALUE,
    PARAM_TABLE_SEGMENTS_MAX_VALUE,
    PARAM_TABLE_SEGMENTS_MIN_VALUE,
    PRINTABLE_AREA_DEFAULT_VALUE,
    PRINTABLE_AREA_MAX_VALUE,
    PRINTABLE_AREA_MIN_VALUE,
    PRINTING_AREA_OFFSET_PARALLAX_DEFAULT_VALUE,
    PRINTING_AREA_OFFSET_PARALLAX_MAX_VALUE,
    PRINTING_AREA_OFFSET_PARALLAX_MIN_VALUE,
    PRINTING_AREA_OFFSET_X_DEFAULT_VALUE,
    PRINTING_AREA_OFFSET_X_MAX_VALUE,
    PRINTING_AREA_OFFSET_X_MIN_VALUE,
    PRINTING_AREA_OFFSET_Y_DEFAULT_VALUE,
    PRINTING_AREA_OFFSET_Y_MAX_VALUE,
    PRINTING_AREA_OFFSET_Y_MIN_VALUE
} from '../EngineConfigEditorTypes';
import { clamp } from '../../Common/Utils';
import { nls } from '@theia/core';
import InfoLabel from '../../Common/InfoLabel';
import HContainer from '../../Common/Base/HContainer';

interface EngineConfigTextureProps {
    data: EngineConfigData
    updateData: (data: EngineConfigData) => void
}

export default function EngineConfigTexture(props: EngineConfigTextureProps): React.JSX.Element {
    const { data, updateData } = props;

    const setBgmapsPerSegments = (bgmapsPerSegments: number): void => {
        updateData({
            ...data,
            texture: {
                ...(data.texture ?? {}),
                bgmapsPerSegments: clamp(
                    bgmapsPerSegments,
                    BGMAPS_PER_SEGMENT_MIN_VALUE,
                    BGMAPS_PER_SEGMENT_MAX_VALUE,
                    BGMAPS_PER_SEGMENT_DEFAULT_VALUE
                ),
            }
        });
    };

    const setParamTableSegments = (paramTableSegments: number): void => {
        updateData({
            ...data,
            texture: {
                ...(data.texture ?? {}),
                paramTableSegments: clamp(
                    paramTableSegments,
                    PARAM_TABLE_SEGMENTS_MIN_VALUE,
                    PARAM_TABLE_SEGMENTS_MAX_VALUE,
                    PARAM_TABLE_SEGMENTS_DEFAULT_VALUE
                ),
            }
        });
    };

    const setPrintingAreaOffsetX = (value: number): void => {
        updateData({
            ...data,
            texture: {
                ...(data.texture ?? {}),
                printing: {
                    ...(data.texture?.printing ?? {}),
                    offset: {
                        ...(data.texture?.printing?.offset ?? {}),
                        x: clamp(
                            value,
                            PRINTING_AREA_OFFSET_X_MIN_VALUE,
                            PRINTING_AREA_OFFSET_X_MAX_VALUE,
                            PRINTING_AREA_OFFSET_X_DEFAULT_VALUE
                        ),
                    }
                }
            }
        });
    };

    const setPrintingAreaOffsetY = (value: number): void => {
        updateData({
            ...data,
            texture: {
                ...(data.texture ?? {}),
                printing: {
                    ...(data.texture?.printing ?? {}),
                    offset: {
                        ...(data.texture?.printing?.offset ?? {}),
                        y: clamp(
                            value,
                            PRINTING_AREA_OFFSET_Y_MIN_VALUE,
                            PRINTING_AREA_OFFSET_Y_MAX_VALUE,
                            PRINTING_AREA_OFFSET_Y_DEFAULT_VALUE
                        ),
                    }
                }
            }
        });
    };

    const setPrintingAreaOffsetParallax = (value: number): void => {
        updateData({
            ...data,
            texture: {
                ...(data.texture ?? {}),
                printing: {
                    ...(data.texture?.printing ?? {}),
                    offset: {
                        ...(data.texture?.printing?.offset ?? {}),
                        parallax: clamp(
                            value,
                            PRINTING_AREA_OFFSET_PARALLAX_MIN_VALUE,
                            PRINTING_AREA_OFFSET_PARALLAX_MAX_VALUE,
                            PRINTING_AREA_OFFSET_PARALLAX_DEFAULT_VALUE
                        ),
                    }
                }
            }
        });
    };

    const setPrintableArea = (printableArea: number): void => {
        updateData({
            ...data,
            texture: {
                ...(data.texture ?? {}),
                printing: {
                    ...(data.texture?.printing ?? {}),
                    printableArea: clamp(
                        printableArea,
                        PRINTABLE_AREA_MIN_VALUE,
                        PRINTABLE_AREA_MAX_VALUE,
                        PRINTABLE_AREA_DEFAULT_VALUE
                    ),
                }
            }
        });
    };

    return (
        <VContainer gap={15}>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/engineConfig/printing/bgmapsPerSegments', 'BGMaps Per Segments')}
                    tooltip={nls.localize(
                        'vuengine/editors/engineConfig/printing/bgmapsPerSegmentsDescription',
                        'Number of BGMap specs in each BGMap segment.',
                    )}
                />
                <input
                    className="theia-input"
                    style={{ width: 64 }}
                    type="number"
                    value={data.texture?.bgmapsPerSegments ?? BGMAPS_PER_SEGMENT_DEFAULT_VALUE}
                    min={BGMAPS_PER_SEGMENT_MIN_VALUE}
                    max={BGMAPS_PER_SEGMENT_MAX_VALUE}
                    onChange={e => setBgmapsPerSegments(e.target.value === '' ? BGMAPS_PER_SEGMENT_MIN_VALUE : parseInt(e.target.value))}
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/engineConfig/printing/paramTableSegments', 'Param Table Segments')}
                    tooltip={nls.localize(
                        'vuengine/editors/engineConfig/printing/paramTableSegmentsDescription',
                        'Number of segments for param tables.',
                    )}
                />
                <input
                    className="theia-input"
                    style={{ width: 64 }}
                    type="number"
                    value={data.texture?.paramTableSegments ?? PARAM_TABLE_SEGMENTS_DEFAULT_VALUE}
                    min={PARAM_TABLE_SEGMENTS_MIN_VALUE}
                    max={PARAM_TABLE_SEGMENTS_MAX_VALUE}
                    onChange={e => setParamTableSegments(e.target.value === '' ? PARAM_TABLE_SEGMENTS_MIN_VALUE : parseInt(e.target.value))}
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/engineConfig/printing/printingAreaOffset', 'Printing Area Offset (x, y, parallax)')}
                />
                <HContainer>
                    <input
                        className="theia-input"
                        style={{ width: 64 }}
                        type="number"
                        value={data.texture?.printing?.offset?.x ?? PRINTING_AREA_OFFSET_X_DEFAULT_VALUE}
                        min={PRINTING_AREA_OFFSET_X_MIN_VALUE}
                        max={PRINTING_AREA_OFFSET_X_MAX_VALUE}
                        onChange={e => setPrintingAreaOffsetX(e.target.value === '' ? PRINTING_AREA_OFFSET_X_MIN_VALUE : parseInt(e.target.value))}
                    />
                    <input
                        className="theia-input"
                        style={{ width: 64 }}
                        type="number"
                        value={data.texture?.printing?.offset?.y ?? PRINTING_AREA_OFFSET_Y_DEFAULT_VALUE}
                        min={PRINTING_AREA_OFFSET_Y_MIN_VALUE}
                        max={PRINTING_AREA_OFFSET_Y_MAX_VALUE}
                        onChange={e => setPrintingAreaOffsetY(e.target.value === '' ? PRINTING_AREA_OFFSET_Y_MIN_VALUE : parseInt(e.target.value))}
                    />
                    <input
                        className="theia-input"
                        style={{ width: 64 }}
                        type="number"
                        value={data.texture?.printing?.offset?.parallax ?? PRINTING_AREA_OFFSET_PARALLAX_DEFAULT_VALUE}
                        min={PRINTING_AREA_OFFSET_PARALLAX_MIN_VALUE}
                        max={PRINTING_AREA_OFFSET_PARALLAX_MAX_VALUE}
                        onChange={e => setPrintingAreaOffsetParallax(e.target.value === '' ? PRINTING_AREA_OFFSET_PARALLAX_MIN_VALUE : parseInt(e.target.value))}
                    />
                </HContainer>
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/engineConfig/printing/printableArea', 'Printable Area')}
                />
                <input
                    className="theia-input"
                    style={{ width: 64 }}
                    type="number"
                    value={data.texture?.printing?.printableArea ?? PRINTABLE_AREA_DEFAULT_VALUE}
                    min={PRINTABLE_AREA_MIN_VALUE}
                    max={PRINTABLE_AREA_MAX_VALUE}
                    onChange={e => setPrintableArea(e.target.value === '' ? PRINTABLE_AREA_MIN_VALUE : parseInt(e.target.value))}
                />
            </VContainer>
        </VContainer>
    );
}
