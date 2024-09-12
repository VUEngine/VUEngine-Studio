import { nls } from '@theia/core';
import React from 'react';
import VContainer from '../../Common/VContainer';

interface PatternsProps {
}

export default function Patterns(props: PatternsProps): React.JSX.Element {
    // const { } = props;

    return <VContainer gap={10}>
        <label>
            {nls.localize('vuengine/musicEditor/patterns', 'Patterns')}
        </label>
        <i>Not yet implemented</i>
    </VContainer>;
}
