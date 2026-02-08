import { Trash } from '@phosphor-icons/react';
import { Disposable, PreferenceScope, PreferenceService, nls } from '@theia/core';
import { ConfirmDialog, HoverService, OpenerService } from '@theia/core/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileChangesEvent } from '@theia/filesystem/lib/common/files';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import AdvancedSelect from '../../../editors/browser/components/Common/Base/AdvancedSelect';
import HContainer from '../../../editors/browser/components/Common/Base/HContainer';
import Input from '../../../editors/browser/components/Common/Base/Input';
import VContainer from '../../../editors/browser/components/Common/Base/VContainer';
import InfoLabel from '../../../editors/browser/components/Common/InfoLabel';
import { VesBuildPreferenceIds } from '../ves-build-preferences';
import { VesBuildService } from '../ves-build-service';
import { BuildArchiveFrequency } from '../ves-build-types';

interface BuildArchiveProps {
    fileService: FileService
    hoverService: HoverService
    openerService: OpenerService
    preferenceService: PreferenceService
    vesBuildService: VesBuildService
}

const BuildArchiveWrapper = styled.div`
    border-top: 1px solid var(--theia-activityBar-background);
    display: flex;
    flex-direction: column;
    overflow: hidden;
`;

const BuildArchiveOverview = styled.div`
    border-bottom: 1px solid var(--theia-activityBar-background);
    cursor: pointer;
    padding: calc(var(--theia-ui-padding) * 2);
    position: relative;
`;

const BuildArchiveToggleIcon = styled.div`
    position: absolute;
    right: calc(var(--theia-ui-padding) * 2);
    top: calc(50% - 5px);
`;

const BuildArchiveEmpty = styled.div`
    font-style: italic;
    opacity: 0.5;
`;

const BuildArchiveOptions = styled.div`
    border-bottom: 1px solid var(--theia-activityBar-background);
    padding: calc(var(--theia-ui-padding) * 2);
`;

const BuildArchiveList = styled.div`
    flex-grow: 1;
    overflow: auto;
    padding: calc(var(--theia-ui-padding) * 2);
`;

const BuildArchiveFile = styled.div`
    border-radius: 2px;
    cursor: pointer;
    display: flex;
    gap: 10px;
    padding: 2px 3px;

    button {
        visibility: hidden;
    }

    &:hover {
        background-color: rgba(255, 255, 255, .1);

        body.theia-light &,
        body.theia-hc & {
            background-color: rgba(0, 0, 0, .1);
        }

        button {
            visibility: visible;
        }
    }
`;

const BuildArchiveFileName = styled.div`
    flex-grow: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const BuildArchiveFileActions = styled.div`
    display: flex;
    gap: 3px;
`;

const BuildArchiveActions = styled.div`
    padding-top: calc(var(--theia-ui-padding) * 2);
