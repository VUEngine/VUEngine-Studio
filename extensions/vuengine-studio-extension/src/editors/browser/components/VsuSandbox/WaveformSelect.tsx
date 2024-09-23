import React from 'react';
import styled from 'styled-components';
import HContainer from '../Common/HContainer';
import NumberArrayPreview from '../Common/NumberArrayPreview';
import { VSU_NUMBER_OF_WAVEFORM_BANKS } from '../VsuEmulator/VsuEmulatorTypes';

const WaveFormSelection = styled(HContainer)`
    outline: none !important;

    &:focus > div.active {
        border-color: var(--theia-button-background) !important;
    }
`;

interface WaveformSelectProps {
    value: number
    setValue: (value: number) => void
    waveforms: number[][]
}

export default function WaveformSelect(props: WaveformSelectProps): React.JSX.Element {
    const { value, setValue, waveforms } = props;

    const handleWaveFormKeyPress = (e: React.KeyboardEvent): void => {
        if (e.key === 'ArrowLeft') {
            if (value === 0) {
                setValue(VSU_NUMBER_OF_WAVEFORM_BANKS - 1);
            } else {
                setValue(value - 1);
            }
        } else if (e.key === 'ArrowRight') {
            if (value === VSU_NUMBER_OF_WAVEFORM_BANKS - 1) {
                setValue(0);
            } else {
                setValue(value + 1);
            }
        }
    };

    return (
        <WaveFormSelection onKeyDown={handleWaveFormKeyPress} tabIndex={0}>
            {([...Array(VSU_NUMBER_OF_WAVEFORM_BANKS)].map((v, x) =>
                <NumberArrayPreview
                    key={x}
                    maximum={64}
                    active={x === value}
                    data={waveforms[x]}
                    onClick={() => setValue(x)}
                />
            ))}
        </WaveFormSelection>
    );
}
