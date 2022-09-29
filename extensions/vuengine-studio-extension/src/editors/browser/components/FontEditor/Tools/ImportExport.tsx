import React from 'react';

interface ImportExportProps {
}

export default function ImportExport(props: ImportExportProps): JSX.Element {
    return <div className='tools'>
        <button
            className='theia-button secondary full-width'
            title="Import"
        >
            Import
        </button>
        <button
            className='theia-button secondary full-width'
            title="Export"
        >
            Export
        </button>
    </div>;
}
