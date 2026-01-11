import { FadersHorizontal, Guitar, Magnet, Minus, Plus, Wrench } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction, useContext } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import AdvancedSelect from '../Common/Base/AdvancedSelect';
import Input from '../Common/Base/Input';
import VContainer from '../Common/Base/VContainer';
import { COLOR_PALETTE, DEFAULT_COLOR_INDEX } from '../Common/PaletteColorSelect';
import Emulator from './Emulator/Emulator';
import PlayerRomBuilder from './Emulator/PlayerRomBuilder';
import { InputWithAction, InputWithActionButton } from './Instruments/Instruments';
import { getInstrumentName, SetNoteEventProps } from './SoundEditor';
import { SoundEditorCommands } from './SoundEditorCommands';
import {
    BAR_NOTE_RESOLUTION,
    MAX_SEQUENCE_SIZE,
    MIN_SEQUENCE_SIZE,
    PIANO_ROLL_KEY_WIDTH,
    SequenceMap,
    SEQUENCER_RESOLUTION,
    SoundData,
    SoundEvent,
    SUB_NOTE_RESOLUTION,
    TRACK_DEFAULT_INSTRUMENT_ID,
    TrackConfig,
    TrackSettings,
} from './SoundEditorTypes';

export const StyledSoundEditorToolbar = styled.div`
    align-items: center;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 20px;
    justify-content: space-between;
    margin: var(--padding);
    row-gap: 10px;
`;

export const StyledSoundEditorToolbarSide = styled.div`
    align-items: center;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 20px;
    row-gap: 10px;
`;

export const StyledSoundEditorToolbarGroup = styled.div`
    align-items: center;
    display: flex;
    flex-direction: row;
    gap: 3px;
`;

export const StyledSoundEditorToolbarButton = styled.button`
    align-items: center;
    display: flex;
    justify-content: center;
    outline: 0px solid var(--theia-focusBorder);
    outline-offset: 1px;
    padding: 0;
    width: 32px;
`;

export const StyledSoundEditorToolbarWideButton = styled(StyledSoundEditorToolbarButton)`
    width: ${PIANO_ROLL_KEY_WIDTH + 1}px;
`;

export const StyledSoundEditorToolbarSizeButton = styled(StyledSoundEditorToolbarButton)`
    font-size: 11px;
    letter-spacing: -1px;
    font-size: 9px;
    max-height: 12px !important;
    min-height: 12px !important;
    min-width: 26px !important;
    width: 26px;
`;

export const StyledSoundEditorToolbarTime = styled.div`
    align-items: center;
    border: 1px solid var(--theia-secondaryButton-background);
    border-radius: 2px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    font-family: monospace;
    font-size: 10px;
    height: 26px;
    justify-content: center;
    line-height: 100%;
    padding-top: 1px;
    user-select: none;
    width: 48px;
`;

export const StyledSoundEditorToolbarVisualization = styled(StyledSoundEditorToolbarTime)`
    background-color: black;
    width: 56px;
`;

export const SidebarCollapseButton = styled.button`
    align-items: center;
    display: flex;
    font-size: 8px;
    height: 100%;
    justify-content: center;
    min-width: unset !important;
    outline-width: 0 !important;
    padding: 0 !important;
    width: 16px;
`;

interface SoundEditorToolbarProps {
    soundData: SoundData
    updateSoundData: (soundData: SoundData) => void
    currentTrackId: number
    currentPatternId: string
    currentPlayerPosition: number
    setCurrentPlayerPosition: Dispatch<SetStateAction<number>>
    currentSequenceIndex: number
    selectedNotes: number[]
    playing: boolean
    noteSnapping: boolean
    newNoteDuration: number
    setNewNoteDuration: Dispatch<SetStateAction<number>>
    emulatorInitialized: boolean
    setEmulatorInitialized: Dispatch<SetStateAction<boolean>>
    emulatorRomReady: boolean
    setEmulatorRomReady: Dispatch<SetStateAction<boolean>>
    testNote: string
    testInstrumentId: string
    playRangeStart: number
    playRangeEnd: number
    trackSettings: TrackSettings[]
    playerRomBuilder: PlayerRomBuilder
    currentInstrumentId: string
    setCurrentInstrumentId: Dispatch<SetStateAction<string>>
    toolsDialogOpen: boolean
    setToolsDialogOpen: Dispatch<SetStateAction<boolean>>
    propertiesDialogOpen: boolean
    setPropertiesDialogOpen: Dispatch<SetStateAction<boolean>>
    setNoteEvent: (notes: SetNoteEventProps[]) => void
    setTrack: (trackId: number, track: Partial<TrackConfig>) => void
    forcePlayerRomRebuild: number
}

