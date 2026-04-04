import { Trash } from '@phosphor-icons/react';
import { PreferenceScope, PreferenceService, nls } from '@theia/core';
import { ConfirmDialog, HoverService, OpenerService } from '@theia/core/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
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

const BuildArchiveWrapper = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
`;

const BuildArchiveEmpty = styled.div`
    font-style: italic;
    opacity: 0.5;
    padding: var(--theia-ui-padding) calc(var(--theia-ui-padding) * 2);
`;

const BuildArchiveOptions = styled.div`
    border-bottom: 1px solid var(--theia-editorGroup-border);
    padding: calc(var(--theia-ui-padding) * 2);
`;

const BuildArchiveList = styled.div`
    flex-grow: 1;
    overflow-y: auto;
`;

const BuildArchiveFile = styled.div`
    cursor: pointer;
    display: flex;
    gap: var(--theia-ui-padding);
    padding: var(--theia-ui-padding) calc(var(--theia-ui-padding) * 2);
    border-bottom: 1px solid var(--theia-editorGroup-border);

    &:last-child {
        border: none;
    }

    button {
        margin-left: 0;
        max-width: 32px;
        min-width: 32px;
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
    width: 32px;
`;

interface BuildArchiveProps {
    archiveFiles: string[]
    fileService: FileService
    hoverService: HoverService
    openerService: OpenerService
    preferenceService: PreferenceService
    vesBuildService: VesBuildService
}

export default function BuildArchive(props: BuildArchiveProps): React.JSX.Element {
    const { archiveFiles, fileService, hoverService, openerService, preferenceService, vesBuildService } = props;
    const [buildArchiveEnabled, setBuildArchiveEnabled] = useState<boolean>(preferenceService.get(VesBuildPreferenceIds.BUILD_ARCHIVE_ENABLE, false));
    const [buildArchiveFrequency, setBuildArchiveFrequency] = useState<BuildArchiveFrequency>(
        preferenceService.get(VesBuildPreferenceIds.BUILD_ARCHIVE_FREQUENCY, BuildArchiveFrequency.ALL)
    );
    const [buildArchiveRetention, setBuildArchiveRetention] = useState<number>(preferenceService.get(VesBuildPreferenceIds.BUILD_ARCHIVE_RETENTION, 14));

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

    return <BuildArchiveWrapper>
        <BuildArchiveOptions>
            <HContainer gap="calc(var(--theia-ui-padding) * 2)">
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
                <VContainer grow={1}>
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
                <VContainer grow={1}>
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
                        grow={1}
                    />
                </VContainer>
            </HContainer>
        </BuildArchiveOptions>
        <BuildArchiveList>
            {archiveFiles.length === 0
                ? <BuildArchiveEmpty>
                    {nls.localize('vuengine/build/buildArchiveEmpty', 'No ROM files have been archived, yet.')}
                </BuildArchiveEmpty>
                : archiveFiles.map(af =>
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
                )
            }
        </BuildArchiveList>
    </BuildArchiveWrapper>;
}
