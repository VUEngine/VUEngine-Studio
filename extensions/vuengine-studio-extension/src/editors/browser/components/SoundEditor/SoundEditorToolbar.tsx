import {
    Eraser,
    FadersHorizontal,
    Guitar,
    Hand,
    Keyboard,
    Magnet,
    Minus,
    PencilSimple,
    Plus,
    Selection,
    SelectionBackground,
    SelectionForeground,
    Wrench
} from '@phosphor-icons/react';
import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction, useContext } from 'react';
import styled from 'styled-components';
import { VesCoreCommands } from '../../../../core/browser/ves-core-commands';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import AdvancedSelect from '../Common/Base/AdvancedSelect';
import Input from '../Common/Base/Input';
import VContainer from '../Common/Base/VContainer';
import { COLOR_PALETTE, DEFAULT_COLOR_INDEX } from '../Common/PaletteColorSelect';
import Emulator from './Emulator/Emulator';
import PlayerRomBuilder from './Emulator/PlayerRomBuilder';
import { InputWithAction, InputWithActionButton } from './Instruments/Instruments';
import { getInstrumentName } from './SoundEditor';
import { SoundEditorCommands } from './SoundEditorCommands';
import {
    EventsMap,
    PATTERN_SIZE_MAX,
    PATTERN_SIZE_MIN,
    NOTE_RESOLUTION,
    PIANO_ROLL_KEY_WIDTH,
    SequenceMap,
    SoundData,
    SoundEditorMarqueeMode,
    SoundEditorTool,
    SoundEvent,
    SUB_NOTE_RESOLUTION,
    TRACK_DEFAULT_INSTRUMENT_ID,
    TRACK_DEFAULT_INSTRUMENT_NAME,
    TRACK_TYPE_INSTRUMENT_COMPATIBILITY,
    TrackConfig,
    TrackSettings
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
    selectedNotes: number[]
    playing: boolean
    noteSnapping: boolean
    tool: SoundEditorTool
    marqueeMode: SoundEditorMarqueeMode
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
    utilitiesDialogOpen: boolean
    setUtilitiesDialogOpen: Dispatch<SetStateAction<boolean>>
    keyBindingsDialogOpen: boolean
    setKeyBindingsDialogOpen: Dispatch<SetStateAction<boolean>>
    propertiesDialogOpen: boolean
    setPropertiesDialogOpen: Dispatch<SetStateAction<boolean>>
    setNotes: (notes: EventsMap) => void
    setTrack: (trackId: number, track: Partial<TrackConfig>) => void
    forcePlayerRomRebuild: number
    stepsPerNote: number
    stepsPerBar: number
}

