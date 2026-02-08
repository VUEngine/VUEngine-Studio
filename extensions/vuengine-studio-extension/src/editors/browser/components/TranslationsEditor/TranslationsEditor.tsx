import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import HContainer from '../Common/Base/HContainer';
import VContainer from '../Common/Base/VContainer';
import LanguagesTable from './LanguagesTable';
import { TranslationsData } from './TranslationsEditorTypes';
import TranslationsTable from './TranslationsTable';

const I18N_PLUGIN_ID = 'vuengine//other/I18n';

interface TranslationsEditorProps {
    translationsData: TranslationsData
    updateTranslationsData: (data: TranslationsData) => void
}

export default function TranslationsEditor(props: TranslationsEditorProps): React.JSX.Element {
    const { translationsData, updateTranslationsData } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;

    const installedPlugins = services.vesPluginsService.getInstalledPlugins();
    const hasI18nPlugin = installedPlugins.includes(I18N_PLUGIN_ID);

    const installPlugin = async () => {
        await services.vesPluginsService.installPlugin(I18N_PLUGIN_ID);
    };

    return (
        <VContainer gap={20}>
            {!hasI18nPlugin &&
                <HContainer alignItems='center'>
                    <i className="codicon codicon-warning invalid" />
                    {nls.localize('vuengine/editors/translations/pluginMissing', 'The I18n plugin is required in order to use these translations.')}
                    <button
                        className="theia-button secondary"
                        onClick={installPlugin}
                    >
                        {nls.localizeByDefault('Install')}
                    </button>
                </HContainer>
            }

            <div>
                <h3>
                    {nls.localize('vuengine/editors/translations/languages', 'Languages')}
                </h3>
                <LanguagesTable
                    translationsData={translationsData}
                    updateTranslationsData={updateTranslationsData}
                />
            </div>

            <div>
                <h3>
                    {nls.localize('vuengine/editors/translations/translations', 'Translations')}
                </h3>
                <TranslationsTable
                    translationsData={translationsData}
                    updateTranslationsData={updateTranslationsData}
                />
            </div>
        </VContainer>
    );
}
