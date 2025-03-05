import { StatusBarAlignment } from '@theia/core/lib/browser';
import React, { useContext, useEffect } from 'react';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME, EditorsContext, EditorsContextType } from '../../ves-editors-types';
import { CommonEditorCommands } from '../Common/Editor/CommonEditorCommands';
import { ActorEditorCommands } from './ActorEditorCommands';
import { ActorEditorContext, ActorEditorContextType, MAX_PREVIEW_SPRITE_ZOOM, MIN_PREVIEW_SPRITE_ZOOM, PREVIEW_SPRITE_ZOOM_STEP } from './ActorEditorTypes';

interface ActorEditorStatusProps {
    center: () => void
}

export default function ActorEditorStatus(props: ActorEditorStatusProps): React.JSX.Element {
    const { center } = props;
    const { setStatusBarItem, removeStatusBarItem } = useContext(EditorsContext) as EditorsContextType;
    const {
        previewAnaglyph,
        previewBackgroundColor,
        previewScreenFrame,
        previewZoom,
        setPreviewAnaglyph,
        setPreviewBackgroundColor,
        setPreviewScreenFrame,
        setPreviewZoom
    } = useContext(ActorEditorContext) as ActorEditorContextType;

    const boundZoom = (z: number) => {
        if (z < MIN_PREVIEW_SPRITE_ZOOM) {
            z = MIN_PREVIEW_SPRITE_ZOOM;
        } else if (z > MAX_PREVIEW_SPRITE_ZOOM) {
            z = MAX_PREVIEW_SPRITE_ZOOM;
        }
        return z;
    };

    const commandListener = (e: CustomEvent): void => {
        switch (e.detail) {
            case ActorEditorCommands.PREVIEW_BACKGROUND_NEXT.id:
                setPreviewBackgroundColor(previousValue => previousValue === 3 ? -1 : previousValue + 1);
                break;
            case CommonEditorCommands.CENTER.id:
                center();
                break;
            case ActorEditorCommands.PREVIEW_TOGGLE_ANAGLYPH.id:
                setPreviewAnaglyph(previousValue => !previousValue);
                break;
            case ActorEditorCommands.PREVIEW_TOGGLE_SCREEN_FRAME.id:
                setPreviewScreenFrame(previousValue => !previousValue);
                break;
            case CommonEditorCommands.ZOOM_IN.id:
                setPreviewZoom(previousValue => boundZoom(previousValue + PREVIEW_SPRITE_ZOOM_STEP));
                break;
            case CommonEditorCommands.ZOOM_OUT.id:
                setPreviewZoom(previousValue => boundZoom(previousValue - PREVIEW_SPRITE_ZOOM_STEP));
                break;
            case CommonEditorCommands.ZOOM_RESET.id:
                setPreviewZoom(1);
                break;
        }
    };

    const setStatusBarItems = () => {
        setStatusBarItem('ves-editors-actor-zoom-out', {
            alignment: StatusBarAlignment.RIGHT,
            priority: 9,
            text: '$(codicon-zoom-out)',
            command: CommonEditorCommands.ZOOM_OUT.id,
            tooltip: CommonEditorCommands.ZOOM_OUT.label,
            className: previewZoom <= MIN_PREVIEW_SPRITE_ZOOM ? 'disabled' : undefined,
        });
        setStatusBarItem('ves-editors-actor-zoom', {
            alignment: StatusBarAlignment.RIGHT,
            priority: 8,
            text: `${Math.round(previewZoom * 100)}%`,
            command: CommonEditorCommands.ZOOM_RESET.id,
            tooltip: CommonEditorCommands.ZOOM_RESET.label,
        });
        setStatusBarItem('ves-editors-actor-zoom-in', {
            alignment: StatusBarAlignment.RIGHT,
            priority: 7,
            text: '$(codicon-zoom-in)',
            command: CommonEditorCommands.ZOOM_IN.id,
            tooltip: CommonEditorCommands.ZOOM_IN.label,
            className: previewZoom >= MAX_PREVIEW_SPRITE_ZOOM ? 'disabled' : undefined,
        });

        setStatusBarItem('ves-editors-actor-center', {
            alignment: StatusBarAlignment.RIGHT,
            priority: 6,
            text: '$(codicon-symbol-array)',
            command: CommonEditorCommands.CENTER.id,
            tooltip: CommonEditorCommands.CENTER.label,
        });

        setStatusBarItem('ves-editors-actor-preview-screen-frame', {
            alignment: StatusBarAlignment.RIGHT,
            priority: 5,
            text: previewScreenFrame
                ? '$(codicon-eye)'
                : '$(codicon-eye-closed)',
            command: ActorEditorCommands.PREVIEW_TOGGLE_SCREEN_FRAME.id,
            tooltip: ActorEditorCommands.PREVIEW_TOGGLE_SCREEN_FRAME.label,
        });

        setStatusBarItem('ves-editors-actor-preview-anaglyph', {
            alignment: StatusBarAlignment.RIGHT,
            priority: 4,
            text: ' ',
            command: ActorEditorCommands.PREVIEW_TOGGLE_ANAGLYPH.id,
            tooltip: ActorEditorCommands.PREVIEW_TOGGLE_ANAGLYPH.label,
            className: previewAnaglyph
                ? 'is-anaglyph'
                : undefined,
        });

        setStatusBarItem('ves-editors-actor-preview-background-color', {
            alignment: StatusBarAlignment.RIGHT,
            priority: 3,
            text: ' ',
            command: ActorEditorCommands.PREVIEW_BACKGROUND_NEXT.id,
            tooltip: ActorEditorCommands.PREVIEW_BACKGROUND_NEXT.label,
            className: previewBackgroundColor >= 0 && previewBackgroundColor <= 3
                ? `background-color-${previewBackgroundColor}`
                : undefined,
        });
    };

    const removeStatusBarItems = () => {
        removeStatusBarItem('ves-editors-actor-center');
        removeStatusBarItem('ves-editors-actor-zoom-in');
        removeStatusBarItem('ves-editors-actor-zoom-out');
        removeStatusBarItem('ves-editors-actor-zoom');
        removeStatusBarItem('ves-editors-actor-preview-anaglyph');
        removeStatusBarItem('ves-editors-actor-preview-background-color');
        removeStatusBarItem('ves-editors-actor-preview-screen-frame');
    };

    useEffect(() => {
        setStatusBarItems();
        return () => {
            removeStatusBarItems();
        };
    }, [
        previewAnaglyph,
        previewBackgroundColor,
        previewScreenFrame,
        previewZoom,
    ]);

    useEffect(() => {
        document.addEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        return () => {
            document.removeEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        };
    }, []);

    return <></>;
}
