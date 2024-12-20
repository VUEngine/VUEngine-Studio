import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction, useContext } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import { MusicEditorCommands } from './MusicEditorCommands';
import { MusicEditorMode, MusicEditorTool } from './MusicEditorTypes';
import { DotsNine, Eraser, PencilSimple, PianoKeys, Selection } from '@phosphor-icons/react';

export const StyledMusicEditorToolbar = styled.div`
    align-items: center;
    display: flex;
    flex-direction: row;
    gap: var(--padding);
    margin: var(--padding);
`;

export const StyledMusicEditorToolbarGroup = styled.div`
    align-items: center;
    display: flex;
    flex-direction: row;
    gap: 3px;
`;

export const StyledMusicEditorToolbarButton = styled.button`
    align-items: center;
    display: flex;
    justify-content: center;
    outline: 0px solid var(--theia-focusBorder);
    outline-offset: 1px;
    padding: 0;
    width: 32px;
`;

export const StyledMusicEditorToolbarWideButton = styled(StyledMusicEditorToolbarButton)`
    width: 50px;
`;

export const StyledMusicEditorToolbarCurrentStep = styled.div`
    align-items: center;
    border: 1px solid var(--theia-secondaryButton-background);
    border-radius: 2px;
    box-sizing: border-box;
    display: flex;
    height: 26px;
    justify-content: center;
    margin-right: 5px;
    width: 50px;
`;

interface MusicEditorToolbarProps {
    currentStep: number
    playing: boolean
    editorMode: number
    toggleEditorMode: () => void
    togglePlaying: () => void
    stopPlaying: () => void
    tool: MusicEditorTool
    setTool: Dispatch<SetStateAction<MusicEditorTool>>
}

export default function MusicEditorToolbar(props: MusicEditorToolbarProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { currentStep, playing, editorMode, toggleEditorMode, togglePlaying, stopPlaying, tool, setTool } = props;

    return (
        <StyledMusicEditorToolbar>
            <StyledMusicEditorToolbarGroup>
                <StyledMusicEditorToolbarWideButton
                    className='theia-button secondary'
                    title={(editorMode === MusicEditorMode.PIANOROLL
                        ? nls.localize('vuengine/musicEditor/switchToTrackerMode', 'Switch To Tracker Mode')
                        : nls.localize('vuengine/musicEditor/switchToPianoRollMode', 'Switch To Piano Roll Mode'))
                    }
                    onClick={toggleEditorMode}
                >
                    {editorMode === MusicEditorMode.PIANOROLL
                        ? <PianoKeys size={20} style={{ rotate: '-90deg' }} />
                        : <DotsNine size={20} />
                    }
                </StyledMusicEditorToolbarWideButton>
            </StyledMusicEditorToolbarGroup>
            <StyledMusicEditorToolbarGroup>
                <StyledMusicEditorToolbarWideButton
                    className={`theia-button ${playing ? 'primary' : 'secondary'}`}
                    title={(playing
                        ? nls.localize('vuengine/musicEditor/pause', 'Pause')
                        : nls.localize('vuengine/musicEditor/play', 'Play')) +
                        services.vesCommonService.getKeybindingLabel(MusicEditorCommands.PLAY_PAUSE.id, true)
                    }
                    onClick={togglePlaying}
                    style={{ outlineWidth: playing ? 1 : 0 }}
                >
                    <i className={`fa fa-${playing ? 'pause' : 'play'}`} />
                </StyledMusicEditorToolbarWideButton>
                <StyledMusicEditorToolbarButton
                    className='theia-button secondary'
                    title={(nls.localize('vuengine/musicEditor/stop', 'Stop')) +
                        services.vesCommonService.getKeybindingLabel(MusicEditorCommands.STOP.id, true)
                    }
                    onClick={stopPlaying}
                >
                    <i className="fa fa-stop" />
                </StyledMusicEditorToolbarButton>
                <StyledMusicEditorToolbarCurrentStep>
                    {currentStep + 1}
                </StyledMusicEditorToolbarCurrentStep>
            </StyledMusicEditorToolbarGroup>
            <StyledMusicEditorToolbarGroup>
                <StyledMusicEditorToolbarButton
                    className='theia-button secondary'
                    title={(nls.localize('vuengine/musicEditor/toolPencil', 'Pencil')) +
                        services.vesCommonService.getKeybindingLabel(MusicEditorCommands.TOOL_PENCIL.id, true)
                    }
                    onClick={() => setTool(MusicEditorTool.DEFAULT)}
                    style={{ outlineWidth: tool === MusicEditorTool.DEFAULT ? 1 : 0 }}
                >
                    <PencilSimple size={17} />
                </StyledMusicEditorToolbarButton>
                <StyledMusicEditorToolbarButton
                    className='theia-button secondary'
                    title={(nls.localize('vuengine/musicEditor/toolEraser', 'Eraser')) +
                        services.vesCommonService.getKeybindingLabel(MusicEditorCommands.TOOL_ERASER.id, true)
                    }
                    onClick={() => setTool(MusicEditorTool.ERASER)}
                    style={{ outlineWidth: tool === MusicEditorTool.ERASER ? 1 : 0 }}
                >
                    <Eraser size={17} />
                </StyledMusicEditorToolbarButton>
                <StyledMusicEditorToolbarButton
                    className='theia-button secondary'
                    title={(nls.localize('vuengine/musicEditor/toolMarquee', 'Marquee')) +
                        services.vesCommonService.getKeybindingLabel(MusicEditorCommands.TOOL_MARQUEE.id, true)
                    }
                    onClick={() => setTool(MusicEditorTool.MARQUEE)}
                    style={{ outlineWidth: tool === MusicEditorTool.MARQUEE ? 1 : 0 }}
                    disabled={true}
                >
                    <Selection size={17} />
                </StyledMusicEditorToolbarButton>
            </StyledMusicEditorToolbarGroup>
            { /* }
            <StyledMusicEditorToolbarButton
                className={`theia-button ${recording ? 'primary' : 'secondary'} recordButton`}
                title='Recording Mode'
                disabled={true}
                onClick={() => setState({ recording: !recording })}
            >
                <i className='fa fa-circle' />
            </StyledMusicEditorToolbarButton>
            { */ }
        </StyledMusicEditorToolbar>
    );
}
