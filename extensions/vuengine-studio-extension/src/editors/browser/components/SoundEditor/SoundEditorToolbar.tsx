import {
    BookmarkSimple,
    Eraser,
    Hand,
    Magnet,
    PencilSimple,
    Selection,
    SelectionBackground,
    SelectionForeground,
    SidebarSimple
} from '@phosphor-icons/react';
import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction, useContext } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import AdvancedSelect from '../Common/Base/AdvancedSelect';
import RadioSelect from '../Common/Base/RadioSelect';
import { COLOR_PALETTE, DEFAULT_COLOR_INDEX } from '../Common/PaletteColorSelect';
import Emulator from './Emulator/Emulator';
import PlayerRomBuilder from './Emulator/PlayerRomBuilder';
import { InputWithAction, InputWithActionButton } from './Instruments/Instruments';
import { getInstrumentLabel, getInstrumentName } from './SoundEditor';
import { SoundEditorCommands } from './SoundEditorCommands';
import {
    EventsMap,
    PIANO_ROLL_KEY_WIDTH,
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
    align-items: start;
    display: flex;
    flex-direction: row;
    gap: 20px;
    justify-content: space-between;
    margin: var(--padding);
    row-gap: 10px;
`;

export const StyledSoundEditorToolbarNoteDurationOption = styled.div`
    font-family: "Bravura Text";
    font-size: 23px;
    height: 22px;
    line-height: 41px;
    width: 10px;
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
    width: 56px;
    
    canvas {
        visibility: hidden;
    }

    &.playing {
        background-color: black;

        canvas {
            visibility: visible;
        }
    }
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
    currentTrackId: number
    currentPatternId: string
    currentPlayerPosition: number
    setCurrentPlayerPosition: Dispatch<SetStateAction<number>>
    selectedNotes: number[]
    playing: boolean
    noteSnapping: boolean
    setNoteSnapping: Dispatch<SetStateAction<boolean>>
    tool: SoundEditorTool
    setTool: Dispatch<SetStateAction<SoundEditorTool>>
    marqueeMode: SoundEditorMarqueeMode
    setMarqueeMode: Dispatch<SetStateAction<SoundEditorMarqueeMode>>
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
    setNotes: (notes: EventsMap) => void
    setTrack: (trackId: number, track: Partial<TrackConfig>) => void
    forcePlayerRomRebuild: number
    setPlaying: Dispatch<SetStateAction<boolean>>
    showSidebar: boolean
    toggleSidebar: () => void
}

