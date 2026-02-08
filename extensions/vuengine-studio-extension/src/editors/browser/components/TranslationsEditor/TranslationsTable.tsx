import { nls } from '@theia/core';
import React, { useContext, useEffect, useRef, useState } from 'react';
import ReactTextareaAutosize from 'react-textarea-autosize';
import styled from 'styled-components';
import { ProjectContributor } from '../../../../project/browser/ves-project-types';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import HContainer from '../Common/Base/HContainer';
import Input from '../Common/Base/Input';
import RadioSelect from '../Common/Base/RadioSelect';
import VContainer from '../Common/Base/VContainer';
import { AllTranslationsData, Translations, TranslationsData, TranslationsWithContributors } from './TranslationsEditorTypes';
import { ConfirmDialog } from '@theia/core/lib/browser';

const StyledLangCode = styled.input`
    font-family: monospace;
    max-width: 28px;
    min-width: 28px !important;
`;

const StyledTranslationContainer = styled(HContainer)`
    border: 1px solid var(--theia-dropdown-border);
    border-radius: 2px;
    padding: 10px;

    button {
        opacity: .1;
    }

    &:focus,
    &:hover {
        border-color: var(--theia-button-background);

        button {
            opacity: 1;
        }
    }
`;

const StyledSourceLabel = styled.div`
    color: rgba(255, 255, 255, .1);
    word-break: break-all;

    body.theia-light &,
    body.theia-hc & {
        color: rgba(0, 0, 0, .1);
    }
`;

const StyledReactTextareaAutosize = styled(ReactTextareaAutosize)`
    font-family: monospace;
    line-height: 120%;
    max-width: 390px;
    padding: 5px 5px 4px;
    resize: none;
    width: 390px;
`;

interface TranslationsTableProps {
    translationsData: TranslationsData,
    updateTranslationsData: (translationsData: TranslationsData) => void,
}

