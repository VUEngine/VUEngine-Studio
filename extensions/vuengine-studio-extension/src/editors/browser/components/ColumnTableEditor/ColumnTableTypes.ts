export interface ColumnTableData {
    name: string
    description: string
    mirror: boolean
    values: ColumnTableEntry[]
}

export interface ColumnTableEntry {
    repeat: number
    time: number
}
