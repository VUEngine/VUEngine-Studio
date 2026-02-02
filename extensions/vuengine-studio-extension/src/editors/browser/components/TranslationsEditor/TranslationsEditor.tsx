import { deepClone, nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React, { useContext } from 'react';
import { WithContributor } from '../../../../project/browser/ves-project-types';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import HContainer from '../Common/Base/HContainer';
import LanguagesTable from './LanguagesTable';
import { LANGUAGES, Translation, Translations, TranslationsData } from './TranslationsEditorTypes';
import TranslationsTable from './TranslationsTable';

const I18N_PLUGIN_ID = 'vuengine//other/I18n';

interface TranslationsEditorProps {
    translationsData: TranslationsData
    updateTranslationsData: (data: TranslationsData) => void
}

export default function TranslationsEditor(props: TranslationsEditorProps): React.JSX.Element {
    const { translationsData, updateTranslationsData } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { languages, translations } = translationsData;
    const combinedTranslations = services.vesProjectService.getProjectDataItemsForType('Translations') || {} as Translations & WithContributor;

    const installedPlugins = services.vesPluginsService.getInstalledPlugins();
    const hasI18nPlugin = installedPlugins.includes(I18N_PLUGIN_ID);

    const installPlugin = async () => {
        await services.vesPluginsService.installPlugin(I18N_PLUGIN_ID);
    };

    const onChangeFlag = (index: number, flag: string): void => {
        const updatedLanguages = deepClone(translationsData.languages);
        updatedLanguages[index] = {
            ...updatedLanguages[index],
            flag,
        };

        updateTranslationsData({
            ...translationsData,
            languages: updatedLanguages
        });
    };

    const onChangeLocalizedName = (index: number, localizedName: string): void => {
        const updatedLanguages = deepClone(translationsData.languages);
        updatedLanguages[index] = {
            ...updatedLanguages[index],
            localizedName: localizedName,
        };

        updateTranslationsData({
            ...translationsData,
            languages: updatedLanguages
        });
    };

    const onChangeLanguage = (index: number, code: string): void => {
        const updatedLanguages = deepClone(translationsData.languages);
        updatedLanguages[index] = {
            ...updatedLanguages[index],
            code: code,
            localizedName: LANGUAGES[code],
            name: LANGUAGES[code],
        };

        updateTranslationsData({
            ...translationsData,
            languages: updatedLanguages
        });
    };

    const addLanguage = (): void => {
        const existingLanguageCodes = translationsData.languages.map(lang => lang.code);
        const filteredLanguageCodes = Object.keys(LANGUAGES).filter(c => !existingLanguageCodes.includes(c));
        const newLanguageCode = filteredLanguageCodes[0];

        // add language itself
        const updatedLanguages = deepClone(translationsData.languages);
        updatedLanguages.push({
            code: newLanguageCode,
            flag: '',
            localizedName: LANGUAGES[newLanguageCode],
            name: LANGUAGES[newLanguageCode],
        });

        // add translations for language
        const updatedTranslations: Translations = {};
        Object.keys(translationsData.translations).map(translationKey => {
            updatedTranslations[translationKey] = translationsData.translations[translationKey];
            updatedTranslations[translationKey][newLanguageCode] = '';
        });

        updateTranslationsData({
            ...translationsData,
            languages: updatedLanguages,
            translations: updatedTranslations,
        });
    };

    const removeLanguage = async (code: string): Promise<void> => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/editors/translations/deleteLanguageQuestion', 'Delete Language?'),
            msg: nls.localize(
                'vuengine/editors/translations/areYouSureYouWantToDelete',
                'Are you sure you want to delete {0}?',
                nls.localize(`vuengine/general/languages/${code}`, LANGUAGES[code])
            ),
        });
        const remove = await dialog.open();
        if (remove) {
            // remove language itself
            const updatedLanguages = deepClone(translationsData.languages).filter(l => l.code !== code);
            // remove translations for language
            const updatedTranslations: Translations = {};
            Object.keys(translationsData.translations).map(translationKey => {
                const updatedTranslation: Translation = {};
                Object.keys(translationsData.translations[translationKey]).map(languageId => {
                    if (languageId !== code) {
                        updatedTranslation[languageId] = translationsData.translations[translationKey][languageId];
                    }
                });
                updatedTranslations[translationKey] = updatedTranslation;
            });

            updateTranslationsData({
                ...translationsData,
                languages: updatedLanguages,
                translations: updatedTranslations,
            });
        }
    };

    const onChangeTranslationId = (oldId: string, newId: string): void => {
        const updatedTranslations: Translations = {};
        const cleanedNewId = newId.replace(/[^A-Za-z0-9]/g, '');
        if (!Object.keys(translationsData.translations).includes(cleanedNewId)) {
            Object.keys(translationsData.translations).map(key => {
                const keyToUse = (key === oldId) ? cleanedNewId : key;
                updatedTranslations[keyToUse] = translationsData.translations[key];
            });

            // TODO: do not sort translations on the fly because that messes with a user's typing
            // Instead, offer a button to trigger sorting
            /*
            updatedTranslations = window.electronVesCore.sortJson(updatedTranslations, {
                depth: 1,
                ignoreCase: true,
            });
            */

            updateTranslationsData({
                ...translationsData,
                translations: updatedTranslations
            });
        }
    };

    const onChangeTranslation = (id: string, languageCode: string, translation: string): void => {
        updateTranslationsData({
            ...translationsData,
            translations: {
                ...translationsData.translations,
                [id]: {
                    ...translationsData.translations[id],
                    [languageCode]: translation,
                }
            }
        });
    };

    const addTranslation = (): void => {
        const updatedTranslations = { ...translationsData.translations };
        updatedTranslations[''] = {};

        updateTranslationsData({
            ...translationsData,
            translations: updatedTranslations
        });
    };

    const removeTranslation = async (id: string): Promise<void> => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/editors/translations/deleteTranslationQuestion', 'Delete Translation?'),
            msg: nls.localize('vuengine/editors/translations/areYouSureYouWantToDelete', 'Are you sure you want to delete {0}?', id),
        });
        const remove = await dialog.open();
        if (remove) {
            const updatedTranslations = Object.fromEntries(
                Object.entries({ ...translationsData.translations })
                    .filter(([i]) => i !== id)
            );

            updateTranslationsData({
                ...translationsData,
                translations: updatedTranslations
            });
        }
    };

    const moveLanguage = (from: number, to: number): void => {
        const updatedLanguages = deepClone(translationsData.languages);
        const removedLanguage = updatedLanguages.splice(from, 1).pop();
        updatedLanguages.splice(to > from ? to - 1 : to, 0, removedLanguage!);

        updateTranslationsData({
            ...translationsData,
            languages: updatedLanguages
        });
    };

    return (
        <div className='translationsEditor'>
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
                    languages={languages}
                    addLanguage={addLanguage}
                    removeLanguage={removeLanguage}
                    moveLanguage={moveLanguage}
                    onChangeLanguage={onChangeLanguage}
                    onChangeFlag={onChangeFlag}
                    onChangeLocalizedName={onChangeLocalizedName}
                />
            </div>

            <br />
            <div>
                <h3>
                    {nls.localize('vuengine/editors/translations/translations', 'Translations')}
                </h3>
                <TranslationsTable
                    languages={languages}
                    translations={translations}
                    addTranslation={addTranslation}
                    removeTranslation={removeTranslation}
                    onChangeTranslationId={onChangeTranslationId}
                    onChangeTranslation={onChangeTranslation}
                />
            </div>

            <br />
            {
                combinedTranslations && Object.values(combinedTranslations).map((c, i) => c._contributor !== 'project' &&
                    <div key={`extra-translations-${i}`}>
                        <h3>
                            {c._contributor.replace('plugin:', '')}
                        </h3>
                        <TranslationsTable
                            addable={false}
                            removeable={false}
                            editIds={false}
                            editTranslations={false}
                            languages={languages}
                            translations={c.translations}
                            addTranslation={addTranslation}
                            removeTranslation={removeTranslation}
                            onChangeTranslationId={onChangeTranslationId}
                            onChangeTranslation={onChangeTranslation}
                        />
                    </div>
                )
            }
        </div>
    );
}
