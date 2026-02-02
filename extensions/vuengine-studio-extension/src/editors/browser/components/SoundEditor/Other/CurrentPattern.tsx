import { Copy, Trash } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React, { Dispatch, SetStateAction, useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import AdvancedSelect from '../../Common/Base/AdvancedSelect';
import Input from '../../Common/Base/Input';
import Range from '../../Common/Base/Range';
import VContainer from '../../Common/Base/VContainer';
import { nanoid } from '../../Common/Utils';
import { InputWithAction, InputWithActionButton } from '../Instruments/Instruments';
import { getPatternName } from '../SoundEditor';
import {
    PATTERN_SIZE_MAX,
    PATTERN_SIZE_MIN,
    PatternConfig,
    SequenceMap,
    SoundData,
    SoundEditorTrackType,
    TRACK_TYPE_LABELS,
    TrackConfig
} from '../SoundEditorTypes';

interface CurrentPatternProps {
    soundData: SoundData
    updateSoundData: (soundData: SoundData) => void
    currentTrackId: number
    currentPatternId: string
    setCurrentPatternId: (trackId: number, patternId: string) => void
    setPattern: (patternId: string, pattern: Partial<PatternConfig>) => void
    setPatternSizes: (patterns: { [patternId: string]: number }) => void
    setPatternDialogOpen: Dispatch<SetStateAction<boolean>>
}

export default function CurrentPattern(props: CurrentPatternProps): React.JSX.Element {
    const {
        soundData, updateSoundData,
        currentTrackId,
        currentPatternId, setCurrentPatternId,
        setPattern, setPatternSizes,
        setPatternDialogOpen,
    } = props;
    const { enableCommands, focusEditor } = useContext(EditorsContext) as EditorsContextType;

    const pattern = soundData.patterns[currentPatternId];

    const setPatternName = (name: string): void => {
        setPattern(currentPatternId, { name });
    };

    const setPatternType = (type: SoundEditorTrackType): void => {
        setPattern(currentPatternId, { type });
    };

    const cloneCurrentPattern = () => {
        const newPatternId = nanoid();
        updateSoundData({
            ...soundData,
            patterns: {
                ...soundData.patterns,
                [newPatternId]: {
                    ...soundData.patterns[currentPatternId],
                    name: `${getPatternName(soundData, currentPatternId)} ${nls.localize('vuengine/general/copy', 'copy')}`,
                }
            },
        });
        setCurrentPatternId(currentTrackId, newPatternId);
    };

    const removeCurrentPattern = async () => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/editors/sound/deletePatternQuestion', 'Delete Pattern?'),
            msg: nls.localize('vuengine/editors/sound/areYouSureYouWantToDeletePattern', 'Are you sure you want to completely delete this pattern?'),
        });
        const remove = await dialog.open();
        if (remove) {
            const updatedPatterns = Object.fromEntries(
                Object.entries({ ...soundData.patterns })
                    .filter(([pId]) => pId !== currentPatternId)
            );

            const cleanedTracks: TrackConfig[] = [];
            soundData.tracks.forEach(t => {
                const cleanedSequence: SequenceMap = {};
                Object.keys(t.sequence).forEach(s => {
                    const step = parseInt(s);
                    if (t.sequence[step] !== currentPatternId) {
                        cleanedSequence[step] = t.sequence[step];
                    }
                });
                cleanedTracks.push({
                    ...t,
                    sequence: cleanedSequence,
                });
            });

            updateSoundData({
                ...soundData,
                patterns: updatedPatterns,
                tracks: cleanedTracks,
            });
            const firstPatternId = Object.keys(soundData.patterns)[0] ?? '';
            setCurrentPatternId(currentTrackId, firstPatternId);

            if (firstPatternId === '') {
                setPatternDialogOpen(false);
                enableCommands();
                focusEditor();
            }
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
                    />
                    <InputWithActionButton
                        className='theia-button secondary'
                        title={nls.localize('vuengine/editors/sound/clone', 'Clone')}
                        onClick={cloneCurrentPattern}
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
                />
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/editors/sound/type', 'Type')}
                </label>
                <AdvancedSelect
                    options={[{
                        value: SoundEditorTrackType.WAVE,
                        label: TRACK_TYPE_LABELS[SoundEditorTrackType.WAVE],
                    }, {
                        value: SoundEditorTrackType.SWEEPMOD,
                        label: TRACK_TYPE_LABELS[SoundEditorTrackType.SWEEPMOD],
                    }, {
                        value: SoundEditorTrackType.NOISE,
                        label: TRACK_TYPE_LABELS[SoundEditorTrackType.NOISE],
                    }]}
                    defaultValue={pattern.type}
                    onChange={options => setPatternType(options[0] as SoundEditorTrackType)}
                    containerStyle={{ flexGrow: 1 }}
                />
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/editors/sound/size', 'Size')}
                </label>
                <Range
                    value={pattern.size}
                    setValue={v => setPatternSizes({
                        [currentPatternId]: v as number,
                    })}
                    min={PATTERN_SIZE_MIN}
                    max={PATTERN_SIZE_MAX}
                />
            </VContainer>
        </VContainer>
        : <></>;
}
