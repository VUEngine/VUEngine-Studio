import React from 'react';
import { ArcherElement } from 'react-archer';
import { RelationType } from 'react-archer/lib/types';
import Draggable from 'react-draggable';
import styled from 'styled-components';

/* eslint-disable max-len */
export const MOCK_STAGES: { [id: string]: any } = {
    '1234': {
        _id: '1234',
        name: 'Precaution Screen',
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAYAAAADgAQMAAAAwiiMSAAAABlBMVEUAAAD/AAAb/40iAAABeElEQVR4Ae3SgcbcUBCG4QH/NczFjL2WYXmhEUC6GF9vvRK7ZSHnpBTbf1444CEjn31IXdd1Xdd1Xdd1XdfFvaLkaB5IUswD/wm4Nr8GuAB+HUD/EPwQcl0BRV0C92Rx1kuAKyDuKRyugJgHn1/JHxaEilAE5jxOgRRlgSSkEBbUKSC1mG844M5m2pYBgDfAxgRQOqQ7MjQAdYCaBirt4OZ6Ag1A5QG+vCbBkmC+4gu4sxrr8OjlAPwByzkQZYEcyUMY1Agc03AiPGIHD/vfq1I4isAqgpTiHEhSoBAmaQc6B5DoOWxYMp0x4CLIA2gHj0zPEagXqB2U1zmQKvUGbuegKlNvn/R1DnLJ17Dnjk4uAwn568dJriEIwl/TkDzsG1RSlCxK5QpiCHR0PKFAQ0AmpEEi940rgL8AyiGoKiiDOsA6BVSGSpoCZFJpVNYOmAJL7s+C+zoHOABzQEohUwo80BCUMpDFE9zsA+q6ruu6ruu6ruu67jeGdwMYby4BdwAAAABJRU5ErkJggg==',
        height: 224,
        width: 384,
        position: {
            x: 16,
            y: 16,
        }
    },
    '2345': {
        _id: '2345',
        name: 'IPD/Focus Adjustment Screen',
        image: 'data:image/png;base64,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',
        height: 224,
        width: 384,
        position: {
            x: 16,
            y: 16 + 224 + 32,
        }
    },
    '3456': {
        _id: '3456',
        name: 'Automatic Pause Selection Screen',
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAYAAAADgAQMAAAAwiiMSAAAABlBMVEUAAAD/AAAb/40iAAACJklEQVR4AezTgYczORjH8R/GAQggwAVFAcXgweM8+KEYQFFA2YqXgwIXRO7fPmBv0vf2LDO1s+xS3ucro4iPJB7FE+d5nud5nud5nhdz05fYVFFj1oYP09zaizZtaJrbBtByzH+1GDNyy/mCD8sd5DvIm8HfM7h0cPksqHXbG/5sHbSW//gUqC3/tvFKL/dHX3LO3wJabDPQNoPW2gagUTvQGejMfvW8aoAgAUgBKOhFIKEXDocFCAbwJwBA9HZvACEsQRGQRX5oOSioVEESLTwLeFgDJCoTT0zBUEgjbmTilTiFVVDB/4GRUpEqE60+AgZOiZzuYJoGQ7IpTWaPgIJjlP4pbByLIukYR1PsRQRfUcCAXurrnqEX8bB3wN6AYYe1zvLjcFZQiCIoSoGinEWJNO9h0ZWncCVIIvV1JAheySNu8x4WWT0FvgO32oFV3pBsFRg7UE53MB0NE2g2HTvgClAKFYOMiII4UjGimI6cgRCPEmzuAISlFyAAaX1sK5EA1kEJyj4ILeUsBIRyJoYJ83hYRBeAgfxvEFfu8fMX8YQ+nkRbB7wDYwDqvhoxXGdApiorV5o0UDGVYv0E25spSDBwSjYsgMk4CAeMZiYM0KA2QAQUjlHLEgByX2bbh+J5G/r99fX1n28FsX/PAwRAlBg3A3bA3W47OHeQ0nZw7eB22w64POFrgXQgHTz7pDeA5/o/eJ7neZ7neZ7neZ7374YSAACDd775lRxNbwAAAABJRU5ErkJggg==',
        height: 224,
        width: 384,
        position: {
            x: 16,
            y: 16 + 224 + 32 + 224 + 32,
        }
    },
    '4567': {
        _id: '4567',
        name: 'Language Selection Screen',
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAYAAAADgAgMAAAB3KlnCAAAADFBMVEUAAAD/AABVAACqAAD0CnovAAAB2ElEQVR4Ae3WgYbcQBzH8X8wFJAyA0ChUOgrzCMM5nZ7YQWs2kDBAvYxVgEBcZ15ny2990i04Jqfy64UwM5faX+f4Z8D85XkdkSIiIiIiIiIiIiIiIiI6P9kpfLWmmBt5U1wUQTTiou4FglgcxcRcRFbYlrBLBPAVhYQsSKCiYV7KhKwFgHQC0TMmSBgb6tkIFqILoi44IKdZ7GAi68BTARM1AisXrLY4o/IRr2XrB+4Ph5crz+06yoYMNEEzOtRgWUCAv8AIqKHG9HR5UWSD3nxbf3nvfZNzv2U8/Ao72TxRj6+LH7KvT5vXgO9VuAwdgik40Ep0O0aBJ4uSSvwdEFg16gF0rHrpzR2aoHcb/rp6yb/EXj/sPhUIDBc+unUKAbyqR0vOaf1cykY2M+7tOM8HpUCX14Wv/5WgAH1l9zlvG3HU85JLTCc+mnb5LTatWzg/L2fzpNeILU47HbdOlD0sBuOOK63z2qB7TMCw1ErcNh1CKT2oBTYTxmBfP6hFbh9thQIKH94Ffh0JCJyAdNINc9aFNQY2F4v8NabUIkRE5yX8py3dV1XUs2pula5g3oJGK8WMAEBlFT+i+q5YbzxDnegw3ghIiIiIiIiIiIiIiIiIiIq4Dd6dutg4X1WkgAAAABJRU5ErkJggg==',
        height: 224,
        width: 384,
        position: {
            x: 16,
            y: 16 + 224 + 32 + 224 + 32 + 224 + 32,
        }
    },
};
const MOCK_START_SCREEN = '1234';

