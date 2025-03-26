import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction, useContext } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import { SoundEditorCommands } from './SoundEditorCommands';
import { SoundEditorMode, SoundEditorTool } from './SoundEditorTypes';
import { DotsNine, Eraser, PencilSimple, PianoKeys, Selection } from '@phosphor-icons/react';
import { INPUT_BLOCKING_COMMANDS } from './SoundEditor';

export const StyledSoundEditorToolbar = styled.div`
    align-items: center;
    display: flex;
    flex-direction: row;
    gap: var(--padding);
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
    width: 50px;
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

interface SoundEditorToolbarProps {
    currentStep: number
    playing: boolean
    editorMode: number
    toggleEditorMode: () => void
    togglePlaying: () => void
    stopPlaying: () => void
    tool: SoundEditorTool
    setTool: Dispatch<SetStateAction<SoundEditorTool>>
    emulatorInitialized: boolean
    speed: number
}

export default function SoundEditorToolbar(props: SoundEditorToolbarProps): React.JSX.Element {
    const { disableCommands, enableCommands, services } = useContext(EditorsContext) as EditorsContextType;
    const {
        currentStep, playing, editorMode, toggleEditorMode, togglePlaying, stopPlaying, tool, setTool, speed, emulatorInitialized
    } = props;

    // TODO: compute
    const totalLength = 0;
    const playbackElapsedTime = 0;

    return (
        <StyledSoundEditorToolbar>
            <StyledSoundEditorToolbarGroup>
                <StyledSoundEditorToolbarWideButton
                    className='theia-button secondary'
                    title={(editorMode === SoundEditorMode.PIANOROLL
                        ? nls.localize('vuengine/editors/sound/switchToTrackerMode', 'Switch To Tracker Mode')
                        : nls.localize('vuengine/editors/sound/switchToPianoRollMode', 'Switch To Piano Roll Mode'))
                    }
                    onClick={toggleEditorMode}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                >
                    {editorMode === SoundEditorMode.PIANOROLL
                        ? <PianoKeys size={20} style={{ rotate: '-90deg' }} />
                        : <DotsNine size={20} />
                    }
                </StyledSoundEditorToolbarWideButton>
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
                    disabled={!emulatorInitialized}
                >
                    <i className="fa fa-stop" />
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
                            Math.floor(totalLength * speed / 1000 / 60) + ':' +
                            Math.floor((totalLength * speed / 1000) % 60).toString().padStart(2, '0') + ',' +
                            Math.floor((totalLength * speed / 100) % 10)
                        }
                    </span>
                </StyledSoundEditorToolbarTime>
            </StyledSoundEditorToolbarGroup>
            <StyledSoundEditorToolbarGroup>
                <StyledSoundEditorToolbarButton
                    className='theia-button secondary'
                    title={(nls.localize('vuengine/editors/sound/toolPencil', 'Pencil')) +
                        services.vesCommonService.getKeybindingLabel(SoundEditorCommands.TOOL_PENCIL.id, true)
                    }
                    onClick={() => setTool(SoundEditorTool.DEFAULT)}
                    style={{ outlineWidth: tool === SoundEditorTool.DEFAULT ? 1 : 0 }}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                >
                    <PencilSimple size={17} />
                </StyledSoundEditorToolbarButton>
                <StyledSoundEditorToolbarButton
                    className='theia-button secondary'
                    title={(nls.localize('vuengine/editors/sound/toolEraser', 'Eraser')) +
                        services.vesCommonService.getKeybindingLabel(SoundEditorCommands.TOOL_ERASER.id, true)
                    }
                    onClick={() => setTool(SoundEditorTool.ERASER)}
                    style={{ outlineWidth: tool === SoundEditorTool.ERASER ? 1 : 0 }}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                >
                    <Eraser size={17} />
                </StyledSoundEditorToolbarButton>
                <StyledSoundEditorToolbarButton
                    className='theia-button secondary'
                    title={(nls.localize('vuengine/editors/sound/toolMarquee', 'Marquee')) +
                        services.vesCommonService.getKeybindingLabel(SoundEditorCommands.TOOL_MARQUEE.id, true)
                    }
                    onClick={() => setTool(SoundEditorTool.MARQUEE)}
                    style={{ outlineWidth: tool === SoundEditorTool.MARQUEE ? 1 : 0 }}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    disabled={true}
                >
                    <Selection size={17} />
                </StyledSoundEditorToolbarButton>
            </StyledSoundEditorToolbarGroup>
            { /* }
            <StyledSoundEditorToolbarButton
                className={`theia-button ${recording ? 'primary' : 'secondary'} recordButton`}
                title='Recording Mode'
                disabled={true}
                onClick={() => setState({ recording: !recording })}
                onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
            >
                <i className='fa fa-circle' />
            </StyledSoundEditorToolbarButton>
            { */ }
        </StyledSoundEditorToolbar>
    );
}
