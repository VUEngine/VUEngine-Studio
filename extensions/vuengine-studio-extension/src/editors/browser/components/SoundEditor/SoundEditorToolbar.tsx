import { FadersHorizontal, Guitar, Magnet, PencilSimple, PianoKeys, Selection } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction, useContext } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import AdvancedSelect from '../Common/Base/AdvancedSelect';
import { SoundEditorCommands } from './SoundEditorCommands';
import { BAR_NOTE_RESOLUTION, INPUT_BLOCKING_COMMANDS, SoundData, SoundEditorTool, SUB_NOTE_RESOLUTION } from './SoundEditorTypes';

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
    width: 56px;
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
    tab: number
    currentStep: number
    playing: boolean
    togglePlaying: () => void
    stopPlaying: () => void
    noteSnapping: boolean
    setNoteSnapping: Dispatch<SetStateAction<boolean>>
    tool: SoundEditorTool
    setTool: Dispatch<SetStateAction<SoundEditorTool>>
    newNoteDuration: number
    setNewNoteDuration: Dispatch<SetStateAction<number>>
    emulatorInitialized: boolean
}

export default function SoundEditorToolbar(props: SoundEditorToolbarProps): React.JSX.Element {
    const { disableCommands, enableCommands, services } = useContext(EditorsContext) as EditorsContextType;
    const {
        soundData,
        tab,
        currentStep,
        playing, togglePlaying, stopPlaying,
        tool, setTool,
        noteSnapping, setNoteSnapping,
        newNoteDuration, setNewNoteDuration,
        emulatorInitialized,
    } = props;

    const playbackElapsedTime = currentStep;
    const totalTicks = soundData.size * BAR_NOTE_RESOLUTION;
    const tickDurationUs = soundData.speed * 1000 / SUB_NOTE_RESOLUTION;
    const totalLengthSecs = totalTicks * tickDurationUs / 1000 / 1000;

    const sequencerTabCommand = SoundEditorCommands.SHOW_SEQUENCER_VIEW;
    const instrumentsTabCommand = SoundEditorCommands.SHOW_INSTRUMENTS_VIEW;
    const settingsTabCommand = SoundEditorCommands.SHOW_SETTINGS_VIEW;

    return (
        <StyledSoundEditorToolbar>
            <StyledSoundEditorToolbarGroup>
                <StyledSoundEditorToolbarButton
                    className={`theia-button ${tab === 0 ? 'primary' : 'secondary'}`}
                    title={`${sequencerTabCommand.label}${services.vesCommonService.getKeybindingLabel(sequencerTabCommand.id, true)}`}
                    onClick={() => services.commandService.executeCommand(sequencerTabCommand.id)}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                >
                    <PianoKeys size={17} />
                </StyledSoundEditorToolbarButton>
                <StyledSoundEditorToolbarButton
                    className={`theia-button ${tab === 1 ? 'primary' : 'secondary'}`}
                    title={`${instrumentsTabCommand.label}${services.vesCommonService.getKeybindingLabel(instrumentsTabCommand.id, true)}`}
                    onClick={() => services.commandService.executeCommand(instrumentsTabCommand.id)}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                >
                    <Guitar size={17} />
                </StyledSoundEditorToolbarButton>
                <StyledSoundEditorToolbarButton
                    className={`theia-button ${tab === 2 ? 'primary' : 'secondary'}`}
                    title={`${settingsTabCommand.label}${services.vesCommonService.getKeybindingLabel(settingsTabCommand.id, true)}`}
                    onClick={() => services.commandService.executeCommand(settingsTabCommand.id)}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                >
                    <FadersHorizontal size={17} />
                </StyledSoundEditorToolbarButton>
            </StyledSoundEditorToolbarGroup>
            <StyledSoundEditorToolbarGroup>
                <StyledSoundEditorToolbarWideButton
                    className={`theia-button ${playing ? 'primary' : 'secondary'}`}
                    title={(playing
                        ? nls.localize('vuengine/editors/sound/pause', 'Pause')
                        : nls.localize('vuengine/editors/sound/play', 'Play')) +
                        services.vesCommonService.getKeybindingLabel(SoundEditorCommands.PLAY_PAUSE.id, true)
                    }
                    onClick={togglePlaying}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
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
                    onClick={stopPlaying}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    disabled={!emulatorInitialized || currentStep < 0}
                >
                    <i className="fa fa-fast-backward" />
                </StyledSoundEditorToolbarButton>
                <StyledSoundEditorToolbarTime>
                    {currentStep + 1}
                </StyledSoundEditorToolbarTime>
                <StyledSoundEditorToolbarTime>
                    <span>
                        {currentStep > -1
                            ? Math.floor(playbackElapsedTime / 1000 / 60) + ':' +
                            Math.floor((playbackElapsedTime / 1000) % 60).toString().padStart(2, '0') + ',' +
                            Math.floor((playbackElapsedTime / 100) % 10)
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
                    onClick={() => setTool(SoundEditorTool.DEFAULT)}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                >
                    <PencilSimple size={17} />
                </StyledSoundEditorToolbarButton>
                <StyledSoundEditorToolbarButton
                    className={`theia-button ${tool === SoundEditorTool.MARQUEE ? 'primary' : 'secondary'}`}
                    title={(nls.localize('vuengine/editors/sound/toolMarquee', 'Marquee')) +
                        services.vesCommonService.getKeybindingLabel(SoundEditorCommands.TOOL_MARQUEE.id, true)
                    }
                    // onClick={() => setTool(SoundEditorTool.MARQUEE)}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
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
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                >
                    <i className='fa fa-circle' />
                </StyledSoundEditorToolbarButton>
            </StyledSoundEditorToolbarGroup>
            <StyledSoundEditorToolbarGroup>
                <StyledSoundEditorToolbarButton
                    className={`theia-button ${noteSnapping ? 'primary' : 'secondary'}`}
                    title='Note Snapping'
                    onClick={() => setNoteSnapping(prev => !prev)}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
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
                    width={47}
                />
            </StyledSoundEditorToolbarGroup>
        </StyledSoundEditorToolbar>
    );
}