const StagePreviewContainer = styled.div`
    background-color: #000;
    background-size: contain;
    border-radius: 2px;
    cursor: grab;
    display: flex;
    outline: 0px solid var(--theia-focusBorder);
    outline-offset: -1px;
    overflow: hidden;
    position: absolute;
`;

const StagePreviewInnerContainer = styled.div`
    display: flex;
    flex-grow: 1;
`;

const StagePreviewStart = styled.div`
    display: none;

    .codicon[class*='codicon-'] {
        font-size: 20px;
        margin-top: 4px;
    }

    ${StagePreviewContainer}.isStart & {
        display: flex;
    }
`;

const StagePreviewHeader = styled.div`
    align-items: center;
    background-color: rgba(0, 0, 0, .75);
    box-sizing: border-box;
    cursor: pointer;
    display: flex;
    flex-grow: 1;
    height: 40px;
    justify-content: space-between;
    overflow: hidden;
    padding: 0 calc(2 * var(--theia-ui-padding));
    visibility: hidden;

    > div {
        align-items: center;
        display: flex;
        gap: 10px;
    }

    ${StagePreviewContainer}.isStart:not(:hover) & {
        visibility: visible;
        width: 42px;
        flex-grow: 0;
        border-bottom-right-radius: 2px;
    }

    ${StagePreviewContainer}:hover & {
        visibility: visible;
    }
`;

interface StagePreviewProps {
    id: string
    current: boolean
    scale: number
    relations?: RelationType[]
    onClick?: (e: React.MouseEvent) => void
}

export default function StagePreview(props: StagePreviewProps): React.JSX.Element {
    const { id, current, scale, relations, onClick } = props;

    const stage = MOCK_STAGES[id];
    const height = stage.height * scale;
    const width = stage.width * scale;

    return (
        <Draggable
            grid={[16 * scale, 16 * scale]}
            handle=".stage"
        >
            <StagePreviewContainer
                className={id === MOCK_START_SCREEN ? 'stage isStart' : 'stage'}
                style={{
                    backgroundImage: `url("${stage.image}")`,
                    height: height,
                    outlineWidth: current ? 1 : 0,
                    left: stage.position.x,
                    top: stage.position.y,
                    width: width,
                }}
                onClick={(onClick)}
            >
                <ArcherElement
                    id={id}
                    relations={relations}
                >
                    <StagePreviewInnerContainer>
                        <StagePreviewHeader
                            onClick={() => { }}
                        >
                            <div>
                                <StagePreviewStart>
                                    <i className='codicon codicon-home' />
                                </StagePreviewStart>
                                {stage.name}
                            </div>
                            <div><i className="codicon codicon-edit" /></div>
                        </StagePreviewHeader>
                    </StagePreviewInnerContainer>
                </ArcherElement>
            </StagePreviewContainer>
        </Draggable>
    );
}
