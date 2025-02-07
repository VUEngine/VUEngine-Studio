import { nls } from '@theia/core';
import React from 'react';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
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
import Input from '../../Common/Base/Input';

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
                bgmapsPerSegments,
            }
        });
    };

    const setParamTableSegments = (paramTableSegments: number): void => {
        updateData({
            ...data,
            texture: {
                ...(data.texture ?? {}),
                paramTableSegments,
            }
        });
    };

    const setPrintingAreaOffset = (axis: 'x' | 'y' | 'parallax', value: number): void => {
        updateData({
            ...data,
            texture: {
                ...(data.texture ?? {}),
                printing: {
                    ...(data.texture?.printing ?? {}),
                    offset: {
                        ...(data.texture?.printing?.offset ?? {}),
                        [axis]: value,
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
                    printableArea,
                }
            }
        });
    };

    return (
        <VContainer gap={15}>
            <Input
                label={nls.localize('vuengine/editors/engineConfig/printing/bgmapsPerSegments', 'BGMaps Per Segments')}
                tooltip={nls.localize(
                    'vuengine/editors/engineConfig/printing/bgmapsPerSegmentsDescription',
                    'Number of BGMap specs in each BGMap segment.',
                )}
                type="number"
                value={data.texture?.bgmapsPerSegments ?? BGMAPS_PER_SEGMENT_DEFAULT_VALUE}
                setValue={setBgmapsPerSegments}
                min={BGMAPS_PER_SEGMENT_MIN_VALUE}
                max={BGMAPS_PER_SEGMENT_MAX_VALUE}
                defaultValue={BGMAPS_PER_SEGMENT_DEFAULT_VALUE}
                width={64}
            />
            <Input
                label={nls.localize('vuengine/editors/engineConfig/printing/paramTableSegments', 'Param Table Segments')}
                tooltip={nls.localize(
                    'vuengine/editors/engineConfig/printing/paramTableSegmentsDescription',
                    'Number of segments for param tables.',
                )}
                type="number"
                value={data.texture?.paramTableSegments ?? PARAM_TABLE_SEGMENTS_DEFAULT_VALUE}
                setValue={setParamTableSegments}
                min={PARAM_TABLE_SEGMENTS_MIN_VALUE}
                max={PARAM_TABLE_SEGMENTS_MAX_VALUE}
                defaultValue={PARAM_TABLE_SEGMENTS_DEFAULT_VALUE}
                width={64}
            />
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/engineConfig/printing/printingAreaOffset', 'Printing Area Offset (x, y, parallax)')}
                />
                <HContainer>
                    <Input
                        type="number"
                        value={data.texture?.printing?.offset?.x ?? PRINTING_AREA_OFFSET_X_DEFAULT_VALUE}
                        setValue={v => setPrintingAreaOffset('x', v as number)}
                        min={PRINTING_AREA_OFFSET_X_MIN_VALUE}
                        max={PRINTING_AREA_OFFSET_X_MAX_VALUE}
                        defaultValue={PRINTING_AREA_OFFSET_X_DEFAULT_VALUE}
                        width={64}
                    />
                    <Input
                        type="number"
                        value={data.texture?.printing?.offset?.y ?? PRINTING_AREA_OFFSET_Y_DEFAULT_VALUE}
                        setValue={v => setPrintingAreaOffset('y', v as number)}
                        min={PRINTING_AREA_OFFSET_Y_MIN_VALUE}
                        max={PRINTING_AREA_OFFSET_Y_MAX_VALUE}
                        defaultValue={PRINTING_AREA_OFFSET_Y_DEFAULT_VALUE}
                        width={64}
                    />
                    <Input
                        type="number"
                        value={data.texture?.printing?.offset?.parallax ?? PRINTING_AREA_OFFSET_PARALLAX_DEFAULT_VALUE}
                        setValue={v => setPrintingAreaOffset('parallax', v as number)}
                        min={PRINTING_AREA_OFFSET_PARALLAX_MIN_VALUE}
                        max={PRINTING_AREA_OFFSET_PARALLAX_MAX_VALUE}
                        defaultValue={PRINTING_AREA_OFFSET_PARALLAX_DEFAULT_VALUE}
                        width={64}
                    />
                </HContainer>
            </VContainer>
            <Input
                label={nls.localize('vuengine/editors/engineConfig/printing/printableArea', 'Printable Area')}
                type="number"
                value={data.texture?.printing?.printableArea ?? PRINTABLE_AREA_DEFAULT_VALUE}
                setValue={setPrintableArea}
                min={PRINTABLE_AREA_MIN_VALUE}
                max={PRINTABLE_AREA_MAX_VALUE}
                defaultValue={PRINTABLE_AREA_DEFAULT_VALUE}
                width={64}
            />
        </VContainer>
    );
}
