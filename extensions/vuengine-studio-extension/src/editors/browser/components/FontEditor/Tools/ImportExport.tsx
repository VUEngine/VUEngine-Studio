import { nls } from '@theia/core';
import React from 'react';

interface ImportExportProps {
}

export default function ImportExport(props: ImportExportProps): JSX.Element {
    return <div className='tools'>
        <button
            className='theia-button secondary full-width'
            title={nls.localize('vuengine/fontEditor/actions/import', 'Import')}
        >
            {nls.localize('vuengine/fontEditor/actions/import', 'Import')}
        </button>
        <button
            className='theia-button secondary full-width'
            title={nls.localize('vuengine/fontEditor/actions/export', 'Export')}
        >
            {nls.localize('vuengine/fontEditor/actions/export', 'Export')}
        </button>
    </div>;
}
