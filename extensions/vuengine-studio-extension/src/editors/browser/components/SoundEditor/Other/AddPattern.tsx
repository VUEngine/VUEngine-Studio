import { nls } from '@theia/core';
import React, { Dispatch, Fragment, SetStateAction, useContext } from 'react';
import styled from 'styled-components';
import { SoundType } from '../../../../../project/browser/types/Sound';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import Input from '../../Common/Base/Input';
import VContainer from '../../Common/Base/VContainer';
import { nanoid } from '../../Common/Utils';
import PatternCanvas from '../Sequencer/PatternCanvas';
import { getPatternName } from '../SoundEditor';
import { DEFAULT_PATTERN_SIZE, NEW_PATTERN_ID, SoundData, SoundEditorTrackType, TRACK_TYPE_INSTRUMENT_COMPATIBILITY, TRACK_TYPE_LABELS, TrackConfig } from '../SoundEditorTypes';

const StyledPattern = styled.button`
    background-color: var(--theia-secondaryButton-background);
    border: none;
    border-radius: 2px;
    box-sizing: border-box;
    color: var(--theia-foreground-color);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    font-size: 80%;
    gap: 5px;
    min-height: 70px !important;
    overflow: hidden;
    padding: var(--theia-ui-padding) !important;
    width: 200px;

    &:focus,
    &:hover {
        outline: 1px solid var(--theia-button-background);
        outline-offset: 1px;
    }

    i {
        font-size: 120% !important;
        vertical-align: bottom;
    }

    div {      
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    canvas {
        border: 1px solid rgba(255, 255, 255, .2);
        box-sizing: border-box;
    }
`;

const StyledNewPattern = styled(StyledPattern)`
    background-color: transparent;
    border: 1px solid var(--theia-secondaryButton-background);

    i[class*='codicon-plus'] {
        color: var(--theia-secondaryButton-background);
        font-size: 180% !important;
    }
`;

interface AddPatternProps {
    soundData: SoundData
    updateSoundData: (soundData: SoundData) => void
    sequenceIndex: number
    trackId: number
    sequencerPatternHeight: number
    sequencerPatternWidth: number
    size?: number
    setTrack: (trackId: number, track: Partial<TrackConfig>) => void
    setCurrentPatternId: (trackId: number, patternId: string) => void
    setCurrentSequenceIndex: (trackId: number, sequenceIndex: number) => void
    selectedPatterns: string[]
    setSelectedPatterns: (sn: string[]) => void
    setAddPatternDialogOpen: Dispatch<SetStateAction<{ trackId: number, sequenceIndex: number, size?: number }>>
}

