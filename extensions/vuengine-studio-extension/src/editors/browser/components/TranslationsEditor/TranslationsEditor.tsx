import { nls, QuickPickItem, QuickPickItemOrSeparator, QuickPickOptions } from '@theia/core';
import React, { useContext } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import VContainer from '../Common/Base/VContainer';
import EmptyContainer from '../Common/EmptyContainer';
import LanguagesTable from './LanguagesTable';
import { Language, LANGUAGE_PRESETS, TranslationsData } from './TranslationsEditorTypes';
import TranslationsTable from './TranslationsTable';

const I18N_PLUGIN_ID = 'vuengine//other/I18n';

const StyledWarningContainer = styled.div`
    align-items: center;
    border-bottom: 1px solid var(--theia-editorGroup-border);
    display: flex;
    flex-direction: row;
    gap: var(--theia-ui-padding);
    justify-content: center;
    padding: calc(2 * var(--theia-ui-padding));
    position: relative;
    z-index: 10;
`;

const StyledTranslationsEditor = styled.div`
    display: flex;
    flex-direction: row;
    height: 100%;
    overflow: hidden;
`;

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

    const showLanguageSelection = (): Promise<QuickPickItem | undefined> => {
        const quickPickOptions: QuickPickOptions<QuickPickItem> = {
            title: nls.localize('vuengine/editors/translations/addLanguage', 'Add Language'),
            placeholder: nls.localize('vuengine/editors/translations/selectLanguageToAdd', 'Select a language to add...'),
        };
        const items: QuickPickItemOrSeparator[] = [{
            id: 'custom',
            label: nls.localize('vuengine/editors/translations/customLanguage', 'Custom Language'),
        }, {
            type: 'separator',
            label: nls.localize('vuengine/editors/translations/presets', 'Presets'),
        }];
        const existingLanguageCodes = translationsData.languages.map(l => l.code);
        Object.values(LANGUAGE_PRESETS)
            .filter(l => !existingLanguageCodes.includes(l.code))
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(a => {
                items.push({
                    id: a.code,
                    label: a.code,
                    description: a.name,
                });
            });

        return services.quickPickService.show(
            items,
            quickPickOptions
        );
    };

    const addLanguage = async (): Promise<void> => {
        const languageToAdd = await showLanguageSelection();
        if (languageToAdd) {
            let preset = {
                code: 'xx',
                name: '',
                flagActorId: 'UZHCHu3RBQgKczqm', // unknown flag
            } as Language;
            if (languageToAdd.id !== 'custom') {
                preset = LANGUAGE_PRESETS[languageToAdd.id!];
            }

            // TODO: why does this not set dirty flag?
            updateTranslationsData({
                languages: [...translationsData.languages, preset],
                translations: Object.fromEntries(
                    Object.entries(translationsData.translations)
                        .map(([tId, ts]) => ([
                            tId,
                            { ...ts, [preset.code]: '' }
                        ]))
                )
            });
        }
    };

    return (
        <VContainer gap={0} overflow='hidden' style={{ padding: 0 }}>
            {!hasI18nPlugin &&
                <StyledWarningContainer>
                    <i className="codicon codicon-warning invalid" />
                    {nls.localize('vuengine/editors/translations/pluginMissing', 'The I18n plugin is required in order to use these translations.')}
                    <button
                        className="theia-button secondary"
                        onClick={installPlugin}
                    >
                        {nls.localizeByDefault('Install')}
                    </button>
                </StyledWarningContainer>
            }

            {translationsData.languages.length === 0
                ? (
                    <EmptyContainer
                        title={nls.localize('vuengine/editors/translations/noLanguage', 'Translations are empty')}
                        description={nls.localize(
                            'vuengine/editors/translations/clickBelowToAddFirstLanguage',
                            'Click below to add the first language',
                        )}
                        onClick={() => addLanguage()}
                    />
                ) : (
                    <StyledTranslationsEditor>
                        <LanguagesTable
                            translationsData={translationsData}
                            updateTranslationsData={updateTranslationsData}
                            addLanguage={addLanguage}
                        />
                        <TranslationsTable
                            translationsData={translationsData}
                            updateTranslationsData={updateTranslationsData}
                        />
                    </StyledTranslationsEditor>
                )
            }

        </VContainer>
    );
}
