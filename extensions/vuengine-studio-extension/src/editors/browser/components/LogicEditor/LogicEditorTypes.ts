import { createContext } from 'react';
import { ScriptedActionData, ScriptType } from './Scripts/ScriptTypes';

export interface LogicData {
    configuration: ConfigValue[]
    methods: ScriptData[]
}

export interface ScriptData {
    name: string
    type: ScriptType
    script: ScriptedActionData[]
}

export interface ConfigValue {
    name: string
    // ...
}

export interface LogicEditorContextType {
    data: LogicData
    updateData: (logicData: LogicData) => void
    currentComponent: string
    setCurrentComponent: (currentComponent: string) => void
}

// @ts-ignore
export const LogicEditorContext = createContext<LogicEditorContextType>({});

export const MIN_PREVIEW_SCRIPT_ZOOM = 0.1;
export const MAX_PREVIEW_SCRIPT_ZOOM = 2;
