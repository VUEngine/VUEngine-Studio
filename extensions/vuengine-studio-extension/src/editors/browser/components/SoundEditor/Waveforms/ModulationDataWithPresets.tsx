import { ArrowBendRightDown, Clipboard } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import React, { useContext } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';
import NumberArrayPreview from '../../Common/NumberArrayPreview';
import { ModulationData } from '../Emulator/VsuTypes';
import { MODULATION_DATA_MAX, MODULATION_DATA_MIN } from '../SoundEditorTypes';
import ModulationDataEditor from './ModulationData';
import { MODULATION_DATA_PRESETS } from './ModulationDataPresets';

const StyledModulationDataContainer = styled.div`
    display: flex;
    gap: 5px;
    overflow: auto;
`;

const StyledModulationData = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-width: ${MODULATION_DATA_MAX + 2}px;
`;

const StyledModulationDataName = styled.div`
    font-size: 75%;
    overflow: hidden;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

interface ModulationDataWithPresetsProps {
    value: ModulationData
    setValue: (value: ModulationData) => void
}

export default function ModulationDataWithPresets(props: ModulationDataWithPresetsProps): React.JSX.Element {
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
            'vuengine/editors/sound/modulationDataCopiedToClipboard',
            'Modulation data has been copied to the clipboard.'
        ));
    };

    const applyFromClipboard = async () => {
        const clipboardValue = await services.clipboardService.readText();
        const importedModulationData: ModulationData = [];
        let valid = false;

        try {
            if (clipboardValue.length === 64) {
                for (let i = 0; i < 64; i += 2) {
                    const v = parseInt(clipboardValue.substring(i, i + 2), 16);
                    if (v >= MODULATION_DATA_MIN && v <= MODULATION_DATA_MAX) {
                        importedModulationData.push(v);
                    }
                }
                if (importedModulationData.length === 32) {
                    valid = true;
                }
            }
        } catch (e) { }

        if (valid) {
            setValue(importedModulationData as ModulationData);
            services.messageService.info(nls.localize(
                'vuengine/editors/sound/modulationDataImported',
                'Modulation data has been successfully imported.'
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
                    <StyledModulationDataContainer
                        onWheel={mapVerticalToHorizontalScroll}
                    >
                        {(MODULATION_DATA_PRESETS.map((w, i) =>
                            <StyledModulationData key={i}>
                                <NumberArrayPreview
                                    maximum={MODULATION_DATA_MAX}
                                    data={w.values}
                                    height={MODULATION_DATA_MAX / 4}
                                    width={MODULATION_DATA_MAX / 4}
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
                                <StyledModulationDataName>
                                    {w.name}
                                </StyledModulationDataName>
                            </StyledModulationData>
                        ))}
                    </StyledModulationDataContainer>
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
            <ModulationDataEditor
                value={value}
                setValue={setValue}
            />
        </VContainer>
    );
}
