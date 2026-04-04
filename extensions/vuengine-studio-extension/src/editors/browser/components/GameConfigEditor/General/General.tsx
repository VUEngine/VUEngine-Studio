import { nls } from '@theia/core';
import React from 'react';
import Input from '../../Common/Base/Input';
import VContainer from '../../Common/Base/VContainer';
import { GameConfigData } from '../GameConfigEditorTypes';

interface GeneralProps {
    data: GameConfigData
    updateData: (data: GameConfigData) => void
}

export default function General(props: GeneralProps): React.JSX.Element {
    const { data, updateData } = props;

    const setProjectTitle = (projectTitle: string): void => {
        updateData({
            ...data,
            projectTitle
        });
    };

    const setProjectAuthor = (projectAuthor: string): void => {
        updateData({
            ...data,
            projectAuthor
        });
    };

    return <VContainer gap={15}>
        <Input
            label={nls.localize('vuengine/editors/gameConfig/gameTitle', 'Game Title')}
            value={data.projectTitle}
            setValue={t => setProjectTitle(t as string)}
        />
        <Input
            label={nls.localize('vuengine/editors/gameConfig/gameAuthor', 'Game Author')}
            value={data.projectAuthor}
            setValue={t => setProjectAuthor(t as string)}
        />
    </VContainer>;
}
