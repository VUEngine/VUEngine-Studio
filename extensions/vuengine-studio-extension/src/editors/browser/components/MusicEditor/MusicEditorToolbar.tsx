import { nls } from '@theia/core';
import React, { useContext } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import { MusicEditorCommands } from './MusicEditorCommands';

export const StyledMusicEditorToolbar = styled.div`
    align-items: center;
    display: flex;
    flex-direction: row;
    gap: 3px;
`;

export const StyledMusicEditorToolbarButton = styled.button`
    margin-left: 0px;
    min-width: unset;
    padding: 0;
    width: 32px;
`;

export const StyledMusicEditorToolbarPlayButton = styled(StyledMusicEditorToolbarButton)`
    width: 75px;
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
    width: 63px;
`;

interface MusicEditorToolbarProps {
    currentStep: number
    playing: boolean
    togglePlaying: () => void
}

export default function MusicEditorToolbar(props: MusicEditorToolbarProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { currentStep, playing, togglePlaying } = props;

    return (
        <StyledMusicEditorToolbar>
            <StyledMusicEditorToolbarPlayButton
                className='theia-button secondary'
                title={(playing
                    ? nls.localize('vuengine/musicEditor/play', 'Play')
                    : nls.localize('vuengine/musicEditor/stop', 'Stop')) +
                    services.vesCommonService.getKeybindingLabel(MusicEditorCommands.PLAY_PAUSE.id, true)
                }
                onClick={togglePlaying}
            >
                <i className={`fa fa-${playing ? 'stop' : 'play'}`} />
            </StyledMusicEditorToolbarPlayButton>
            <StyledMusicEditorToolbarCurrentStep>
                {currentStep}
            </StyledMusicEditorToolbarCurrentStep>
            { /* }
            <StyledMusicEditorToolbarButton
                className={`theia-button ${recording ? 'primary' : 'secondary'} recordButton`}
                title='Recording Mode'
                disabled={true}
                onClick={() => setState({ recording: !recording })}
            >
                <i className='fa fa-circle' />
            </StyledMusicEditorToolbarButton>
            <StyledMusicEditorToolbarButton
                className={'theia-button secondary'}
                title='Import'
                disabled={true}
            >
                <i className='fa fa-download' />
            </StyledMusicEditorToolbarButton>
            <StyledMusicEditorToolbarButton
                className={'theia-button secondary'}
                title='Export'
                disabled={true}
            >
                <i className='fa fa-upload' />
            </StyledMusicEditorToolbarButton>
            { */ }
        </StyledMusicEditorToolbar>
    );
}
