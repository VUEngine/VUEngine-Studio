import { CompilerConfigData } from './CompilerConfig/CompilerConfigTypes';
import { EngineConfigData } from './EngineConfig/EngineConfigTypes';
import { RomInfoData } from './RomInfo/RomInfoTypes';

export interface GameConfigData {
    dashboard: any
    plugins: any
    projectAuthor: string
    projectTitle: string
    colliderLayers: Record<string, string>
    compiler: CompilerConfigData
    engine: EngineConfigData
    events: Record<string, string>
    inGameTypes: Record<string, string>
    messages: Record<string, string>
    romInfo: RomInfoData
}
