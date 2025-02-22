import { nls } from '@theia/core';
import React from 'react';
import VContainer from '../../Common/Base/VContainer';

interface SpriteEditorNavigatorProps {
}

export default function SpriteEditorNavigator(props: SpriteEditorNavigatorProps): React.JSX.Element {
    return (
        <VContainer>
            <label>
                {nls.localize('vuengine/editors/sprite/navigator', 'Navigator')}
            </label>
            <div className="item"></div>
        </VContainer>
    );
}
