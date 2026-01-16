import { CommandService, nls } from '@theia/core';
import { OpenerService } from '@theia/core/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import React from 'react';
import { VesWorkspaceService } from '../../../core/browser/ves-workspace-service';
import { VesProjectService } from '../ves-project-service';
import ProjectSettings from './ProjectSettings';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import FilesTree from './AssetsTree';

interface ProjectSidebarProps {
    commandService: CommandService
    fileService: FileService
    openerService: OpenerService
    vesProjectService: VesProjectService
    workspaceService: VesWorkspaceService
}

export default function ProjectSidebar(props: ProjectSidebarProps): React.JSX.Element {
    const { commandService, fileService, openerService, vesProjectService, workspaceService } = props;

    return (
        <Tabs style={{ height: '100%' }}>
            <TabList style={{ padding: '0 calc(var(--theia-ui-padding) * 2)' }}>
                <Tab>
                    {nls.localize('vuengine/plugins/assets', 'Assets')}
                </Tab>
                <Tab>
                    {nls.localizeByDefault('Settings')}
                </Tab>
            </TabList>
            <TabPanel>
                <FilesTree
                    fileService={fileService}
                    openerService={openerService}
                    vesProjectService={vesProjectService}
                    workspaceService={workspaceService}
                />
            </TabPanel>
            <TabPanel>
                <ProjectSettings
                    commandService={commandService}
                    fileService={fileService}
                    openerService={openerService}
                    vesProjectService={vesProjectService}
                    workspaceService={workspaceService}
                />
            </TabPanel>
        </Tabs>
    );
}