export default function SoundEditorToolbar(props: SoundEditorToolbarProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const {
        soundData,
        updateSoundData,
        currentTrackId,
        currentPatternId,
        currentPlayerPosition, setCurrentPlayerPosition,
        currentSequenceIndex,
        selectedNotes,
        playing,
        noteSnapping,
        newNoteDuration, setNewNoteDuration,
        emulatorInitialized, setEmulatorInitialized,
        emulatorRomReady, setEmulatorRomReady,
        testNote, testInstrumentId,
        playRangeStart, playRangeEnd,
        trackSettings,
        playerRomBuilder,
        currentInstrumentId, setCurrentInstrumentId,
        toolsDialogOpen, setToolsDialogOpen,
        propertiesDialogOpen, setPropertiesDialogOpen,
        setNoteEvent,
        setTrack,
        forcePlayerRomRebuild,
    } = props;
    const isPlayingRegular = playing && !testNote;

    const currentTrack = soundData.tracks[currentTrackId];
    const instrument = soundData.instruments[currentInstrumentId];

    const totalTicks = soundData.size / SEQUENCER_RESOLUTION * BAR_NOTE_RESOLUTION;
    const tickDurationUs = soundData.speed * 1000 / SUB_NOTE_RESOLUTION;
    const totalLengthSecs = totalTicks * tickDurationUs / 1000 / 1000;

    const getTestSoundData = (): SoundData => ({
        ...soundData,
        loop: testInstrumentId !== '',
        size: 64,
        instruments: {
            'testInstrument': soundData.instruments[testInstrumentId !== '' ? testInstrumentId : soundData.tracks[currentTrackId].instrument]
        },
        patterns: {
            'testPattern': {
                events: {
                    0: {
                        note: testNote,
                        duration: 64 * SUB_NOTE_RESOLUTION * SEQUENCER_RESOLUTION
                    }
                },
                name: 'testPattern',
                size: 64,
                type: testInstrumentId !== ''
                    ? soundData.instruments[testInstrumentId].type
                    : soundData.tracks[currentTrackId].type,
            }
        },
        tracks: [{
            ...soundData.tracks[currentTrackId],
            instrument: 'testInstrument',
            type: testInstrumentId !== ''
                ? soundData.instruments[testInstrumentId].type
                : soundData.tracks[currentTrackId].type,
            sequence: {
                0: 'testPattern',
            }
        }]
    });

    const setSize = (size: number): void => {
        if (size > MAX_SEQUENCE_SIZE || size < MIN_SEQUENCE_SIZE) {
            return;
        }

        updateSoundData({
            ...soundData,
            tracks: [
                ...soundData.tracks.map(t => {
                    const updatedSequence: SequenceMap = {};
                    Object.keys(t.sequence).map(k => {
                        const step = parseInt(k);
                        const patternId = t.sequence[step];
                        const pattern = soundData.patterns[patternId];
                        if (!pattern) {
                            return;
                        }
                        const patternSize = pattern.size / SEQUENCER_RESOLUTION;
                        if (step + patternSize <= size) {
                            updatedSequence[step] = patternId;
                        }
                    });
                    return {
                        ...t,
                        sequence: updatedSequence
                    };
                })
            ],
            size,
        });
    };

    const increaseSize = (amount: number) =>
        setSize(Math.min(MAX_SEQUENCE_SIZE, soundData.size + amount));

    const decreaseSize = (amount: number) =>
        setSize(Math.max(MIN_SEQUENCE_SIZE, soundData.size - amount));

    return <StyledSoundEditorToolbar>
        <StyledSoundEditorToolbarSide>
            {soundData.tracks.length > 0 && <>
                <StyledSoundEditorToolbarGroup>
                    <StyledSoundEditorToolbarWideButton
                        className={`theia-button ${isPlayingRegular ? 'primary' : 'secondary'}`}
                        title={(isPlayingRegular
                            ? nls.localize('vuengine/editors/sound/pause', 'Pause')
                            : nls.localize('vuengine/editors/sound/play', 'Play')) +
                            services.vesCommonService.getKeybindingLabel(SoundEditorCommands.PLAY_PAUSE.id, true)
                        }
                        onClick={() => services.commandService.executeCommand(SoundEditorCommands.PLAY_PAUSE.id)}
                        style={{ outlineWidth: isPlayingRegular ? 1 : 0 }}
                        disabled={!emulatorInitialized}
                    >
                        <i className={`fa fa-${isPlayingRegular ? 'pause' : 'play'}`} />
                    </StyledSoundEditorToolbarWideButton>
                    <StyledSoundEditorToolbarButton
                        className='theia-button secondary'
                        title={(nls.localize('vuengine/editors/sound/stop', 'Stop')) +
                            services.vesCommonService.getKeybindingLabel(SoundEditorCommands.STOP.id, true)
                        }
                        onClick={() => services.commandService.executeCommand(SoundEditorCommands.STOP.id)}
                        disabled={!emulatorInitialized || currentPlayerPosition === -1}
                    >
                        <i className="fa fa-stop" />
                    </StyledSoundEditorToolbarButton>
                    <StyledSoundEditorToolbarTime>
                        {currentPlayerPosition + 1}
                    </StyledSoundEditorToolbarTime>
                    <StyledSoundEditorToolbarTime>
                        <span>
                            {currentPlayerPosition > -1
                                ? Math.floor(currentPlayerPosition * soundData.speed / 1000 / 60) + ':' +
                                Math.floor((currentPlayerPosition * soundData.speed / 1000) % 60).toString().padStart(2, '0') + ',' +
                                Math.floor((currentPlayerPosition * soundData.speed / 100) % 10)
                                : '0:00,0'
                            }
                        </span>
                        <span>
                            {
                                Math.floor(totalLengthSecs / 60) + ':' +
                                Math.floor(totalLengthSecs % 60).toString().padStart(2, '0') + ',' +
                                Math.floor((totalLengthSecs * 10) % 10)
                            }
                        </span>
                    </StyledSoundEditorToolbarTime>
                    <StyledSoundEditorToolbarVisualization>
                        <Emulator
                            playing={playing}
                            testNote={testNote}
                            setEmulatorInitialized={setEmulatorInitialized}
                            emulatorRomReady={emulatorRomReady}
                            setEmulatorRomReady={setEmulatorRomReady}
                            playerRomBuilder={playerRomBuilder}
                            currentPlayerPosition={currentPlayerPosition}
                            setCurrentPlayerPosition={setCurrentPlayerPosition}
                            soundData={testNote ? getTestSoundData() : soundData}
                            playRangeStart={playRangeStart}
                            playRangeEnd={playRangeEnd}
                            trackSettings={trackSettings}
                            forcePlayerRomRebuild={forcePlayerRomRebuild}
                        />
                    </StyledSoundEditorToolbarVisualization>
                </StyledSoundEditorToolbarGroup>
                { /* }
                <StyledSoundEditorToolbarGroup>
                    <StyledSoundEditorToolbarButton
                        className={`theia-button ${ recording ? 'primary' : 'secondary'} recordButton`}
                        title='Recording Mode'
                        disabled={true}
                        onClick={() => setRecording(true)}
                    >
                        <i className='fa fa-circle' />
                    </StyledSoundEditorToolbarButton>
                </StyledSoundEditorToolbarGroup>
                { */}
                <StyledSoundEditorToolbarGroup>
                    <StyledSoundEditorToolbarButton
                        className={`theia-button ${noteSnapping ? 'primary' : 'secondary'}`}
                        title={`${SoundEditorCommands.TOGGLE_NOTE_SNAPPING.label}${services.vesCommonService.getKeybindingLabel(
                            SoundEditorCommands.TOGGLE_NOTE_SNAPPING.id,
                            true
                        )}`}
                        onClick={() => services.commandService.executeCommand(SoundEditorCommands.TOGGLE_NOTE_SNAPPING.id)}
                    >
                        <Magnet size={17} />
                    </StyledSoundEditorToolbarButton>
                    <AdvancedSelect
                        title={nls.localize('vuengine/editors/sound/defaultNoteLength', 'Default Note Length')}
                        defaultValue={newNoteDuration.toString()}
                        onChange={options => setNewNoteDuration(parseInt(options[0]))}
                        options={[{
                            label: '1',
                            value: `${16 * SUB_NOTE_RESOLUTION}`
                        }, {
                            label: '1/2',
                            value: `${8 * SUB_NOTE_RESOLUTION}`
                        }, {
                            label: '1/4',
                            value: `${4 * SUB_NOTE_RESOLUTION}`
                        }, {
                            label: '1/8',
                            value: `${2 * SUB_NOTE_RESOLUTION}`
                        }, {
                            label: '1/16',
                            value: `${1 * SUB_NOTE_RESOLUTION}`
                        }]}
                        width={56}
                    />
                </StyledSoundEditorToolbarGroup>
                <StyledSoundEditorToolbarGroup>
                    <InputWithAction>
                        <AdvancedSelect
                            options={[
                                {
                                    value: TRACK_DEFAULT_INSTRUMENT_ID,
                                    label: nls.localize('vuengine/editors/sound/trackDefaultInstrument', 'Track Default Instrument'),
                                },
                                ...Object.keys(soundData.instruments)
                                    .filter(instrumentId => {
                                        const instr = soundData.instruments[instrumentId];
                                        return instr.type === currentTrack.type;
                                    })
                                    .sort((a, b) => (soundData.instruments[a].name.length ? soundData.instruments[a].name : 'zzz').localeCompare(
                                        (soundData.instruments[b].name.length ? soundData.instruments[b].name : 'zzz')
                                    ))
                                    .map((instrumentId, i) => {
                                        const instr = soundData.instruments[instrumentId];
                                        return {
                                            value: `${instrumentId}`,
                                            label: getInstrumentName(soundData, instrumentId),
                                            backgroundColor: COLOR_PALETTE[instr.color ?? DEFAULT_COLOR_INDEX],
                                        };
                                    })
                            ]}
                            defaultValue={currentInstrumentId}
                            onChange={v => {
                                const instrumentId = v[0] as string;
                                setCurrentInstrumentId(instrumentId);

                                const currentPattern = soundData.patterns[currentPatternId];
                                if (currentPattern === undefined) {
                                    return;
                                }

                                const setNoteEventProps: SetNoteEventProps[] = [];
                                selectedNotes.forEach(n => {
                                    const localStep = n - currentSequenceIndex * BAR_NOTE_RESOLUTION / SEQUENCER_RESOLUTION;
                                    if (currentPattern.events[localStep] && currentPattern.events[localStep][SoundEvent.Note]) {
                                        setNoteEventProps.push({
                                            step: localStep,
                                            event: SoundEvent.Instrument,
                                            value: instrumentId !== TRACK_DEFAULT_INSTRUMENT_ID ? instrumentId : undefined
                                        });
                                    }
                                });

                                if (setNoteEventProps.length) {
                                    setNoteEvent(setNoteEventProps);
                                }
                            }}
                            backgroundColor={instrument ? COLOR_PALETTE[instrument.color] : undefined}
                            width={180}
                        />
                        <InputWithActionButton
                            className='theia-button secondary'
                            title={
                                nls.localize('vuengine/editors/sound/editInstrument', 'Edit Instrument') +
                                services.vesCommonService.getKeybindingLabel(SoundEditorCommands.OPEN_INSTRUMENT_EDITOR.id, true)
                            }
                            onClick={() => services.commandService.executeCommand(SoundEditorCommands.OPEN_INSTRUMENT_EDITOR.id)}
                        >
                            <i className='codicon codicon-settings-gear' />
                        </InputWithActionButton>
                        <InputWithActionButton
                            className='theia-button secondary'
                            title={nls.localize('vuengine/editors/sound/setAsTrackDefaultInstrument', 'Set As Default Instrument For Current Track')}
                            disabled={currentTrack?.instrument === currentInstrumentId || currentInstrumentId === TRACK_DEFAULT_INSTRUMENT_ID}
                            onClick={() => setTrack(currentTrackId, { instrument: currentInstrumentId })}
                        >
                            <Guitar size={17} />
                        </InputWithActionButton>
                    </InputWithAction>
                </StyledSoundEditorToolbarGroup>
                <StyledSoundEditorToolbarGroup>
                    <VContainer gap={2}>
                        <StyledSoundEditorToolbarSizeButton
                            className="theia-button secondary"
                            onClick={() => decreaseSize(1)}
                            title={nls.localize('vuengine/editors/sound/decreaseLength', 'Decrease Length')}
                        >
                            <Minus size={10} />1
                        </StyledSoundEditorToolbarSizeButton>
                        <StyledSoundEditorToolbarSizeButton
                            className="theia-button secondary"
                            onClick={() => decreaseSize(4)}
                            title={nls.localize('vuengine/editors/sound/decreaseLength', 'Decrease Length')}
                        >
                            <Minus size={10} />4
                        </StyledSoundEditorToolbarSizeButton>
                    </VContainer>
                    <Input
                        type="number"
                        value={soundData.size}
                        setValue={setSize}
                        min={MIN_SEQUENCE_SIZE}
                        max={MAX_SEQUENCE_SIZE}
                        title={nls.localize('vuengine/editors/sound/Length', 'Length')}
                        width={48}
                    />
                    <VContainer gap={2}>
                        <StyledSoundEditorToolbarSizeButton
                            className="theia-button secondary"
                            onClick={() => increaseSize(1)}
                            title={nls.localize('vuengine/editors/sound/increaseLength', 'Increase Length')}
                        >
                            <Plus size={10} />1
                        </StyledSoundEditorToolbarSizeButton>
                        <StyledSoundEditorToolbarSizeButton
                            className="theia-button secondary"
                            onClick={() => increaseSize(4)}
                            title={nls.localize('vuengine/editors/sound/increaseLength', 'Increase Length')}
                        >
                            <Plus size={10} />4
                        </StyledSoundEditorToolbarSizeButton>
                    </VContainer>
                </StyledSoundEditorToolbarGroup>
            </>}
            <StyledSoundEditorToolbarGroup>
                <StyledSoundEditorToolbarButton
                    className={`theia-button ${propertiesDialogOpen ? 'primary' : 'secondary'}`}
                    title={nls.localize('vuengine/editors/sound/properties', 'Properties')}
                    onClick={() => setPropertiesDialogOpen(prev => !prev)}
                >
                    <FadersHorizontal size={17} />
                </StyledSoundEditorToolbarButton>
                <StyledSoundEditorToolbarButton
                    className={`theia-button ${toolsDialogOpen ? 'primary' : 'secondary'}`}
                    title={nls.localize('vuengine/editors/sound/tools', 'Tools')}
                    onClick={() => setToolsDialogOpen(prev => !prev)}
                >
                    <Wrench size={17} />
                </StyledSoundEditorToolbarButton>
            </StyledSoundEditorToolbarGroup>
        </StyledSoundEditorToolbarSide>
    </StyledSoundEditorToolbar >;
}
