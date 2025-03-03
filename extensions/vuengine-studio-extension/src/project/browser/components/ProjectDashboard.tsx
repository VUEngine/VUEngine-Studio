/* eslint-disable no-null/no-null */
import { PuzzlePiece } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { ArcherContainer } from 'react-archer';
import { ArcherContainerHandle } from 'react-archer/lib/ArcherContainer/ArcherContainer.types';
import { ControlPosition } from 'react-draggable';
import styled from 'styled-components';
import { WHEEL_SENSITIVITY } from '../../../editors/browser/components/ActorEditor/ActorEditorTypes';
import VContainer from '../../../editors/browser/components/Common/Base/VContainer';
import Sidebar from '../../../editors/browser/components/Common/Editor/Sidebar';
import { EditorsContext, EditorsContextType } from '../../../editors/browser/ves-editors-types';
import { GameConfig } from '../ves-project-types';
import ProjectSettings from './ProjectSettings';
import StagePreview, { MOCK_STAGES } from './StagePreview';
import StageSettings from './StageSettings';

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
// const ZOOM_STEP = 0.5;

const EmptyContainer = styled.div`
    align-items: center;
    color: var(--theia-dropdown-border);
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    gap: 5px;
    inset: 0;
    justify-content: center;
    position: absolute;
`;

const DashboardContainer = styled.div`
    align-items: end;
    overflow: hidden !important;

    > div:first-child {
        inset: 0;
        overflow: auto;
        position: absolute !important;

        > svg {
            box-sizing: border-box;
            opacity: .5;
            overflow: visible;
            z-index: 10;
        }
    }

    body.theia-light & {
        > div:first-child {
            > svg {
                opacity: 1;
            }
        }
    }
`;

export const ShowSidebarButton = styled.button`
    right: calc(var(--padding) + 4px);
    position: absolute;
    top: calc(var(--padding) + 4px);
    transition: all .1s;
    width: 32px;
    z-index: 100;
`;

export const HideSidebarButton = styled.button`
    padding: 0;
    position: absolute;
    right: 3px;
    top: 3px;
    width: 32px;
    z-index: 100;
`;

