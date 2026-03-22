import { nls } from '@theia/core';
import { WorkspaceCommands } from '@theia/workspace/lib/browser';
import React from 'react';
import styled from 'styled-components';
import { VesBuildCommands } from '../../../build/browser/ves-build-commands';
import { BuildResult, BuildStatus } from '../../../build/browser/ves-build-types';
import { VesCommonService } from '../../../core/browser/ves-common-service';
import { EmulatorCommands } from '../../../emulator/browser/ves-emulator-commands';
import { VesExportCommands } from '../../../export/browser/ves-export-commands';
import { VesFlashCartCommands } from '../../../flash-cart/browser/ves-flash-cart-commands';
import { VesProjectCommands } from '../../../project/browser/ves-project-commands';

const StyledActionButton = styled.button`
    align-items: center;
    -webkit-app-region: no-drag;
    background-color: transparent;
    border: 1px solid rgba(255, 255, 255, .3);
    border-radius: 5px;
    color: var(--theia-titleBar-activeForeground);
    cursor: pointer;
    display: flex;
    font-size: 17px;
    height: calc(var(--theia-private-menubar-height) - 7px);
    justify-content: center;
    line-height: calc(var(--theia-private-menubar-height) - 7px);
    min-width: calc(var(--theia-private-menubar-height) - 7px);
    outline-width: 0 !important;
    padding: 0;
    position: relative;
    -webkit-user-drag: none;

    i {
        line-height: 16px;
        width: 16px;
    }

    &:enabled.active,
    &:enabled:focus,
    &:enabled:hover {
        background-color: rgba(255, 255, 255, .3);
    }

    &:disabled {
        cursor: unset;
        opacity: .3;
    }

    &.build {
        min-width: 72px;

        /*
        &.success {
            background-color: var(--theia-editorSuccess-foreground);
        }
        */
        &.warning {
            background-color: var(--theia-editorWarning-foreground);
        }
        &.error {
            background-color: var(--theia-editorError-foreground);
        }
    }

    &.queued {
        animation-name: pulseQueued;
        animation-duration: 2s;
        animation-iteration-count: infinite;
    }

    @keyframes pulseQueued {
        0% {
            background-color: rgba(255, 255, 255, .3);
        }
        50% {
            background-color: rgba(255, 255, 255, .5);
        }
        100% {
            background-color: rgba(255, 255, 255, .3);
        }
    }
`;

const StyledActionButtonWithSubMenu = styled(StyledActionButton)`
    > div {
        align-items: center;
        display: flex;
        height: 100%;
        justify-content: center;
        position: absolute;
        right: 0;

        i.codicon {
            font-size: 70%;
        }

        &:hover {
            background-color: rgba(255, 255, 255, .3);
        }
    }
`;

interface ActionButtonsProps {
    isWorkspaceOpened: boolean;
    hasWarnings: boolean;
    buildStatus: BuildStatus
    buildIsQueued: boolean
    runIsQueued: boolean
    flashIsQueued: boolean
    isFlashing: boolean
    flashingProgress: number
    hasConnectedFlashCarts: boolean
    isCleaning: boolean
    romExists: boolean
    createNewProject: () => void
    openWorkspaceFile: () => void
    build: () => void
    run: () => void
    flash: () => void
    exportRom: () => void
    clean: () => void
    openBuildMenu: () => void
    vesCommonService: VesCommonService
}

