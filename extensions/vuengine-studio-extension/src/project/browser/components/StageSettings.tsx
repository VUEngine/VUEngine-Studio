import { nls, URI } from '@theia/core';
import React, { useContext } from 'react';
import HContainer from '../../../editors/browser/components/Common/Base/HContainer';
import Input from '../../../editors/browser/components/Common/Base/Input';
import VContainer from '../../../editors/browser/components/Common/Base/VContainer';
import { EditorsContext, EditorsContextType } from '../../../editors/browser/ves-editors-types';
import { GameConfig, ProjectDataItem, WithFileUri } from '../ves-project-types';
import { MOCK_AUTO_PAUSE_SCREEN, MOCK_STAGES, MOCK_START_SCREEN } from './StagePreview';

interface StageSettingsProps {
    stageId: string
    gameConfig: GameConfig
    setGameConfig: (gameConfig: Partial<GameConfig>) => void
}

export default function StageSettings(props: StageSettingsProps): React.JSX.Element {
    const { /* gameConfig, setGameConfig, */ stageId } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;

    const openStageEditor = async (): Promise<void> => {
        const item = services.vesProjectService.getProjectDataItemById(stageId, 'Stage') as ProjectDataItem & WithFileUri;
        if (item && item._fileUri) {
            openEditor(item._fileUri);
        }
    };

    const openEditor = async (fileUri: URI): Promise<void> => {
        const opener = await services.openerService.getOpener(fileUri);
        await opener.open(fileUri, {
            widgetOptions: {
                mode: 'split-right',
            }
        });
    };

    return (
        <VContainer gap={15}>
            <VContainer>
                <label>
                    {nls.localize('vuengine/project/stage', 'Stage')}
                </label>
                <HContainer alignItems='end' grow={1}>
                    <Input
                        value={MOCK_STAGES[stageId].name}
                        disabled
                        readOnly
                        grow={1}
                    />
                    <button
                        className='theia-button secondary'
                        onClick={openStageEditor}
                        title={nls.localizeByDefault('Edit')}
                        style={{
                            margin: 0,
                            minWidth: 'unset',
                        }}
                    >
                        <i className='codicon codicon-edit' />
                    </button>
                </HContainer>
            </VContainer>
            <VContainer>
                <label>
                    {nls.localizeByDefault('Options')}
                </label>
                <HContainer>
                    <input
                        type="checkbox"
                        checked={stageId === MOCK_START_SCREEN}
                        onChange={() => { }}
                    />
                    {nls.localize('vuengine/project/startStage', 'Start Stage')}
                </HContainer>
                <HContainer>
                    <input
                        type="checkbox"
                        checked={stageId === MOCK_AUTO_PAUSE_SCREEN}
                        onChange={() => { }}
                    />
                    {nls.localize('vuengine/project/automaticPauseStage', 'Automatic Pause Stage')}
                </HContainer>
            </VContainer>
        </VContainer>
    );
}
