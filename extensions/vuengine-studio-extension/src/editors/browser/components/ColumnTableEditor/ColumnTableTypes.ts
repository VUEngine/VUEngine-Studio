export interface ColumnTableData {
    description: string
    mirror: boolean
    values: ColumnTableEntry[]
}

export interface ColumnTableEntry {
    repeat: number
    time: number
}