export default function ActionButtons(props: ActionButtonsProps): React.JSX.Element {
    const {
        isWorkspaceOpened,
        hasWarnings,
        buildStatus,
        buildIsQueued, runIsQueued, flashIsQueued,
        isFlashing, flashingProgress, hasConnectedFlashCarts,
        isCleaning,
        romExists,
        createNewProject, openWorkspaceFile,
        build, run, flash, exportRom, clean,
        openBuildMenu,
        vesCommonService,
    } = props;

    const progressBarColor = hasWarnings
        ? 'var(--theia-editorWarning-foreground)'
        : 'var(--theia-progressBar-background)';

    return !isWorkspaceOpened
        ? <>
            <StyledActionButton
                className='open-workspace'
                title={nls.localize('vuengine/projects/commands/openProject', 'Open Project...') +
                    vesCommonService.getKeybindingLabel(WorkspaceCommands.OPEN_WORKSPACE.id, true)}
                onClick={openWorkspaceFile}
            >
                <i className='fa fa-file-code-o'></i>
            </StyledActionButton>
            <StyledActionButton
                className='new-project'
                title={nls.localize('vuengine/projects/commands/newProject', 'New Project') +
                    vesCommonService.getKeybindingLabel(VesProjectCommands.NEW.id, true)}
                onClick={createNewProject}
            >
                <i className='fa fa-plus'></i>
            </StyledActionButton>
        </>
        : <>
            <StyledActionButtonWithSubMenu
                className={'build' + (buildIsQueued
                    ? ' queued'
                    : buildStatus.active
                        ? ' active'
                        : (buildStatus.step === BuildResult.done as string)
                            ? ' success'
                            : (buildStatus.step === BuildResult.failed as string)
                                ? ' error'
                                : '')}
                style={buildStatus.active ? {
                    backgroundImage: `linear-gradient(
                            90deg,
                            ${progressBarColor} 0%,
                            ${progressBarColor} ${buildStatus.progress}%,
                            rgba(255, 255, 255, .5) ${buildStatus.progress}%)`
                } : {}}
                title={buildStatus.active
                    ? `${nls.localize('vuengine/build/building', 'Building')}... ${buildStatus.progress}%`
                    : `${VesBuildCommands.BUILD.label}${vesCommonService.getKeybindingLabel(VesBuildCommands.BUILD.id, true)}`}
                onClick={build}
            >
                {buildIsQueued
                    ? <i className='fa fa-hourglass-half'></i>
                    : buildStatus.active
                        ? <i className='fa fa-cog fa-spin'></i>
                        : <i className='codicon codicon-symbol-property'></i>}
                <div onClick={openBuildMenu}>
                    <i className='codicon codicon-chevron-down'></i>
                </div>
            </StyledActionButtonWithSubMenu>
            <StyledActionButton
                className={'run' + (runIsQueued ? ' queued' : '')}
                title={runIsQueued
                    ? `${nls.localize('vuengine/emulator/runQueued', 'Run Queued')}...`
                    : `${EmulatorCommands.RUN.label}${vesCommonService.getKeybindingLabel(EmulatorCommands.RUN.id, true)}`}
                onClick={run}
            >
                {runIsQueued
                    ? <i className='fa fa-hourglass-half'></i>
                    : <i className='codicon codicon-run'></i>}
            </StyledActionButton>
            <StyledActionButton
                className={'flash' + (flashIsQueued ? ' queued' : '') + (isFlashing ? ' active' : '')}
                style={isFlashing ? {
                    backgroundImage: 'linear-gradient(90deg, var(--theia-progressBar-background) 0%, var(--theia-progressBar-background) '
                        + flashingProgress + '%, rgba(255, 255, 255, .5) ' + flashingProgress + '%)'
                } : {}}
                title={flashIsQueued
                    ? `${nls.localize('vuengine/flashCarts/flashingQueued', 'Flashing Queued')}...`
                    : isFlashing
                        ? `Flashing... ${flashingProgress}%`
                        : `${VesFlashCartCommands.FLASH.label}${vesCommonService.getKeybindingLabel(VesFlashCartCommands.FLASH.id, true)}`}
                disabled={!hasConnectedFlashCarts}
                onClick={flash}
            >
                {flashIsQueued
                    ? <i className='fa fa-hourglass-half'></i>
                    : isFlashing
                        ? <i className='fa fa-cog fa-spin'></i>
                        : <i className='codicon codicon-chip'></i>}
            </StyledActionButton>
            <StyledActionButton
                className="export"
                title={`${VesExportCommands.EXPORT.label}${vesCommonService.getKeybindingLabel(VesExportCommands.EXPORT.id, true)}`}
                disabled={!romExists || buildStatus.active}
                onClick={exportRom}
            >
                <i className='codicon codicon-desktop-download'></i>
            </StyledActionButton>
            <StyledActionButton
                className={'clean' + (isCleaning ? ' active' : '')}
                title={isCleaning ? 'Cleaning...' : `${VesBuildCommands.CLEAN.label}${vesCommonService.getKeybindingLabel(VesBuildCommands.CLEAN.id, true)}`}
                disabled={buildStatus.active}
                onClick={clean}
            >
                {isCleaning
                    ? <i className='fa fa-cog fa-spin'></i>
                    : <i className='codicon codicon-trash'></i>}
            </StyledActionButton>
        </>;
}
