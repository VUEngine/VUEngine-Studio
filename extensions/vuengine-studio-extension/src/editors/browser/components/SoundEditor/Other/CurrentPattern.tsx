import { Copy, Trash } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React from 'react';
import AdvancedSelect from '../../Common/Base/AdvancedSelect';
import Input from '../../Common/Base/Input';
import Range from '../../Common/Base/Range';
import VContainer from '../../Common/Base/VContainer';
import { getPatternName } from '../SoundEditor';
import { INPUT_BLOCKING_COMMANDS, MAX_PATTERN_SIZE, MIN_PATTERN_SIZE, PatternConfig, SoundData } from '../SoundEditorTypes';
import { InputWithAction, InputWithActionButton } from './Instruments';

interface CurrentPatternProps {
    soundData: SoundData
    currentTrackId: number
    currentPatternId: string
    setCurrentPatternId: (trackId: number, patternId: string) => void
    setPattern: (patternId: string, pattern: Partial<PatternConfig>) => void
    setPatternSize: (patternId: string, size: number) => void
}

export default function CurrentPattern(props: CurrentPatternProps): React.JSX.Element {
    const {
        soundData,
        currentTrackId,
        currentPatternId, setCurrentPatternId,
        setPattern, setPatternSize,
    } = props;

    const pattern = soundData.patterns[currentPatternId];

    const setPatternName = (name: string): void => {
        setPattern(currentPatternId, { name });
    };

    const clonePattern = () => {
        // TODO
        alert('not yet implemented');
    };

    const removeCurrentPattern = async () => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/editors/sound/deletePatternQuestion', 'Delete Pattern?'),
            msg: nls.localize('vuengine/editors/sound/areYouSureYouWantToDeletePattern', 'Are you sure you want to completely delete this pattern?'),
        });
        const remove = await dialog.open();
        if (remove) {
            // TODO
            alert('not yet implemented');
        }
    };

    return pattern
        ? <VContainer gap={15} style={{ userSelect: 'none' }}>
            <VContainer>
                <label>
                    {nls.localize('vuengine/editors/sound/currentPattern', 'Current Pattern')}
                </label>
                <InputWithAction>
                    <AdvancedSelect
                        options={Object.keys(soundData.patterns).map((patternId, i) => ({
                            label: getPatternName(soundData, patternId),
                            value: patternId,
                        }))}
                        defaultValue={currentPatternId.toString()}
                        onChange={options => setCurrentPatternId(currentTrackId, options[0])}
                        commands={INPUT_BLOCKING_COMMANDS}
                    />
                    <InputWithActionButton
                        className='theia-button secondary'
                        title={nls.localize('vuengine/editors/sound/clone', 'Clone')}
                        onClick={clonePattern}
                        disabled={!pattern}
                    >
                        <Copy size={16} />
                    </InputWithActionButton>
                    <InputWithActionButton
                        className='theia-button secondary'
                        title={nls.localizeByDefault('Remove')}
                        onClick={removeCurrentPattern}
                        disabled={!pattern}
                    >
                        <Trash size={16} />
                    </InputWithActionButton>
                </InputWithAction>
            </VContainer>
            <VContainer>
                <label>
                    {nls.localizeByDefault('Name')}
                </label>
                <Input
                    value={pattern.name ?? ''}
                    setValue={setPatternName}
                    commands={INPUT_BLOCKING_COMMANDS}
                />
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/editors/sound/size', 'Size')}
                </label>
                <Range
                    value={pattern.size}
                    setValue={v => setPatternSize(currentPatternId, v as number)}
                    min={MIN_PATTERN_SIZE}
                    max={MAX_PATTERN_SIZE}
                    commandsToDisable={INPUT_BLOCKING_COMMANDS}
                />
            </VContainer>
        </VContainer>
        : <></>;
}
