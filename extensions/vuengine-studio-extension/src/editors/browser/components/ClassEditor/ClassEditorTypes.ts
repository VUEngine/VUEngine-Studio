import { createContext } from 'react';
import { ScriptedActionData, ScriptType } from './Scripts/ScriptTypes';

export interface ClassData {
    methods: ScriptData[]
}

export interface ClassEditorContextType {
    data: ClassData
    setData: (partialData: Partial<ClassData>) => Promise<void>
    currentComponent: string
}

// @ts-ignore
export const ClassEditorContext = createContext<ClassEditorContextType>({});

export const MIN_PREVIEW_SCRIPT_ZOOM = 0.1;
export const MAX_PREVIEW_SCRIPT_ZOOM = 1;

export interface ScriptData {
    name: string
    type: ScriptType
    script: ScriptedActionData[]
}
