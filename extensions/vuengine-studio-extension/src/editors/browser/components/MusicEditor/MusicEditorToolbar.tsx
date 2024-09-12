import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import { EDITORS_COMMANDS } from '../../ves-editors-commands';

interface MusicEditorToolbarProps {
    currentStep: number
    playing: boolean
    togglePlaying: () => void
}

export default function MusicEditorToolbar(props: MusicEditorToolbarProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { currentStep, playing, togglePlaying } = props;

    return (
        <div className='toolbar'>
            <button
                className='theia-button secondary playButton'
                title={(playing
                    ? nls.localize('vuengine/musicEditor/play', 'Play')
                    : nls.localize('vuengine/musicEditor/stop', 'Stop')) +
                    services.vesCommonService.getKeybindingLabel(EDITORS_COMMANDS.MusicEditor.commands.playPause.id, true)
                }
                onClick={togglePlaying}
            >
                <i className={`fa fa-${playing ? 'stop' : 'play'}`} />
            </button>
            <div className='currentStep'>
                {currentStep}
            </div>
            { /* }
            <button
                className={`theia-button ${recording ? 'primary' : 'secondary'} recordButton`}
                title='Recording Mode'
                disabled={true}
                onClick={() => setState({ recording: !recording })}
            >
                <i className='fa fa-circle' />
            </button>
            <button
                className={'theia-button secondary'}
                title='Import'
                disabled={true}
            >
                <i className='fa fa-download' />
            </button>
            <button
                className={'theia-button secondary'}
                title='Export'
                disabled={true}
            >
                <i className='fa fa-upload' />
            </button>
            { */ }
        </div>
    );
}
