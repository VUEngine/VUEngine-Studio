export enum CompilerOptimization {
    O0 = 'O0',
    O1 = 'O1',
    O2 = 'O2',
    O3 = 'O3',
    Ofast = 'Ofast',
    Os = 'Os',
}

export enum DataMemorySection {
    data = '.data', // Initialized data (.data)
    sdata = '.sdata', // Small initialized data (.sdata)
    dramData = '.dram_data', // Initialized data in DRAM section (.dram_data)
    sramData = '.sram_data', // Initialized data in SRAM section (.sram_data)
}

export enum BssMemorySection {
    bss = '.bss', // Uninitialized data (.bss)
    sbss = '.sbss', // Small uninitialized data (.sbss)
    dramBss = '.dram_bss', // Uninitialized data in DRAM section (.dram_bss)
    sramBss = '.sram_bss', // Uninitialized data in SRAM section (.sram_bss)
}

export interface MemorySectionData {
    length: number
    origin: string
}

export type MemorySectionsDataKeys = 'dram' | 'exp' | 'rom' | 'sram' | 'wram';

export interface MemorySectionsData {
    dram: MemorySectionData
    exp: MemorySectionData
    rom: MemorySectionData
    sram: MemorySectionData
    wram: MemorySectionData
}

export interface CompilerConfigData {
    framePointer: boolean
    optimization: CompilerOptimization
    prologFunctions: boolean
    memorySections: MemorySectionsData
    memoryUsage: {
        initializedData: DataMemorySection
        memoryPool: BssMemorySection
        staticSingletons: BssMemorySection
        uninitializedData: BssMemorySection
        virtualTables: BssMemorySection
    }
}
