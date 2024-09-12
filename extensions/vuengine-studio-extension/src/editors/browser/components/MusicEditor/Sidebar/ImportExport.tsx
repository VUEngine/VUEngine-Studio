import React from 'react';
import VContainer from '../../Common/VContainer';
import { nls } from '@theia/core';

export default function ImportExport(): React.JSX.Element {
    return <VContainer gap={10}>
        <label>
            {nls.localize('vuengine/musicEditor/ImportExport', 'Import/Export')}
        </label>
        <i>Not yet implemented</i>
    </VContainer>;
}
