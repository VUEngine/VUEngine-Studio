import { CommandService } from '@theia/core';
import { OpenerService } from '@theia/core/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import React from 'react';
import styled from 'styled-components';
import { VesWorkspaceService } from '../../../core/browser/ves-workspace-service';
import { VesProjectService } from '../ves-project-service';
import ProjectSettings from './ProjectSettings';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    flex-grow: 1;
`;

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
        <Container className='jsonforms-container'>
            <ProjectSettings
                commandService={commandService}
                fileService={fileService}
                openerService={openerService}
                vesProjectService={vesProjectService}
                workspaceService={workspaceService}
            />
        </Container>
    );
}