export default function AddPattern(props: AddPatternProps): React.JSX.Element {
    const {
        soundData, updateSoundData,
        sequencerPatternHeight, sequencerPatternWidth,
        sequenceIndex,
        trackId,
        size,
        setTrack,
        setCurrentPatternId, setCurrentSequenceIndex,
        selectedPatterns, setSelectedPatterns,
        setAddPatternDialogOpen,
    } = props;
    const { services, disableCommands, enableCommands, activateEditor } = useContext(EditorsContext) as EditorsContextType;
    const [filter, setFilter] = React.useState<string>('');

    const addPatternToSequence = async (patternId: string): Promise<void> => {
        const patternSize = size !== undefined && size > 1 ? size : DEFAULT_PATTERN_SIZE;
        const track = soundData.tracks[trackId];
        // create if it's a new pattern
        if (patternId === NEW_PATTERN_ID) {
            patternId = nanoid();
            const schema = await window.electronVesCore.dereferenceJsonSchema(SoundType.schema);
            const newPattern = services.vesProjectService.generateDataFromJsonSchema(schema?.properties?.patterns?.additionalProperties);

            const updatedTracks = [...soundData.tracks];
            updatedTracks[trackId].sequence = {
                ...track.sequence,
                [sequenceIndex.toString()]: patternId,
            };

            const newNameLabel = nls.localizeByDefault('New');
            let newNameNumber = 1;
            const p = Object.values(soundData.patterns);
            while (p.filter(i => i.name === `${newNameLabel} ${newNameNumber}`).length) {
                newNameNumber++;
            }

            updateSoundData({
                ...soundData,
                tracks: updatedTracks,
                patterns: {
                    ...soundData.patterns,
                    [patternId]: {
                        ...newPattern,
                        name: `${newNameLabel} ${newNameNumber}`,
                        type: track.type,
                        size: patternSize,
                    }
                }
            });
        } else {
            setTrack(trackId, {
                ...track,
                sequence: {
                    ...track.sequence,
                    [sequenceIndex.toString()]: patternId,
                },
            });
        }

        setAddPatternDialogOpen({ trackId: -1, sequenceIndex: -1 });
        setCurrentSequenceIndex(trackId, sequenceIndex);
        setCurrentPatternId(trackId, patternId);
        setSelectedPatterns([...selectedPatterns, `${trackId}-${sequenceIndex}`]);
        activateEditor();
    };

    const trackType = soundData.tracks[trackId].type;

    const patterns = [...Object.keys(soundData.patterns)
        .filter(patternId =>
            soundData.tracks[trackId] !== undefined &&
            TRACK_TYPE_INSTRUMENT_COMPATIBILITY[trackType].includes(soundData.patterns[patternId].type) &&
            (size === undefined || size <= 1 || soundData.patterns[patternId].size === size) &&
            (filter === '' || soundData.patterns[patternId].name.toLowerCase().includes(filter.toLowerCase()))
        )
        .map((patternId, i) => ({
            id: patternId,
            type: soundData.patterns[patternId].type,
            size: soundData.patterns[patternId].size,
            label: getPatternName(soundData, patternId),
        }))
        .sort((a, b) => a.label.localeCompare(b.label))];

    const patternMap = {
        [SoundEditorTrackType.WAVE]: patterns.filter(p => p.type === SoundEditorTrackType.WAVE),
        [SoundEditorTrackType.SWEEPMOD]: patterns.filter(p => p.type === SoundEditorTrackType.SWEEPMOD),
        [SoundEditorTrackType.NOISE]: patterns.filter(p => p.type === SoundEditorTrackType.NOISE),
    };

    const onEnter = (e: React.KeyboardEvent, fn: () => void): void => {
        if (e.key === 'Enter') {
            fn();
        }
    };

    return <VContainer gap={20} grow={1} overflow='auto' style={{ padding: 2 }}>
        <VContainer>
            {nls.localize('vuengine/editors/sound/trackType', 'Track Type')}: {TRACK_TYPE_LABELS[trackType]}
            {size !== undefined && size > 1 &&
                <>
                    , {nls.localize('vuengine/editors/sound/requestedSize', 'Requested Size')}: {size}
                </>
            }
        </VContainer>
        <Input
            value={filter}
            setValue={v => setFilter(v as string)}
            autoFocus
            placeholder={nls.localize('vuengine/editors/sound/filterList', 'Filter List...')}
        />
        <StyledNewPattern
            onClick={() => addPatternToSequence(NEW_PATTERN_ID)}
            onKeyDown={e => onEnter(e, () => addPatternToSequence(NEW_PATTERN_ID))}
            tabIndex={0}
            autoFocus
            onFocus={disableCommands}
            onBlur={enableCommands}
        >
            <VContainer justifyContent='center' grow={1}>
                <i className='codicon codicon-plus' />
            </VContainer>
            <HContainer justifyContent='space-between'>
                <div>
                    {nls.localize('vuengine/editors/sound/newPattern', 'New Pattern')}
                </div>
                <div>
                    <i className='codicon codicon-arrow-both' />
                    {
                        size !== undefined && size > 1
                            ? size
                            : DEFAULT_PATTERN_SIZE
                    }
                </div>
            </HContainer>
        </StyledNewPattern>

        {
            Object.values(SoundEditorTrackType).map(t => (
                <Fragment key={t}>
                    {
                        patternMap[t].length > 0 &&
                        <VContainer>
                            <label>{TRACK_TYPE_LABELS[t]}</label>
                            <HContainer gap={10} wrap='wrap'>
                                {patternMap[t].map(p =>
                                    <StyledPattern
                                        key={p.id}
                                        onClick={() => addPatternToSequence(p.id)}
                                        onKeyDown={e => onEnter(e, () => addPatternToSequence(p.id))}
                                        onFocus={disableCommands}
                                        onBlur={enableCommands}
                                    >
                                        <VContainer grow={1}>
                                            <PatternCanvas
                                                soundData={soundData}
                                                pattern={soundData.patterns[p.id]}
                                                trackId={trackId}
                                                sequencerPatternHeight={sequencerPatternHeight}
                                                sequencerPatternWidth={sequencerPatternWidth}
                                            />
                                        </VContainer>
                                        <HContainer justifyContent='space-between'>
                                            <div>
                                                {p.label}
                                            </div>
                                            <div>
                                                <i className='codicon codicon-arrow-both' />
                                                {p.size}
                                            </div>
                                        </HContainer>
                                    </StyledPattern>
                                )}
                            </HContainer>
                        </VContainer>
                    }
                </Fragment>
            ))
        }
    </VContainer >;
}
