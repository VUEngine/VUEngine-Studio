import { nls } from '@theia/core';
import React from 'react';
import { FontEditorState, FontEditorTools } from '../FontEditorTypes';

interface ToolsProps {
    tool: FontEditorTools
    setState: (state: Partial<FontEditorState>) => void
}

export default function Tools(props: ToolsProps): React.JSX.Element {
    const { tool, setState } = props;

    return <div className='tools'>
        <button
            className={`theia-button full-width ${tool !== FontEditorTools.PENCIL ? 'secondary' : ''}`}
            title={nls.localize('vuengine/fontEditor/tools/pencil', 'Pencil')}
            onClick={() => setState({ tool: FontEditorTools.PENCIL })}
        >
            <i className="fa fa-pencil"></i>
        </button>
        <button
            className={`theia-button ${tool !== FontEditorTools.FILL ? 'secondary' : ''}`}
            title={nls.localize('vuengine/fontEditor/tools/fill', 'Fill')}
            onClick={() => setState({ tool: FontEditorTools.FILL })}
        >
            <i className="fa fa-paint-brush"></i>
        </button>
        <button
            className={`theia-button ${tool !== FontEditorTools.FILL_ALL ? 'secondary' : ''}`}
            title={nls.localize('vuengine/fontEditor/tools/fillAll', 'Fill all')}
            onClick={() => setState({ tool: FontEditorTools.FILL_ALL })}
        >
            <i className="fa fa-retweet"></i>
        </button>
        {/*
        <button
            className='theia-button secondary'
            title={nls.localize('vuengine/fontEditor/tools/line', 'Line')}
        >
            /
        </button>
        <button
            className='theia-button secondary'
            title={nls.localize('vuengine/fontEditor/tools/rectangle', 'Rectangle')}
        >
            <i className="fa fa-square-o"></i>
        </button>
        <button
            className='theia-button secondary'
            title={nls.localize('vuengine/fontEditor/tools/rectangleFilled', 'Rectangle (Filled)')}
        >
            <i className="fa fa-square"></i>
        </button>
        <button
            className='theia-button secondary'
            title={nls.localize('vuengine/fontEditor/tools/circle', 'Circle')}
        >
            <i className="fa fa-circle-o"></i>
        </button>
        <button
            className='theia-button secondary'
            title={nls.localize('vuengine/fontEditor/tools/circleFilled', 'Circle (Filled)')}
        >
            <i className="fa fa-circle"></i>
        </button>
        */}
    </div>;
}
