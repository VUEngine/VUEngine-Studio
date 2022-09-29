import React from 'react';

interface ToolsProps {
}

export default function Tools(props: ToolsProps): JSX.Element {
    return <div className='tools'>
        <button
            className='theia-button full-width'
            title="Pencil"
        >
            <i className="fa fa-pencil"></i>
        </button>
        <button
            className='theia-button secondary'
            title="Fill"
        >
            <i className="fa fa-paint-brush"></i>
        </button>
        <button
            className='theia-button secondary'
            title="Line"
        >
            /
        </button>
        <button
            className='theia-button secondary'
            title="Rectangle"
        >
            <i className="fa fa-square-o"></i>
        </button>
        <button
            className='theia-button secondary'
            title="Rectangle (Filled)"
        >
            <i className="fa fa-square"></i>
        </button>
        <button
            className='theia-button secondary'
            title="Circle"
        >
            <i className="fa fa-circle-o"></i>
        </button>
        <button
            className='theia-button secondary'
            title="Circle (Filled)"
        >
            <i className="fa fa-circle"></i>
        </button>
    </div>;
}
