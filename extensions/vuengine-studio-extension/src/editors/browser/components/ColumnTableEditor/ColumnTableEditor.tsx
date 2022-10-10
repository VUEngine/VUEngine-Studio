import React from 'react';
import { ColumnTableData } from './ColumnTableTypes';

interface ColumnTableProps {
    data: ColumnTableData
    updateData: (data: ColumnTableData) => void
}

interface ColumnTableState {
}

export default class ColumnTableEditor extends React.Component<ColumnTableProps, ColumnTableState> {
    constructor(props: ColumnTableProps) {
        super(props);
        this.state = {
        };
    }

    render(): JSX.Element {
        return <div className='columnTableEditor'>
            Hello World
        </div >;
    }
}
