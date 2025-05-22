import { FadersHorizontal, Guitar, Magnet, PencilSimple, Selection } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction, useContext } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import AdvancedSelect from '../Common/Base/AdvancedSelect';
import { COLOR_PALETTE, DEFAULT_COLOR_INDEX } from '../Common/PaletteColorSelect';
import { InputWithAction, InputWithActionButton } from './Other/Instruments';
import { SoundEditorCommands } from './SoundEditorCommands';
import {
    BAR_NOTE_RESOLUTION,
    INPUT_BLOCKING_COMMANDS,
    PIANO_ROLL_KEY_WIDTH,
    SEQUENCER_RESOLUTION,
    SoundData,
    SoundEditorTool,
    SoundEvent,
    SUB_NOTE_RESOLUTION,
    TRACK_DEFAULT_INSTRUMENT_ID,
    TrackConfig,
} from './SoundEditorTypes';
import { getInstrumentName } from './SoundEditor';

export const StyledSoundEditorToolbar = styled.div`
    align-items: center;
    display: flex;
    flex-direction: row;
    gap: 20px;
    margin: var(--padding);
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
    width: 60px;
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
    currentSequenceIndex: number
    noteCursor: number
    playing: boolean
    noteSnapping: boolean
    tool: SoundEditorTool
    newNoteDuration: number
    setNewNoteDuration: Dispatch<SetStateAction<number>>
    emulatorInitialized: boolean
    currentInstrumentId: string
    setCurrentInstrumentId: Dispatch<SetStateAction<string>>
    editInstrument: (instrument: string) => void
    songSettingsDialogOpen: boolean
    setSongSettingsDialogOpen: Dispatch<SetStateAction<boolean>>
    setNoteEvent: (step: number, event: SoundEvent, value?: any) => void
    setTrack: (trackId: number, track: Partial<TrackConfig>) => void
}

export default function SoundEditorToolbar(props: SoundEditorToolbarProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const {
        soundData,
        currentTrackId,
        currentPatternId,
        currentPlayerPosition,
        currentSequenceIndex,
        noteCursor,
        playing,
        tool,
        noteSnapping,
        newNoteDuration, setNewNoteDuration,
        emulatorInitialized,
        editInstrument,
        currentInstrumentId, setCurrentInstrumentId,
        songSettingsDialogOpen, setSongSettingsDialogOpen,
        setNoteEvent,
        setTrack,
    } = props;

    const currentTrack = soundData.tracks[currentTrackId];
    const instrument = soundData.instruments[currentInstrumentId];

    const totalTicks = soundData.size / SEQUENCER_RESOLUTION * BAR_NOTE_RESOLUTION;
    const tickDurationUs = soundData.speed * 1000 / SUB_NOTE_RESOLUTION;
    const totalLengthSecs = totalTicks * tickDurationUs / 1000 / 1000;

    return soundData.tracks.length > 0
        ? <StyledSoundEditorToolbar>
            <StyledSoundEditorToolbarGroup>
                <StyledSoundEditorToolbarWideButton
                    className={`theia-button ${playing ? 'primary' : 'secondary'}`}
                    title={(playing
                        ? nls.localize('vuengine/editors/sound/pause', 'Pause')
                        : nls.localize('vuengine/editors/sound/play', 'Play')) +
                        services.vesCommonService.getKeybindingLabel(SoundEditorCommands.PLAY_PAUSE.id, true)
                    }
                    onClick={() => services.commandService.executeCommand(SoundEditorCommands.PLAY_PAUSE.id)}
                    style={{ outlineWidth: playing ? 1 : 0 }}
                    disabled={!emulatorInitialized}
                >
                    <i className={`fa fa-${playing ? 'pause' : 'play'}`} />
                </StyledSoundEditorToolbarWideButton>
                <StyledSoundEditorToolbarButton
                    className='theia-button secondary'
                    title={(nls.localize('vuengine/editors/sound/stop', 'Stop')) +
                        services.vesCommonService.getKeybindingLabel(SoundEditorCommands.STOP.id, true)
                    }
                    onClick={() => services.commandService.executeCommand(SoundEditorCommands.STOP.id)}
                    disabled={!emulatorInitialized || currentPlayerPosition < 0}
                >
                    <i className="fa fa-fast-backward" />
                </StyledSoundEditorToolbarButton>
                <StyledSoundEditorToolbarTime>
                    {currentPlayerPosition + 1}
                </StyledSoundEditorToolbarTime>
                <StyledSoundEditorToolbarTime>
                    <span>
                        {currentPlayerPosition > -1
                            ? Math.floor(currentPlayerPosition / 1000 / 60) + ':' +
                            Math.floor((currentPlayerPosition / 1000) % 60).toString().padStart(2, '0') + ',' +
                            Math.floor((currentPlayerPosition / 100) % 10)
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
            </StyledSoundEditorToolbarGroup>
            <StyledSoundEditorToolbarGroup>
                <StyledSoundEditorToolbarButton
                    className={`theia-button ${tool === SoundEditorTool.DEFAULT ? 'primary' : 'secondary'}`}
                    title={(nls.localize('vuengine/editors/sound/toolPencil', 'Pencil')) +
                        services.vesCommonService.getKeybindingLabel(SoundEditorCommands.TOOL_PENCIL.id, true)
                    }
                    onClick={() => services.commandService.executeCommand(SoundEditorCommands.TOOL_PENCIL.id)}
                >
                    <PencilSimple size={17} />
                </StyledSoundEditorToolbarButton>
                <StyledSoundEditorToolbarButton
                    className={`theia-button ${tool === SoundEditorTool.MARQUEE ? 'primary' : 'secondary'}`}
                    title={(nls.localize('vuengine/editors/sound/toolMarquee', 'Marquee')) +
                        services.vesCommonService.getKeybindingLabel(SoundEditorCommands.TOOL_MARQUEE.id, true)
                    }
                    // onClick={() => services.commandService.executeCommand(SoundEditorCommands.TOOL_MARQUEE.id)}
                    disabled={true}
                    // TODO
                    onClick={() => alert('Not yet implemented')}
                >
                    <Selection size={17} />
                </StyledSoundEditorToolbarButton>
                <StyledSoundEditorToolbarButton
                    className={`theia-button ${/* recording */false ? 'primary' : 'secondary'} recordButton`}
                    title='Recording Mode'
                    disabled={true}
                    // TODO
                    onClick={() => alert('Not yet implemented')}
                // onClick={() => setState({ recording: !recording })}
                >
                    <i className='fa fa-circle' />
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
                            const localStep = noteCursor - currentSequenceIndex * BAR_NOTE_RESOLUTION / SEQUENCER_RESOLUTION;
                            if (currentPattern.events[localStep] && currentPattern.events[localStep][SoundEvent.Note]) {
                                setNoteEvent(localStep, SoundEvent.Instrument, instrumentId !== TRACK_DEFAULT_INSTRUMENT_ID ? instrumentId : undefined);
                            }
                        }}
                        backgroundColor={instrument ? COLOR_PALETTE[instrument.color] : undefined}
                        width={180}
                        commands={INPUT_BLOCKING_COMMANDS}
                    />
                    <InputWithActionButton
                        className='theia-button secondary'
                        title={nls.localize('vuengine/editors/sound/editInstrument', 'Edit Instrument')}
                        onClick={() => editInstrument(currentInstrumentId)}
                    >
                        <i className='codicon codicon-settings-gear' />
                    </InputWithActionButton>
                    <InputWithActionButton
                        className='theia-button secondary'
                        title={nls.localize('vuengine/editors/sound/setAsTrackDefaultInstrument', 'Set As Default Instrument For Current Track')}
                        disabled={currentTrack.instrument === currentInstrumentId || currentInstrumentId === TRACK_DEFAULT_INSTRUMENT_ID}
                        onClick={() => setTrack(currentTrackId, { instrument: currentInstrumentId })}
                    >
                        <Guitar size={17} />
                    </InputWithActionButton>
                </InputWithAction>
            </StyledSoundEditorToolbarGroup>
            <StyledSoundEditorToolbarGroup>
                <StyledSoundEditorToolbarButton
                    className={`theia-button ${songSettingsDialogOpen ? 'primary' : 'secondary'}`}
                    title={nls.localize('vuengine/editors/sound/songSettings', 'Song Settings')}
                    onClick={() => setSongSettingsDialogOpen(prev => !prev)}
                >
                    <FadersHorizontal size={17} />
                </StyledSoundEditorToolbarButton>
            </StyledSoundEditorToolbarGroup>
        </StyledSoundEditorToolbar>
        : <></>;
}
