import React from 'react';
import styled from 'styled-components';
import { CompilerConfigData } from './CompilerConfigTypes';
import GeneralCompilerConfig from './GeneralCompilerConfig';
import MemorySections from './MemorySections';
import MemoryUsage from './MemoryUsage';

const StyledCompilerConfig = styled.div`
    display: flex;
    flex-direction: column;
    gap: calc(4 * var(--theia-ui-padding));
`;

interface CompilerConfigProps {
    data: CompilerConfigData
    updateData: (data: CompilerConfigData) => void
}

export default function CompilerConfig(props: CompilerConfigProps): React.JSX.Element {
    const { data, updateData } = props;

    return <StyledCompilerConfig>
        <GeneralCompilerConfig
            data={data}
            updateData={updateData}
        />
        <MemorySections
            data={data}
            updateData={updateData}
        />
        <MemoryUsage
            data={data}
            updateData={updateData}
        />
    </StyledCompilerConfig>;
}