export default function TranslationsTable(props: TranslationsTableProps): React.JSX.Element {
    const { translationsData, updateTranslationsData } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const [lastEditedTranslationId, setLastEditedTranslationId] = useState<string | undefined>();
    const lastEditedTranslationIdInputRef = useRef<HTMLInputElement>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [contributorsFilter, setContributorsFilter] = useState<ProjectContributor[]>([ProjectContributor.Project]);
    const [otherTranslations, setOtherTranslations] = useState<TranslationsWithContributors>({});

    const translations: TranslationsWithContributors = window.electronVesCore.sortJson({
        ...otherTranslations,
        ...Object.fromEntries(
            Object.entries(translationsData.translations)
                .map(([tId, t]) => ([
                    tId,
                    {
                        translation: t,
                        _contributor: ProjectContributor.Project,
                        _isOverriden: otherTranslations[tId] !== undefined
                    }
                ]))
        )
    }, {
        depth: 1,
        ignoreCase: true,
    });

    const getCombinedTranslations = async () => {
        await services.vesProjectService.projectDataReady;
        const allTranslationsData = services.vesProjectService.getProjectDataItemsForType('Translations') as AllTranslationsData;
        const ot: TranslationsWithContributors = {};
        if (allTranslationsData) {
            Object.values(allTranslationsData)
                .filter(t => t._contributor !== ProjectContributor.Project)
                .forEach(t => {
                    Object.keys(t.translations).forEach(k => {
                        ot[k] = {
                            translation: t.translations[k],
                            _contributor: t._contributor,
                            _isOverriden: false,
                        };
                    });
                });
        }
        setOtherTranslations(ot);
    };

    const setTranslationId = (oldId: string, newId: string): void => {
        let updatedTranslations: Translations = {};
        const cleanedNewId = newId.replace(/[^A-Za-z0-9]/g, '');
        if (!Object.keys(translationsData.translations).includes(cleanedNewId)) {
            Object.keys(translationsData.translations).map(key => {
                const keyToUse = (key === oldId) ? cleanedNewId : key;
                updatedTranslations[keyToUse] = translationsData.translations[key];
            });

            updatedTranslations = window.electronVesCore.sortJson(updatedTranslations, {
                depth: 1,
                ignoreCase: true,
            });

            setLastEditedTranslationId(newId);
            updateTranslationsData({
                ...translationsData,
                translations: updatedTranslations
            });
        }
    };

    const setTranslation = (id: string, languageCode: string, translation: string): void => {
        setLastEditedTranslationId(undefined);
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

    const addTranslation = (translation?: Translations): void => {
        let updatedTranslations = { ...translationsData.translations };
        const newIdLabel = translation
            ? Object.keys(translation)[0]
            : nls.localize('vuengine/editors/translations/newIdentifier', 'NewIdentifier');
        let newId = newIdLabel;
        let count = 2;
        while (updatedTranslations[newId] !== undefined) {
            newId = `${newIdLabel}-${count++}`;
        }
        updatedTranslations[newId] = translation
            ? Object.values(translation)[0]
            : {};

        updatedTranslations = window.electronVesCore.sortJson(updatedTranslations, {
            depth: 1,
            ignoreCase: true,
        });

        setLastEditedTranslationId(newId);
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

    useEffect(() => {
        lastEditedTranslationIdInputRef?.current?.focus();
    }, [lastEditedTranslationId]);

    useEffect(() => {
        getCombinedTranslations();
    }, []);

    return <VContainer
        gap={20}
        style={{
            maxWidth: 890,
            width: '100%',
        }}
    >
        <HContainer gap={10}>
            <RadioSelect
                options={[{
                    value: ProjectContributor.Project,
                    label: nls.localize('vuengine/editors/translations/project', 'Project'),
                }, {
                    value: ProjectContributor.Plugin,
                    label: nls.localize('vuengine/editors/translations/plugins', 'Plugins'),
                }]}
                defaultValue={contributorsFilter}
                onChange={options => setContributorsFilter(options.map(o => o.value) as ProjectContributor[])}
                canSelectMany
            />
            <Input
                value={searchTerm}
                setValue={v => setSearchTerm(v as string)}
                grow={1}
                clearable={true}
                placeholder={nls.localize('vuengine/editors/translations/enterSearchTerm', 'Enter Search Term...')}
            />
            <button
                className='theia-button secondary'
                onClick={() => addTranslation()}
                title={nls.localizeByDefault('Add')}
            >
                <i className='codicon codicon-plus' />
            </button>
        </HContainer>
        <VContainer gap={10}>
            <HContainer style={{ padding: '0 10px' }}>
                <label style={{ flexGrow: 1 }}>
                    {nls.localizeByDefault('Key')}
                </label>
                <label style={{ width: 467 }}>
                    {nls.localize('vuengine/editors/translations/translations', 'Translations')}
                </label>
            </HContainer>
            {translations && Object.keys(translations).map(translationId =>
                contributorsFilter.includes(translations[translationId]._contributor.split(':')[0] as ProjectContributor) &&
                (!searchTerm || translationId.includes(searchTerm) || Object.values(translations[translationId].translation).filter(t => t.includes(searchTerm)).length > 0) &&
                <StyledTranslationContainer
                    gap={10}
                    key={`string-key-${translationId}`}
                >
                    <VContainer grow={1} justifyContent='space-between'>
                        <Input
                            value={translationId}
                            disabled={translations[translationId]._contributor !== ProjectContributor.Project}
                            setValue={v => setTranslationId(translationId, v as string)}
                            grow={1}
                            clearable={false}
                            inputRef={lastEditedTranslationId === translationId ? lastEditedTranslationIdInputRef : undefined}
                        />
                        <StyledSourceLabel>
                            {translations[translationId]._contributor === ProjectContributor.Project
                                ? nls.localize('vuengine/editors/translations/project', 'Project')
                                : translations[translationId]._contributor.replace('plugin:', '')
                            }
                        </StyledSourceLabel>
                    </VContainer>
                    <VContainer>
                        {translationsData.languages.map(lang =>
                            <HContainer
                                key={`string-translations-${translationId}-${lang.code}`}
                            >
                                <StyledLangCode
                                    className="theia-input"
                                    value={lang.code}
                                    disabled={true}
                                />
                                <StyledReactTextareaAutosize
                                    className="theia-input"
                                    value={translations[translationId].translation[lang.code] ?? ''}
                                    disabled={translations[translationId]._contributor !== ProjectContributor.Project}
                                    maxRows={8}
                                    onChange={e => setTranslation(translationId, lang.code, e.target.value)}
                                    maxLength={48 * 28}
                                />
                            </HContainer>
                        )}
                    </VContainer>
                    <VContainer>
                        {translations[translationId]._contributor === ProjectContributor.Project && !translations[translationId]._isOverriden &&
                            <button
                                className='theia-button secondary'
                                onClick={e => removeTranslation(translationId)}
                                title={nls.localizeByDefault('Delete')}
                            >
                                <i className='codicon codicon-trash' />
                            </button>
                        }
                        {translations[translationId]._contributor === ProjectContributor.Project && translations[translationId]._isOverriden &&
                            <button
                                className='theia-button secondary'
                                onClick={e => removeTranslation(translationId)}
                                title={nls.localizeByDefault('Reset')}
                            >
                                <i className='codicon codicon-discard' />
                            </button>
                        }
                        {translations[translationId]._contributor !== ProjectContributor.Project &&
                            <button
                                className='theia-button secondary'
                                onClick={e => addTranslation({ [translationId]: translations[translationId].translation })}
                                title={nls.localize('vuengine/editors/translations/override', 'Override')}
                            >
                                <i className='codicon codicon-copy' />
                            </button>
                        }
                    </VContainer>
                </StyledTranslationContainer>
            )}
            <button
                className='theia-button add-button full-width'
                onClick={() => addTranslation()}
                style={{ height: 48 }}
                title={nls.localizeByDefault('Add')}
            >
                <i className='codicon codicon-plus' />
            </button>
        </VContainer>
    </VContainer>;
}
