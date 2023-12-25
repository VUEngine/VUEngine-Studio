import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React from 'react';
import { ProjectFile, WithContributor } from '../../../../project/browser/ves-project-types';
import LanguagesTable from './LanguagesTable';
import { LANGUAGES, Translation, Translations, TranslationsData } from './TranslationsEditorTypes';
import TranslationsTable from './TranslationsTable';

interface TranslationsEditorProps {
    data: TranslationsData
    updateData: (data: TranslationsData) => void
    projectData: ProjectFile
}

interface TranslationsEditorState {
}

export default class TranslationsEditor extends React.Component<TranslationsEditorProps, TranslationsEditorState> {
    constructor(props: TranslationsEditorProps) {
        super(props);
        this.state = {};
    }

    protected onChangeFlag(index: number, flag: string): void {
        const updatedLanguages = [...this.props.data.languages];
        updatedLanguages[index] = {
            ...updatedLanguages[index],
            flag,
        };

        this.props.updateData({
            ...this.props.data,
            languages: updatedLanguages
        });
    };

    protected onChangeLocalizedName(index: number, localizedName: string): void {
        const updatedLanguages = [...this.props.data.languages];
        updatedLanguages[index] = {
            ...updatedLanguages[index],
            localizedName: localizedName,
        };

        this.props.updateData({
            ...this.props.data,
            languages: updatedLanguages
        });
    };

    protected onChangeLanguage(index: number, code: string): void {
        const updatedLanguages = [...this.props.data.languages];
        updatedLanguages[index] = {
            ...updatedLanguages[index],
            code: code,
            localizedName: nls.localize(`vuengine/general/languages/${code}`, LANGUAGES[code]),
            name: LANGUAGES[code],
        };

        this.props.updateData({
            ...this.props.data,
            languages: updatedLanguages
        });
    };

    protected addLanguage(): void {
        const existingLanguageCodes = this.props.data.languages.map(lang => lang.code);
        const filteredLanguageCodes = Object.keys(LANGUAGES).filter(c => !existingLanguageCodes.includes(c));
        const newLanguageCode = filteredLanguageCodes[0];

        // add language itself
        const updatedLanguages = [...this.props.data.languages];
        updatedLanguages.push({
            code: newLanguageCode,
            flag: '',
            localizedName: nls.localize(`vuengine/general/languages/${newLanguageCode}`, LANGUAGES[newLanguageCode]),
            name: LANGUAGES[newLanguageCode],
        });

        // add translations for language
        const updatedTranslations: Translations = {};
        Object.keys(this.props.data.translations).map(translationKey => {
            updatedTranslations[translationKey] = this.props.data.translations[translationKey];
            updatedTranslations[translationKey][newLanguageCode] = '';
        });

        this.props.updateData({
            ...this.props.data,
            languages: updatedLanguages,
            translations: updatedTranslations,
        });
    }

