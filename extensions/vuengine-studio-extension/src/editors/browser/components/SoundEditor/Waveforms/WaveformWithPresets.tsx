import { ArrowBendRightDown, Clipboard } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import React, { useContext } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';
import NumberArrayPreview from '../../Common/NumberArrayPreview';
import { WaveformData } from '../Emulator/VsuTypes';
import { WAVEFORM_MAX, WAVEFORM_MIN } from '../SoundEditorTypes';
import WaveForm from './WaveForm';
import { WAVEFORM_PRESETS } from './WaveFormPresets';

const StyledWaveformContainer = styled.div`
    display: flex;
    gap: 5px;
    overflow: auto;
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
    value: WaveformData
    setValue: (value: WaveformData) => void
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

    const copyToClipboard = async () => {
        let encodedValue = '';
        value.forEach(v => encodedValue += v.toString(16).padStart(2, '0'));
        await services.clipboardService.writeText(encodedValue);
        services.messageService.info(nls.localize(
            'vuengine/editors/sound/waveformDataCopiedToClipboard',
            'Waveform data has been copied to the clipboard.'
        ));
    };

    const applyFromClipboard = async () => {
        const clipboardValue = await services.clipboardService.readText();
        const importedWaveformData: WaveformData = [];
        let valid = false;

        try {
            if (clipboardValue.length === 64) {
                for (let i = 0; i < 64; i += 2) {
                    const v = parseInt(clipboardValue.substring(i, i + 2), 16);
                    if (v >= WAVEFORM_MIN && v <= WAVEFORM_MAX) {
                        importedWaveformData.push(v);
                    }
                }
                if (importedWaveformData.length === 32) {
                    valid = true;
                }
            }
        } catch (e) { }

        if (valid) {
            setValue(importedWaveformData as WaveformData);
            services.messageService.info(nls.localize(
                'vuengine/editors/sound/waveformDataImported',
                'Waveform data has been successfully imported.'
            ));
        } else {
            services.messageService.error(nls.localize(
                'vuengine/editors/general/invalidData',
                'Data is invalid: {0}',
                clipboardValue
            ));
        }
    };

    return (
        <VContainer gap={15} grow={1}>
            <HContainer gap={20} alignItems='end' justifyContent='end'>
                <VContainer grow={1} overflow='hidden'>
                    <label>
                        {nls.localize('vuengine/editors/sound/presets', 'Presets')}
                    </label>
                    <StyledWaveformContainer
                        onWheel={mapVerticalToHorizontalScroll}
                    >
                        {(WAVEFORM_PRESETS.map((w, i) =>
                            <StyledWaveform key={i}>
                                <NumberArrayPreview
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
                <VContainer>
                    <button
                        className='theia-button secondary'
                        onClick={copyToClipboard}
                        title={nls.localize('vuengine/editors/general/copyToClipboard', 'Copy To Clipboard')}
                    >
                        <Clipboard size={16} />
                    </button>
                    <button
                        className='theia-button secondary'
                        onClick={applyFromClipboard}
                        title={nls.localize('vuengine/editors/general/pasteFromClipboard', 'Paste From Clipboard')}
                    >
                        <ArrowBendRightDown size={16} />
                    </button>
                </VContainer>
            </HContainer>
            <WaveForm
                value={value}
                setValue={setValue}
            />
        </VContainer>
    );
}
