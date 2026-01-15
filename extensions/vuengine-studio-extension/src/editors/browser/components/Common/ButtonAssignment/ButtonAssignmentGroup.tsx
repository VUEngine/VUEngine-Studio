import React, { PropsWithChildren } from 'react';
import styled from 'styled-components';

const StyledButtonAssignmentGroup = styled.div`
    display: table;
`;
export default function ButtonAssignmentGroup(props: PropsWithChildren): React.JSX.Element {
    const { children } = props;

    return (
        <StyledButtonAssignmentGroup>
            {children}
        </StyledButtonAssignmentGroup>
    );
}