`;

export default function BuildArchive(props: BuildArchiveProps): React.JSX.Element {
    const { fileService, hoverService, openerService, preferenceService, vesBuildService } = props;
    const [panelExpanded, setPanelExpanded] = useState<boolean>(false);
    const [buildArchiveEnabled, setBuildArchiveEnabled] = useState<boolean>(preferenceService.get(VesBuildPreferenceIds.BUILD_ARCHIVE_ENABLE, false));
    const [buildArchiveFrequency, setBuildArchiveFrequency] = useState<BuildArchiveFrequency>(
        preferenceService.get(VesBuildPreferenceIds.BUILD_ARCHIVE_FREQUENCY, BuildArchiveFrequency.ALL)
    );
    const [buildArchiveRetention, setBuildArchiveRetention] = useState<number>(preferenceService.get(VesBuildPreferenceIds.BUILD_ARCHIVE_RETENTION, 14));
    const [archiveFiles, setArchiveFiles] = useState<string[]>([]);
    const [fileWatcherDisposable, setFileWatcherDisposable] = useState<Disposable>();

    const getArchivedFiles = async () => {
        setArchiveFiles(await vesBuildService.getBuildArchiveFiles());
    };

    const setFileWatcher = async () => {
        const archiveFolderUri = await vesBuildService.getBuildArchiveUri();
        if (!archiveFolderUri) {
            return archiveFolderUri;
        }
        const watcher = fileService.onDidFilesChange(async (fileChangesEvent: FileChangesEvent) => {
            fileChangesEvent.changes.map(change => {
                if (archiveFolderUri.isEqualOrParent(change.resource)) {
                    getArchivedFiles();
                }
            });
        });
        setFileWatcherDisposable(watcher);
    };

    const openRom = async (filename: string) => {
        const archiveFolderUri = await vesBuildService.getBuildArchiveUri();
        if (!archiveFolderUri) {
            return;
        }

        const romUri = archiveFolderUri.resolve(filename);
        const opener = await openerService.getOpener(romUri);
        await opener.open(romUri);
    };

    const deleteRom = async (filename: string) => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/build/deleteRom', 'Delete ROM'),
            msg: nls.localize('vuengine/build/areYouSureYouWantToDeleteRom', 'Are you sure you want to delete {0}?', filename),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            const archiveFolderUri = await vesBuildService.getBuildArchiveUri();
            if (!archiveFolderUri) {
                return;
            }

            const romUri = archiveFolderUri.resolve(filename);
            return fileService.delete(romUri);
        }
    };

    const clearArchive = async () => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/build/cleanBuildArchive', 'Clean Build Archive'),
            msg: nls.localize('vuengine/build/areYouSureYouWantToCleanBuildArchive', 'Are you sure you want to remove all archived ROMs?'),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            const archiveFolderUri = await vesBuildService.getBuildArchiveUri();
            if (!archiveFolderUri) {
                return;
            }

            setPanelExpanded(false);
            return fileService.delete(archiveFolderUri, { recursive: true });
        }
    };

    useEffect(() => {
        const preflistener = preferenceService.onPreferenceChanged(change => {
            if (change.preferenceName === VesBuildPreferenceIds.BUILD_ARCHIVE_ENABLE) {
                setBuildArchiveEnabled(preferenceService.get(VesBuildPreferenceIds.BUILD_ARCHIVE_ENABLE) as boolean);
            } else if (change.preferenceName === VesBuildPreferenceIds.BUILD_ARCHIVE_FREQUENCY) {
                setBuildArchiveFrequency(preferenceService.get(VesBuildPreferenceIds.BUILD_ARCHIVE_FREQUENCY) as BuildArchiveFrequency);
            } else if (change.preferenceName === VesBuildPreferenceIds.BUILD_ARCHIVE_RETENTION) {
                setBuildArchiveRetention(preferenceService.get(VesBuildPreferenceIds.BUILD_ARCHIVE_RETENTION) as number);
            }
        });
        return () => preflistener.dispose();
    }, [preferenceService]);

    useEffect(() => {
        getArchivedFiles();
        setFileWatcher();

        return () => fileWatcherDisposable?.dispose();
    }, [fileService]);

    return <BuildArchiveWrapper>
        <BuildArchiveOverview onClick={() => setPanelExpanded(!panelExpanded)}>
            <BuildArchiveToggleIcon className={`fa fa-chevron-${panelExpanded ? 'down' : 'left'}`} />
            <div>
                {nls.localize('vuengine/build/archivedRoms', 'Archived ROMs')}: {archiveFiles.length} ({buildArchiveEnabled
                    ? nls.localizeByDefault('Enabled')
                    : nls.localizeByDefault('Disabled')})
            </div>
            <div>
                {nls.localize('vuengine/build/retention', 'Retention')}
                {': '}
                {buildArchiveRetention > 0 ? `${buildArchiveRetention} ${nls.localize('vuengine/general/days', 'Days')}` : nls.localize('vuengine/general/unlimited', 'Unlimited')}
            </div>
        </BuildArchiveOverview>
        {panelExpanded && <>
            <BuildArchiveOptions>
                <HContainer gap={20}>
                    <VContainer>
                        <InfoLabel
                            label={nls.localizeByDefault('Enable')}
                            tooltip={nls.localize('vuengine/build/preferences/buildArchiveEnableDescription', 'Copy all built ROM files into an archive in the build folder.')}
                            hoverService={hoverService}
                        />
                        <input
                            type="checkbox"
                            checked={buildArchiveEnabled}
                            onChange={() => preferenceService.set(VesBuildPreferenceIds.BUILD_ARCHIVE_ENABLE, !buildArchiveEnabled, PreferenceScope.User)}
                        />
                    </VContainer>
                    <VContainer>
                        <InfoLabel
                            label={nls.localize('vuengine/build/frequency', 'Frequency')}
                            tooltip={nls.localize('vuengine/build/preferences/buildArchiveFrequencyDescription', 'Whether to archive all ROMs, or only one per hour or day.')}
                            hoverService={hoverService}
                        />
                        <AdvancedSelect
                            defaultValue={buildArchiveFrequency}
                            onChange={f => preferenceService.set(VesBuildPreferenceIds.BUILD_ARCHIVE_FREQUENCY, f[0] as BuildArchiveFrequency, PreferenceScope.User)}
                            options={[{
                                value: BuildArchiveFrequency.ALL,
                                label: nls.localize('vuengine/build/preferences/buildArchiveFrequencyAll', 'All'),
                            }, {
                                value: BuildArchiveFrequency.DAY,
                                label: nls.localize('vuengine/build/preferences/buildArchiveFrequencyDay', 'Day'),
                            }, {
                                value: BuildArchiveFrequency.HOUR,
                                label: nls.localize('vuengine/build/preferences/buildArchiveFrequencyHour', 'Hour'),
                            }]}
                        />
                    </VContainer>
                    <VContainer>
                        <InfoLabel
                            label={nls.localize('vuengine/build/retention', 'Retention')}
                            tooltip={nls.localize(
                                'vuengine/build/preferences/buildArchiveRetentionDescription',
                                'Defines for how many days ROM files are stored in the archive. \
When a new ROM file gets stored, all ROM files older than the retention period get deleted. A value of 0 means unlimited.'
                            )}
                            hoverService={hoverService}
                        />
                        <Input
                            type="number"
                            value={buildArchiveRetention}
                            setValue={v => preferenceService.set(VesBuildPreferenceIds.BUILD_ARCHIVE_RETENTION, v as number, PreferenceScope.User)}
                        />
                    </VContainer>
                </HContainer>
            </BuildArchiveOptions>
            <BuildArchiveList>
                {archiveFiles.length === 0
                    ? <BuildArchiveEmpty>
                        {nls.localize('vuengine/build/buildArchiveEmpty', 'No ROM files have been archived, yet.')}
                    </BuildArchiveEmpty>
                    : <>{archiveFiles.map(af =>
                        <BuildArchiveFile key={af}>
                            <BuildArchiveFileName onClick={() => openRom(af)}>
                                {af}
                            </BuildArchiveFileName>
                            <BuildArchiveFileActions>
                                <button
                                    className='theia-button secondary small'
                                    onClick={() => deleteRom(af)}
                                >
                                    <Trash />
                                </button>
                            </BuildArchiveFileActions>
                        </BuildArchiveFile>
                    )}
                        <BuildArchiveActions>
                            <button
                                className='theia-button secondary full-width'
                                onClick={clearArchive}
                            >
                                <Trash />
                            </button>
                        </BuildArchiveActions>
                    </>
                }
            </BuildArchiveList>
        </>}
    </BuildArchiveWrapper>;
}