export default function SoundEditorToolbar(props: SoundEditorToolbarProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const {
        soundData,
        currentTrackId,
        currentPatternId,
        currentPlayerPosition, setCurrentPlayerPosition,
        selectedNotes,
        playing,
        tool, setTool,
        marqueeMode, setMarqueeMode,
        noteSnapping, setNoteSnapping,
        newNoteDuration, setNewNoteDuration,
        emulatorInitialized, setEmulatorInitialized,
        emulatorRomReady, setEmulatorRomReady,
        testNote, testInstrumentId,
        playRangeStart, playRangeEnd,
        trackSettings,
        playerRomBuilder,
        currentInstrumentId, setCurrentInstrumentId,
        setNotes,
        setTrack,
        forcePlayerRomRebuild,
        setPlaying,
        showSidebar, toggleSidebar,
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
                    <StyledSoundEditorToolbarVisualization className={playing ? 'playing' : undefined}>
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
                            setPlaying={setPlaying}
                        />
                    </StyledSoundEditorToolbarVisualization>
                </StyledSoundEditorToolbarGroup>
                <RadioSelect
                    defaultValue={tool}
                    onChange={options => setTool(options[0].value as SoundEditorTool)}
                    options={[{
                        label: <PencilSimple size={17} />,
                        tooltip: SoundEditorCommands.TOOL_EDIT.label +
                            services.vesCommonService.getKeybindingLabel(SoundEditorCommands.TOOL_EDIT.id, true),
                        value: SoundEditorTool.EDIT
                    }, {
                        label: <Eraser size={17} />,
                        tooltip: SoundEditorCommands.TOOL_ERASER.label +
                            services.vesCommonService.getKeybindingLabel(SoundEditorCommands.TOOL_ERASER.id, true),
                        value: SoundEditorTool.ERASER
                    }, {
                        label: <Hand size={17} />,
                        tooltip: SoundEditorCommands.TOOL_DRAG.label +
                            services.vesCommonService.getKeybindingLabel(SoundEditorCommands.TOOL_DRAG.id, true),
                        value: SoundEditorTool.DRAG
                    }, {
                        label: <Selection size={17} />,
                        tooltip: SoundEditorCommands.TOOL_MARQUEE.label +
                            services.vesCommonService.getKeybindingLabel(SoundEditorCommands.TOOL_MARQUEE.id, true),
                        value: SoundEditorTool.MARQUEE
                    }, /* {
                        label: <i className='fa fa-circle' />,
                        title: SoundEditorCommands.TOOL_RECORD.label +
                            services.vesCommonService.getKeybindingLabel(SoundEditorCommands.TOOL_RECORD.id, true),
                        value: SoundEditorTool.RECORD
                    } */ ]}
                />
                <RadioSelect
                    defaultValue={marqueeMode}
                    onChange={options => setMarqueeMode(options[0].value as SoundEditorMarqueeMode)}
                    options={[{
                        label: <Selection size={17} />,
                        tooltip: SoundEditorCommands.TOOL_MARQUEE_MODE_REPLACE.label +
                            services.vesCommonService.getKeybindingLabel(SoundEditorCommands.TOOL_MARQUEE_MODE_REPLACE.id, true),
                        value: SoundEditorMarqueeMode.REPLACE
                    }, {
                        label: <SelectionBackground size={17} />,
                        tooltip: SoundEditorCommands.TOOL_MARQUEE_MODE_ADD.label +
                            services.vesCommonService.getKeybindingLabel(SoundEditorCommands.TOOL_MARQUEE_MODE_ADD.id, true),
                        value: SoundEditorMarqueeMode.ADD
                    }, {
                        label: <SelectionForeground size={17} />,
                        tooltip: SoundEditorCommands.TOOL_MARQUEE_MODE_SUBTRACT.label +
                            services.vesCommonService.getKeybindingLabel(SoundEditorCommands.TOOL_MARQUEE_MODE_SUBTRACT.id, true),
                        value: SoundEditorMarqueeMode.SUBTRACT
                    }]}
                />
                <StyledSoundEditorToolbarGroup>
                    <RadioSelect
                        defaultValue={noteSnapping}
                        onChange={() => setNoteSnapping(!noteSnapping)}
                        options={[{
                            label: <Magnet size={17} />,
                            tooltip: SoundEditorCommands.TOGGLE_NOTE_SNAPPING.label +
                                services.vesCommonService.getKeybindingLabel(SoundEditorCommands.TOGGLE_NOTE_SNAPPING.id, true),
                            value: true
                        }]}
                    />
                    <RadioSelect
                        defaultValue={newNoteDuration}
                        onChange={options => setNewNoteDuration(options[0].value as number)}
                        options={[{
                            label: <StyledSoundEditorToolbarNoteDurationOption></StyledSoundEditorToolbarNoteDurationOption>,
                            tooltip: `${SoundEditorCommands.SET_NOTE_LENGTH_1.label}${services.vesCommonService.getKeybindingLabel(
                                SoundEditorCommands.SET_NOTE_LENGTH_1.id, true)}`,
                            value: 16
                        }, {
                            label: <StyledSoundEditorToolbarNoteDurationOption></StyledSoundEditorToolbarNoteDurationOption>,
                            tooltip: `${SoundEditorCommands.SET_NOTE_LENGTH_2.label}${services.vesCommonService.getKeybindingLabel(
                                SoundEditorCommands.SET_NOTE_LENGTH_2.id, true)}`,
                            value: 8
                        }, {
                            label: <StyledSoundEditorToolbarNoteDurationOption></StyledSoundEditorToolbarNoteDurationOption>,
                            tooltip: `${SoundEditorCommands.SET_NOTE_LENGTH_4.label}${services.vesCommonService.getKeybindingLabel(
                                SoundEditorCommands.SET_NOTE_LENGTH_4.id, true)}`,
                            value: 4
                        }, {
                            label: <StyledSoundEditorToolbarNoteDurationOption></StyledSoundEditorToolbarNoteDurationOption>,
                            tooltip: `${SoundEditorCommands.SET_NOTE_LENGTH_8.label}${services.vesCommonService.getKeybindingLabel(
                                SoundEditorCommands.SET_NOTE_LENGTH_8.id, true)}`,
                            value: 2
                        }, {
                            label: <StyledSoundEditorToolbarNoteDurationOption></StyledSoundEditorToolbarNoteDurationOption>,
                            tooltip: `${SoundEditorCommands.SET_NOTE_LENGTH_16.label}${services.vesCommonService.getKeybindingLabel(
                                SoundEditorCommands.SET_NOTE_LENGTH_16.id, true)}`,
                            value: 1
                        }]}
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
                                            label: getInstrumentLabel(soundData, instrumentId),
                                            backgroundColor: COLOR_PALETTE[instr.color ?? DEFAULT_COLOR_INDEX],
                                        };
                                    })
                            ]}
                            title={getInstrumentName(soundData, currentInstrumentId ?? TRACK_DEFAULT_INSTRUMENT_ID)}
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
                            borderColor={instrument ? COLOR_PALETTE[instrument.color] : undefined}
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
                            <BookmarkSimple size={17} />
                        </InputWithActionButton>
                    </InputWithAction>
                </StyledSoundEditorToolbarGroup>
            </>}
        </StyledSoundEditorToolbarSide>
        <StyledSoundEditorToolbarSide>
            <RadioSelect
                defaultValue={showSidebar}
                onChange={toggleSidebar}
                options={[{
                    label: <SidebarSimple mirrored size={17} />,
                    tooltip: SoundEditorCommands.TOGGLE_SIDEBAR_VISIBILITY.label +
                        services.vesCommonService.getKeybindingLabel(SoundEditorCommands.TOGGLE_SIDEBAR_VISIBILITY.id, true),
                    value: true
                }]}
            />
        </StyledSoundEditorToolbarSide>
    </StyledSoundEditorToolbar>;
}
