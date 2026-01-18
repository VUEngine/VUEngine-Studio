import React from 'react';
import styled from 'styled-components';
import sampleImage from '../../../../../src/editors/browser/images/vuengine-platformer-demo.png';

const StyledPreview = styled.div`
    align-items: center;
    background-color: #000;
    display: flex;
    height: 150px;
    justify-content: center;
    overflow: hidden;
    position: relative;
    width: 384px;

    > div {
        background-color: #000;
        height: 100%;
        position: relative;
        width: calc(100% / 96);
        z-index: 10;
    }

    > img {
        position: absolute;
        z-index: 1;
    }
`;

interface PreviewProps {
    mirror: boolean
    values: number[]
}

export default function Preview(props: PreviewProps): React.JSX.Element {
    const { mirror, values } = props;

    return <StyledPreview>
        <img src={sampleImage} />
        {
            [...Array(96)].map((h, y) => {
                const index = mirror && y >= 48 ? 95 - y : y;
                const brightness = values[index] ?? 1;
                return <div
                    key={`preview-row-${y}`}
                    style={{
                        opacity: 1 - (1 / 15 * brightness)
                    }}
                />;
            })
        }
    </StyledPreview>;
}
