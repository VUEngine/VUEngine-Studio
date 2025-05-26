import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import VContainer from '../../Common/Base/VContainer';
import NumberArrayPreview from '../../Common/NumberArrayPreview';
import { WAVEFORM_MAX } from '../SoundEditorTypes';
import WaveForm from './WaveForm';
import { WAVEFORM_PRESETS } from './WaveFormPresets';
import styled from 'styled-components';

const StyledWaveformContainer = styled.div`
    display: flex;
    gap: 5px;
    overflow: scroll;
`;

const StyledWaveform = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-width: ${WAVEFORM_MAX + 2}px;
`;

const StyledWaveformName = styled.div`
    font-size: 75%;
    overflow: hidden;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

interface WaveformWithPresetsProps {
    value: number[]
    setValue: (value: number[]) => void
}

export default function WaveformWithPresets(props: WaveformWithPresetsProps): React.JSX.Element {
    const { value, setValue } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;

    const mapVerticalToHorizontalScroll = (e: React.WheelEvent): void => {
        if (e.deltaY === 0) {
            return;
        }
        e.currentTarget.scrollTo({
            left: e.currentTarget.scrollLeft + e.deltaY
        });
    };

    return (
        <VContainer gap={15} grow={1}>
            <VContainer>
                <label>
                    {nls.localize('vuengine/editors/sound/presets', 'Presets')}
                </label>
                <StyledWaveformContainer
                    onWheel={mapVerticalToHorizontalScroll}
                >
                    {(WAVEFORM_PRESETS.map((w, i) =>
                        <StyledWaveform>
                            <NumberArrayPreview
                                key={i}
                                maximum={WAVEFORM_MAX}
                                data={w.values}
                                height={WAVEFORM_MAX}
                                width={WAVEFORM_MAX}
                                active={true}
                                onClick={() => setValue(w.values)}
                                onMouseEnter={event => {
                                    services.hoverService.requestHover({
                                        content: w.name,
                                        target: event.currentTarget,
                                        position: 'bottom',
                                    });
                                }}
                                onMouseLeave={event => {
                                    services.hoverService.cancelHover();
                                }}

                            />
                            <StyledWaveformName>
                                {w.name}
                            </StyledWaveformName>
                        </StyledWaveform>
                    ))}
                </StyledWaveformContainer>
            </VContainer>
            <WaveForm
                value={value}
                setValue={setValue}
            />
        </VContainer>
    );
}