export default function ProjectDashboard(): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const archerRef = useRef<ArcherContainerHandle>(null);
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
    const [currentStage, setCurrentStage] = useState<string>('');
    const [scale, setScale] = useState<number>(1);
    const [previewMode, setPreviewMode] = useState<boolean>(false);
    const [gameConfig, setGameConfig] = useState<GameConfig>();
    const [dragContainerHeight, setDragContainerHeight] = useState<number>(0);
    const [dragContainerWidth, setDragContainerWidth] = useState<number>(0);

    const onWheel = (e: React.WheelEvent): void => {
        if (e.ctrlKey) {
            let z = scale - e.deltaY / WHEEL_SENSITIVITY;

            if (z > ZOOM_MAX) {
                z = ZOOM_MAX;
            } else if (z < ZOOM_MIN) {
                z = ZOOM_MIN;
            }

            setScale(z);
        }
    };

    const addStage = async () => {
        const dialog = new ConfirmDialog({
            title: 'Activate Preview',
            msg: 'Sorry, a stage editor has not yet been implemented. \n\
                You will need to manually create stages for now, consult the documentation for help. \n\
                Do you want to enable a preview of the dashboard with mocked data?'
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            setPreviewMode(true);
        }
    };

    const getDashboardConfig = async () => {
        const gc = await services.vesProjectService.getGameConfig();
        setGameConfig({
            ...gc,
            _fileUri: undefined,
            _contributor: undefined,
            _contributorUri: undefined,
        } as GameConfig);
    };

    const updateGameConfig = async (partialGameConfig: Partial<GameConfig>) => {
        services.vesProjectService.setGameConfig(partialGameConfig);
        setGameConfig(prev => ({
            ...prev as GameConfig,
            ...partialGameConfig,
        }));
    };

    const determineDragContainerDimensions = () => {
        let height = 0;
        let width = 0;

        Object.values(MOCK_STAGES).forEach(s => {
            const position = gameConfig?.dashboard?.positions && gameConfig?.dashboard?.positions[s._id]
                ? gameConfig?.dashboard?.positions[s._id]
                : { x: 0, y: 0 };
            const stageMaxX = s.width + position.x;
            const stageMaxY = s.height + position.y;
            if (stageMaxX > width) {
                width = stageMaxX;
            }
            if (stageMaxY > height) {
                height = stageMaxY;
            }
        });

        const outerPadding = 32 * 2;
        setDragContainerHeight(height + outerPadding);
        setDragContainerWidth(width + outerPadding);
    };

    useEffect(() => {
        getDashboardConfig();
    }, []);

    useEffect(() => {
        determineDragContainerDimensions();
    }, [gameConfig]);

    return (
        <>
            {gameConfig &&
                <DashboardContainer
                    onWheel={onWheel}
                >
                    {previewMode && Object.keys(MOCK_STAGES).length > 0
                        ? <ArcherContainer
                            ref={archerRef}
                            lineStyle="straight"
                            offset={-8}
                            strokeColor="var(--theia-foreground)"
                            strokeWidth={2}
                        >
                            <div
                                style={{
                                    backgroundImage:
                                        `radial-gradient(rgba(0, 0, 0, .${services.themeService.getCurrentTheme().type === 'light' ? 1 : 5}) ${scale}px, transparent 0)`,
                                    backgroundPosition: `${8 * scale}px ${8 * scale}px`,
                                    backgroundSize: `${16 * scale}px ${16 * scale}px`,
                                    height: dragContainerHeight * scale,
                                    minHeight: '100%',
                                    minWidth: '100%',
                                    width: dragContainerWidth * scale,
                                }}
                                onClick={() => setCurrentStage('')}
                            >
                                {Object.values(MOCK_STAGES).map(s => (
                                    <StagePreview
                                        key={s._id}
                                        id={s._id}
                                        archerRef={archerRef}
                                        stage={MOCK_STAGES[s._id]}
                                        positions={gameConfig.dashboard?.positions}
                                        setPosition={(p: ControlPosition) => {
                                            const partialGameConfig = {
                                                dashboard: {
                                                    ...(gameConfig.dashboard ?? {}),
                                                    positions: {
                                                        ...(gameConfig.dashboard?.positions ?? {}),
                                                        [s._id]: p,
                                                    }
                                                }
                                            };

                                            const newGameConfig = { ...gameConfig, ...partialGameConfig };
                                            if (JSON.stringify(newGameConfig) !== JSON.stringify(gameConfig)) {
                                                setGameConfig({ ...gameConfig, ...partialGameConfig });
                                                services.vesProjectService.setGameConfig(partialGameConfig);
                                            }
                                        }}
                                        current={s._id === currentStage}
                                        scale={scale}
                                        onClick={e => {
                                            setCurrentStage(s._id);
                                            console.log('setCurrentStage(s._id)', s._id);
                                            e.stopPropagation();
                                        }}
                                        relations={s.targets.map((t: any) => ({
                                            targetId: t.id,
                                            style: {
                                                strokeDasharray: t.type === 'pause' ? '4,4' : undefined
                                            }
                                        }))}
                                    />
                                ))}
                            </div>
                        </ArcherContainer>
                        : <>
                            <div></div>
                            <EmptyContainer>
                                <PuzzlePiece size={32} />
                                <div
                                    style={{
                                        fontSize: '160%'
                                    }}
                                >
                                    {nls.localize(
                                        'vuengine/project/projectHasNoStages',
                                        'This project does not yet have any stages',
                                    )}
                                </div>
                                <div>
                                    {nls.localize(
                                        'vuengine/project/clickBelowToAddFirstStage',
                                        'Click below to add the first stage',
                                    )}
                                </div>
                                <button
                                    className='theia-button secondary large'
                                    onClick={addStage}
                                    style={{
                                        marginTop: 20
                                    }}
                                >
                                    <i className='codicon codicon-add' /> {nls.localizeByDefault('Add')}
                                </button>
                            </EmptyContainer>
                        </>
                    }
                    {!sidebarOpen &&
                        <ShowSidebarButton
                            style={{
                                opacity: sidebarOpen ? 0 : 1,
                            }}
                            className="theia-button secondary"
                            title={nls.localize('vuengine/project/showSidebar', 'Show Sidebar')}
                            onClick={() => setSidebarOpen(true)}
                        >
                            <i className="codicon codicon-chevron-left" />
                        </ShowSidebarButton>
                    }
                    <Sidebar
                        open={sidebarOpen}
                        side='right'
                        width={320}
                    >
                        <VContainer
                            gap={15}
                            overflow="auto"
                            style={{ padding: 'calc(2 * var(--theia-ui-padding))' }}
                        >
                            <HideSidebarButton
                                className="theia-button secondary"
                                title={nls.localize('vuengine/project/hideSidebar', 'Hide Sidebar')}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <i className="codicon codicon-chevron-right" />
                            </HideSidebarButton>
                            {
                                currentStage === ''
                                    ? <ProjectSettings
                                        gameConfig={gameConfig}
                                        setGameConfig={updateGameConfig}
                                    />
                                    : <StageSettings
                                        stageId={currentStage}
                                        gameConfig={gameConfig}
                                        setGameConfig={updateGameConfig}
                                    />
                            }
                        </VContainer>
                    </Sidebar>
                </DashboardContainer >
            }
        </>
    );
}