    protected async removeLanguage(code: string): Promise<void> {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/translationsEditor/deleteLanguageQuestion', 'Delete Language?'),
            msg: nls.localize(
                'vuengine/translationsEditor/areYouSureYouWantToDelete',
                'Are you sure you want to delete {0}?',
                nls.localize(`vuengine/general/languages/${code}`, LANGUAGES[code])
            ),
        });
        const remove = await dialog.open();
        if (remove) {
            // remove language itself
            const updatedLanguages = [...this.props.data.languages].filter(l => l.code !== code);
            // remove translations for language
            const updatedTranslations: Translations = {};
            Object.keys(this.props.data.translations).map(translationKey => {
                const updatedTranslation: Translation = {};
                Object.keys(this.props.data.translations[translationKey]).map(languageId => {
                    if (languageId !== code) {
                        updatedTranslation[languageId] = this.props.data.translations[translationKey][languageId];
                    }
                });
                updatedTranslations[translationKey] = updatedTranslation;
            });

            this.props.updateData({
                ...this.props.data,
                languages: updatedLanguages,
                translations: updatedTranslations,
            });
        }
    }

    protected onChangeTranslationId(oldId: string, newId: string): void {
        const updatedTranslations: Translations = {};
        const cleanedNewId = newId.replace(/[^A-Za-z0-9]/g, '');
        if (!Object.keys(this.props.data.translations).includes(cleanedNewId)) {
            Object.keys(this.props.data.translations).map(key => {
                const keyToUse = (key === oldId) ? cleanedNewId : key;
                updatedTranslations[keyToUse] = this.props.data.translations[key];
            });

            // TODO: do not sort translations on the fly because that messes with a user's typing
            // Instead, offer a button to trigger sorting
            /*
            updatedTranslations = window.electronVesCore.sortJson(updatedTranslations, {
                depth: 1,
                ignoreCase: true,
            });
            */

            this.props.updateData({
                ...this.props.data,
                translations: updatedTranslations
            });
        }
    }

    protected onChangeTranslation(id: string, languageCode: string, translation: string): void {
        this.props.updateData({
            ...this.props.data,
            translations: {
                ...this.props.data.translations,
                [id]: {
                    ...this.props.data.translations[id],
                    [languageCode]: translation,
                }
            }
        });
    }

    protected addTranslation(): void {
        const updatedTranslations = { ...this.props.data.translations };
        updatedTranslations[''] = {};

        this.props.updateData({
            ...this.props.data,
            translations: updatedTranslations
        });
    }

    protected async removeTranslation(id: string): Promise<void> {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/translationsEditor/deleteTranslationQuestion', 'Delete Translation?'),
            msg: nls.localize('vuengine/translationsEditor/areYouSureYouWantToDelete', 'Are you sure you want to delete {0}?', id),
        });
        const remove = await dialog.open();
        if (remove) {
            const updatedTranslations = { ...this.props.data.translations };
            delete updatedTranslations[id];

            this.props.updateData({
                ...this.props.data,
                translations: updatedTranslations
            });
        }
    }

    protected moveLanguage(from: number, to: number): void {
        const updatedLanguages = [...this.props.data.languages];
        const removedLanguage = updatedLanguages.splice(from, 1).pop();
        updatedLanguages.splice(to > from ? to - 1 : to, 0, removedLanguage!);

        this.props.updateData({
            ...this.props.data,
            languages: updatedLanguages
        });
    };

    render(): React.JSX.Element {
        const { languages, translations } = this.props.data;
        const combinedTranslations = this.props.projectData.combined?.items?.Translations || {} as Translations & WithContributor;

        return <div
            tabIndex={0}
            className='translationsEditor'
        >
            <div>
                <h3>
                    {nls.localize('vuengine/translationsEditor/languages', 'Languages')}
                </h3>
                <LanguagesTable
                    languages={languages}
                    addLanguage={this.addLanguage.bind(this)}
                    removeLanguage={this.removeLanguage.bind(this)}
                    moveLanguage={this.moveLanguage.bind(this)}
                    onChangeLanguage={this.onChangeLanguage.bind(this)}
                    onChangeFlag={this.onChangeFlag.bind(this)}
                    onChangeLocalizedName={this.onChangeLocalizedName.bind(this)}
                />
            </div>

            <br />
            <div>
                <h3>
                    {nls.localize('vuengine/translationsEditor/translations', 'Translations')}
                </h3>
                <TranslationsTable
                    languages={languages}
                    translations={translations}
                    addTranslation={this.addTranslation.bind(this)}
                    removeTranslation={this.removeTranslation.bind(this)}
                    onChangeTranslationId={this.onChangeTranslationId.bind(this)}
                    onChangeTranslation={this.onChangeTranslation.bind(this)}
                />
            </div>

            <br />
            {combinedTranslations && Object.values(combinedTranslations).map((c, i) => c._contributor !== 'project' &&
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
                        addTranslation={this.addTranslation.bind(this)}
                        removeTranslation={this.removeTranslation.bind(this)}
                        onChangeTranslationId={this.onChangeTranslationId.bind(this)}
                        onChangeTranslation={this.onChangeTranslation.bind(this)}
                    />
                </div>
            )}
        </div>;
    }
}
