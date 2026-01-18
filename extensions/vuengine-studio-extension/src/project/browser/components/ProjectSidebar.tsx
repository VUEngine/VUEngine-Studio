import { CommandService, nls } from '@theia/core';
import { OpenerService } from '@theia/core/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import React from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { VesWorkspaceService } from '../../../core/browser/ves-workspace-service';
import { VesProjectService } from '../ves-project-service';
import AssetsTree from './AssetsTree';
import ProjectSettings from './ProjectSettings';

interface ProjectSidebarProps {
    tabIndex: number
    setTabIndex: (tab: number) => void
    allExpanded: boolean
    commandService: CommandService
    fileService: FileService
    openerService: OpenerService
    vesProjectService: VesProjectService
    workspaceService: VesWorkspaceService
}

export default function ProjectSidebar(props: ProjectSidebarProps): React.JSX.Element {
    const {
        tabIndex, setTabIndex,
        allExpanded,
        commandService, fileService, openerService, vesProjectService, workspaceService
    } = props;

    return (
        <Tabs
            selectedIndex={tabIndex}
            onSelect={setTabIndex}
            style={{ height: '100%' }}
        >
            <TabList style={{ padding: '0 calc(var(--theia-ui-padding) * 2)' }}>
                <Tab>
                    {nls.localize('vuengine/plugins/assets', 'Assets')}
                </Tab>
                <Tab>
                    {nls.localizeByDefault('Settings')}
                </Tab>
            </TabList>
            <TabPanel>
                <AssetsTree
                    allExpanded={allExpanded}
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
        </Tabs >
    );
}
