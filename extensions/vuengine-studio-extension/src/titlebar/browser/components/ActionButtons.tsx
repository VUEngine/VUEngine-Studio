import { nls } from '@theia/core';
import { HoverService } from '@theia/core/lib/browser';
import React from 'react';
import styled from 'styled-components';
import { VesBuildCommands } from '../../../build/browser/ves-build-commands';
import { BuildResult, BuildStatus } from '../../../build/browser/ves-build-types';
import { VesCommonService } from '../../../core/browser/ves-common-service';
import { EmulatorCommands } from '../../../emulator/browser/ves-emulator-commands';
import { VesExportCommands } from '../../../export/browser/ves-export-commands';
import { VesFlashCartCommands } from '../../../flash-cart/browser/ves-flash-cart-commands';

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
    build: () => void
    run: () => void
    flash: () => void
    exportRom: () => void
    clean: () => void
    openBuildMenu: () => void
    vesCommonService: VesCommonService
    hoverService: HoverService
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
        build, run, flash, exportRom, clean,
        openBuildMenu,
        vesCommonService,
        hoverService,
    } = props;

    const progressBarColor = hasWarnings
        ? 'var(--theia-editorWarning-foreground)'
        : 'var(--theia-progressBar-background)';

    return isWorkspaceOpened
        ? <>
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
                onMouseEnter={event => {
                    hoverService.requestHover({
                        content: buildStatus.active
                            ? `${nls.localize('vuengine/build/building', 'Building')}... ${buildStatus.progress}%`
                            : `${VesBuildCommands.BUILD.label}${vesCommonService.getKeybindingLabel(VesBuildCommands.BUILD.id, true)}`,
                        target: event.currentTarget,
                        position: 'bottom',
                    });
                }}
                onMouseLeave={() => {
                    hoverService.cancelHover();
                }}
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
                onMouseEnter={event => {
                    hoverService.requestHover({
                        content: runIsQueued
                            ? `${nls.localize('vuengine/emulator/runQueued', 'Run Queued')}...`
                            : `${EmulatorCommands.RUN.label}${vesCommonService.getKeybindingLabel(EmulatorCommands.RUN.id, true)}`,
                        target: event.currentTarget,
                        position: 'bottom',
                    });
                }}
                onMouseLeave={() => {
                    hoverService.cancelHover();
                }}
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
                onMouseEnter={event => {
                    hoverService.requestHover({
                        content: flashIsQueued
                            ? `${nls.localize('vuengine/flashCarts/flashingQueued', 'Flashing Queued')}...`
                            : isFlashing
                                ? `Flashing... ${flashingProgress}%`
                                : `${VesFlashCartCommands.FLASH.label}${vesCommonService.getKeybindingLabel(VesFlashCartCommands.FLASH.id, true)}`,
                        target: event.currentTarget,
                        position: 'bottom',
                    });
                }}
                onMouseLeave={() => {
                    hoverService.cancelHover();
                }}
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
                onMouseEnter={event => {
                    hoverService.requestHover({
                        content: `${VesExportCommands.EXPORT.label}${vesCommonService.getKeybindingLabel(VesExportCommands.EXPORT.id, true)}`,
                        target: event.currentTarget,
                        position: 'bottom',
                    });
                }}
                onMouseLeave={() => {
                    hoverService.cancelHover();
                }}
                disabled={!romExists || buildStatus.active}
                onClick={exportRom}
            >
                <i className='codicon codicon-desktop-download'></i>
            </StyledActionButton>
            <StyledActionButton
                className={'clean' + (isCleaning ? ' active' : '')}
                onMouseEnter={event => {
                    hoverService.requestHover({
                        content: isCleaning ? 'Cleaning...' : `${VesBuildCommands.CLEAN.label}${vesCommonService.getKeybindingLabel(VesBuildCommands.CLEAN.id, true)}`,
                        target: event.currentTarget,
                        position: 'bottom',
                    });
                }}
                onMouseLeave={() => {
                    hoverService.cancelHover();
                }}
                disabled={buildStatus.active}
                onClick={clean}
            >
                {isCleaning
                    ? <i className='fa fa-cog fa-spin'></i>
                    : <i className='codicon codicon-trash'></i>}
            </StyledActionButton>
        </>
        : <></>;
}