export default function SoundEditorToolbar(props: SoundEditorToolbarProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const {
        soundData,
        updateSoundData,
        currentTrackId,
        currentPatternId,
        currentPlayerPosition, setCurrentPlayerPosition,
        selectedNotes,
        playing,
        tool,
        marqueeMode,
        noteSnapping,
        newNoteDuration, setNewNoteDuration,
        emulatorInitialized, setEmulatorInitialized,
        emulatorRomReady, setEmulatorRomReady,
        testNote, testInstrumentId,
        playRangeStart, playRangeEnd,
        trackSettings,
        playerRomBuilder,
        currentInstrumentId, setCurrentInstrumentId,
        utilitiesDialogOpen, setUtilitiesDialogOpen,
        keyBindingsDialogOpen, setKeyBindingsDialogOpen,
        propertiesDialogOpen, setPropertiesDialogOpen,
        setNotes,
        setTrack,
        forcePlayerRomRebuild,
        stepsPerNote, stepsPerBar,
    } = props;
    const isPlayingRegular = playing && !testNote;

    const currentTrack = soundData.tracks[currentTrackId];
    const instrument = soundData.instruments[currentInstrumentId];

    const totalSteps = soundData.size * SUB_NOTE_RESOLUTION;
    const tickDurationUs = soundData.speed[0] * 1000 / SUB_NOTE_RESOLUTION;
    const totalLengthSecs = totalSteps * tickDurationUs / 1000 / 1000;

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
                        duration: 64 * SUB_NOTE_RESOLUTION
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
        if (size > PATTERN_SIZE_MAX || size < PATTERN_SIZE_MIN) {
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
                        const patternSize = pattern.size / NOTE_RESOLUTION;
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
        setSize(Math.min(PATTERN_SIZE_MAX, soundData.size + amount));

    const decreaseSize = (amount: number) =>
        setSize(Math.max(PATTERN_SIZE_MIN, soundData.size - amount));

    return <StyledSoundEditorToolbar>
        <StyledSoundEditorToolbarSide>
            {soundData.tracks.length > 0 && <>
                <StyledSoundEditorToolbarGroup>
                    <StyledSoundEditorToolbarWideButton
                        className={`theia-button ${isPlayingRegular ? 'primary' : 'secondary'}`}
                        title={SoundEditorCommands.PLAY_PAUSE.label +
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
                        title={SoundEditorCommands.STOP.label +
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
                                ? Math.floor(currentPlayerPosition * soundData.speed[0] / 1000 / 60) + ':' +
                                Math.floor((currentPlayerPosition * soundData.speed[0] / 1000) % 60).toString().padStart(2, '0') + ',' +
                                Math.floor((currentPlayerPosition * soundData.speed[0] / 100) % 10)
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
                <StyledSoundEditorToolbarGroup>
                    <StyledSoundEditorToolbarButton
                        className={`theia-button ${tool === SoundEditorTool.EDIT ? 'primary' : 'secondary'}`}
                        title={SoundEditorCommands.TOOL_EDIT.label +
                            services.vesCommonService.getKeybindingLabel(SoundEditorCommands.TOOL_EDIT.id, true)
                        }
                        onClick={() => services.commandService.executeCommand(SoundEditorCommands.TOOL_EDIT.id)}
                    >
                        <PencilSimple size={17} />
                    </StyledSoundEditorToolbarButton>
                    <StyledSoundEditorToolbarButton
                        className={`theia-button ${tool === SoundEditorTool.ERASER ? 'primary' : 'secondary'}`}
                        title={SoundEditorCommands.TOOL_ERASER.label +
                            services.vesCommonService.getKeybindingLabel(SoundEditorCommands.TOOL_ERASER.id, true)
                        }
                        onClick={() => services.commandService.executeCommand(SoundEditorCommands.TOOL_ERASER.id)}
                    >
                        <Eraser size={17} />
                    </StyledSoundEditorToolbarButton>
                    <StyledSoundEditorToolbarButton
                        className={`theia-button ${tool === SoundEditorTool.DRAG ? 'primary' : 'secondary'}`}
                        title={SoundEditorCommands.TOOL_DRAG.label +
                            services.vesCommonService.getKeybindingLabel(SoundEditorCommands.TOOL_DRAG.id, true)
                        }
                        onClick={() => services.commandService.executeCommand(SoundEditorCommands.TOOL_DRAG.id)}
                    >
                        <Hand size={17} />
                    </StyledSoundEditorToolbarButton>
                    <StyledSoundEditorToolbarButton
                        className={`theia-button ${tool === SoundEditorTool.MARQUEE ? 'primary' : 'secondary'}`}
                        title={SoundEditorCommands.TOOL_MARQUEE.label +
                            services.vesCommonService.getKeybindingLabel(SoundEditorCommands.TOOL_MARQUEE.id, true)
                        }
                        onClick={() => services.commandService.executeCommand(SoundEditorCommands.TOOL_MARQUEE.id)}
                    >
                        <Selection size={17} />
                    </StyledSoundEditorToolbarButton>
                    { /* }
                    <StyledSoundEditorToolbarButton
                        className={`theia-button ${recording ? 'primary' : 'secondary'} recordButton`}
                        title='Recording Mode'
                        disabled={true}
                        onClick={() => setRecording(true)}
                    >
                        <i className='fa fa-circle' />
                    </StyledSoundEditorToolbarButton>
                    { */ }
                </StyledSoundEditorToolbarGroup>
                <StyledSoundEditorToolbarGroup>
                    <StyledSoundEditorToolbarButton
                        className={`theia-button ${marqueeMode === SoundEditorMarqueeMode.REPLACE ? 'primary' : 'secondary'}`}
                        title={SoundEditorCommands.TOOL_MARQUEE_MODE_REPLACE.label +
                            services.vesCommonService.getKeybindingLabel(SoundEditorCommands.TOOL_MARQUEE_MODE_REPLACE.id, true)
                        }
                        onClick={() => services.commandService.executeCommand(SoundEditorCommands.TOOL_MARQUEE_MODE_REPLACE.id)}
                    >
                        <Selection size={17} />
                    </StyledSoundEditorToolbarButton>
                    <StyledSoundEditorToolbarButton
                        className={`theia-button ${marqueeMode === SoundEditorMarqueeMode.ADD ? 'primary' : 'secondary'}`}
                        title={SoundEditorCommands.TOOL_MARQUEE_MODE_ADD.label +
                            services.vesCommonService.getKeybindingLabel(SoundEditorCommands.TOOL_MARQUEE_MODE_ADD.id, true)
                        }
                        onClick={() => services.commandService.executeCommand(SoundEditorCommands.TOOL_MARQUEE_MODE_ADD.id)}
                    >
                        <SelectionBackground size={17} />
                    </StyledSoundEditorToolbarButton>
                    <StyledSoundEditorToolbarButton
                        className={`theia-button ${marqueeMode === SoundEditorMarqueeMode.SUBTRACT ? 'primary' : 'secondary'}`}
                        title={SoundEditorCommands.TOOL_MARQUEE_MODE_SUBTRACT.label +
                            services.vesCommonService.getKeybindingLabel(SoundEditorCommands.TOOL_MARQUEE_MODE_SUBTRACT.id, true)
                        }
                        onClick={() => services.commandService.executeCommand(SoundEditorCommands.TOOL_MARQUEE_MODE_SUBTRACT.id)}
                    >
                        <SelectionForeground size={17} />
                    </StyledSoundEditorToolbarButton>
                </StyledSoundEditorToolbarGroup>
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
                        title={nls.localize('vuengine/editors/sound/noteLength', 'Note Length')}
                        defaultValue={newNoteDuration.toString()}
                        onChange={options => setNewNoteDuration(parseInt(options[0]))}
                        options={[{
                            label: '1',
                            value: '16'
                        }, {
                            label: '1/2',
                            value: '8'
                        }, {
                            label: '1/4',
                            value: '4'
                        }, {
                            label: '1/8',
                            value: '2'
                        }, {
                            label: '1/16',
                            value: '1'
                        }]}
                        width={67}
                    />
                </StyledSoundEditorToolbarGroup>
                <StyledSoundEditorToolbarGroup>
                    <InputWithAction>
                        <AdvancedSelect
                            options={[
                                {
                                    value: TRACK_DEFAULT_INSTRUMENT_ID,
                                    label: TRACK_DEFAULT_INSTRUMENT_NAME,
                                },
                                ...Object.keys(soundData.instruments)
                                    .filter(instrumentId => {
                                        const instr = soundData.instruments[instrumentId];
                                        return instr && TRACK_TYPE_INSTRUMENT_COMPATIBILITY[currentTrack.type].includes(instr.type);
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

                                const notes: EventsMap = {};
                                selectedNotes.forEach(sn => {
                                    if (currentPattern.events[sn] && currentPattern.events[sn][SoundEvent.Note]) {
                                        notes[sn] = {
                                            [SoundEvent.Instrument]: instrumentId !== TRACK_DEFAULT_INSTRUMENT_ID ? instrumentId : undefined
                                        };
                                    }
                                });

                                if (Object.keys(notes).length) {
                                    setNotes(notes);
                                }
                            }}
                            backgroundColor={instrument ? COLOR_PALETTE[instrument.color] : undefined}
                            width={180}
                        />
                        <InputWithActionButton
                            className='theia-button secondary'
                            title={
                                SoundEditorCommands.OPEN_INSTRUMENT_EDITOR.label +
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
                            onClick={() => decreaseSize(stepsPerNote)}
                            title={nls.localize('vuengine/editors/sound/decreaseLength', 'Decrease Length')}
                        >
                            <Minus size={10} />{stepsPerNote}
                        </StyledSoundEditorToolbarSizeButton>
                        <StyledSoundEditorToolbarSizeButton
                            className="theia-button secondary"
                            onClick={() => decreaseSize(stepsPerBar)}
                            title={nls.localize('vuengine/editors/sound/decreaseLength', 'Decrease Length')}
                        >
                            <Minus size={10} />{stepsPerBar}
                        </StyledSoundEditorToolbarSizeButton>
                    </VContainer>
                    <Input
                        type="number"
                        value={soundData.size}
                        setValue={setSize}
                        min={PATTERN_SIZE_MIN}
                        max={PATTERN_SIZE_MAX}
                        title={nls.localize('vuengine/editors/sound/Length', 'Length')}
                        width={48}
                    />
                    <VContainer gap={2}>
                        <StyledSoundEditorToolbarSizeButton
                            className="theia-button secondary"
                            onClick={() => increaseSize(stepsPerNote)}
                            title={nls.localize('vuengine/editors/sound/increaseLength', 'Increase Length')}
                        >
                            <Plus size={10} />{stepsPerNote}
                        </StyledSoundEditorToolbarSizeButton>
                        <StyledSoundEditorToolbarSizeButton
                            className="theia-button secondary"
                            onClick={() => increaseSize(stepsPerBar)}
                            title={nls.localize('vuengine/editors/sound/increaseLength', 'Increase Length')}
                        >
                            <Plus size={10} />{stepsPerBar}
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
                    className={`theia-button ${utilitiesDialogOpen ? 'primary' : 'secondary'}`}
                    title={nls.localize('vuengine/editors/sound/utilities', 'Utilities')}
                    onClick={() => setUtilitiesDialogOpen(prev => !prev)}
                >
                    <Wrench size={17} />
                </StyledSoundEditorToolbarButton>

                {soundData.tracks.length > 0 &&
                    <StyledSoundEditorToolbarButton
                        className={`theia-button ${keyBindingsDialogOpen ? 'primary' : 'secondary'}`}
                        title={nls.localizeByDefault('Keybindings')}
                        onClick={() => setKeyBindingsDialogOpen(prev => !prev)}
                    >
                        <Keyboard size={17} />
                    </StyledSoundEditorToolbarButton>
                }
                <StyledSoundEditorToolbarButton
                    className={`theia-button ${utilitiesDialogOpen ? 'primary' : 'secondary'}`}
                    title={nls.localizeByDefault('Documentation')}
                    onClick={() => services.commandService.executeCommand(VesCoreCommands.OPEN_DOCUMENTATION.id, 'basics/sound-editor', false)}
                >
                    <i className="codicon codicon-book" />
                </StyledSoundEditorToolbarButton>
            </StyledSoundEditorToolbarGroup>
        </StyledSoundEditorToolbarSide>
    </StyledSoundEditorToolbar>;
}
