import styled from 'styled-components';
import { MAX_PATTERN_SIZE, NOTE_RESOLUTION, PIANO_ROLL_NOTE_HEIGHT, PIANO_ROLL_NOTE_WIDTH } from '../SoundEditorTypes';

const getPianoRollWidth = (size: number) =>
    53 + // piano
    size * 4 - 1 + // quarter note separators
    size - 1 + // full note separators
    size * (PIANO_ROLL_NOTE_WIDTH + 1) * NOTE_RESOLUTION; // notes

// these need to be in a single fine for references to each other to work

export const StyledPianoRollEditor = styled.div`
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    user-select: none;
`;

export const StyledPianoRollRow = styled.div`
    display: flex;
    min-height: ${PIANO_ROLL_NOTE_HEIGHT + 1}px;
    overflow-x: hidden;
    position: relative;
    z-index: 10;

    &:nth-child(12n) {
        min-height: ${PIANO_ROLL_NOTE_HEIGHT + 2}px;
    }
    &:last-child {
        min-height: ${PIANO_ROLL_NOTE_HEIGHT}px;
    }
`;

export const StyledPianoRollEditorTick = styled.div`
    background-color: rgba(255, 255, 255, .1);
    cursor: crosshair;
    flex-grow: 1;
    margin-bottom: 1px;
    margin-right: 1px;
    min-height: ${PIANO_ROLL_NOTE_HEIGHT}px;
    max-height: ${PIANO_ROLL_NOTE_HEIGHT}px;
    min-width: ${PIANO_ROLL_NOTE_WIDTH}px;
    max-width: ${PIANO_ROLL_NOTE_WIDTH}px;

    &:hover {
        background-color: var(--theia-focusBorder) !important;
        z-index: 100;
    }
    &:nth-child(4n + 1) {
        margin-right: 2px;
    }

    /*
    &.sharpNote {
        background-color: rgba(255, 255, 255, .15);
    }
    */

    body.theia-light &,
    body.theia-hc & {
        background-color: rgba(0, 0, 0, .1);

        /*
        &.sharpNote {
            background-color: rgba(0, 0, 0, .15);
        }
        */
    }

    ${StyledPianoRollRow}:hover & {
        background-color: rgba(255, 255, 255, .2);

        body.theia-light & {
            background-color: rgba(0, 0, 0, .2);
        }
    }
`;

export const StyledPianoRollKey = styled.div`
    align-items: center;
    background-color: #f1f1f1;
    border-bottom: 0px solid #ccc;
    box-sizing: border-box;
    color: #666;
    cursor: pointer;
    display: flex;
    font-size: 9px;
    left: 0;
    line-height: 6px;
    margin-right: 3px;
    min-height: ${PIANO_ROLL_NOTE_HEIGHT - 1}px;
    max-height: ${PIANO_ROLL_NOTE_HEIGHT + 2}px;
    min-width: 50px;
    padding-left: 3px;
    position: sticky;
    width: 50px;
    z-index: 100;

    &.sharpNote {
        background-color: #eee !important;
        color: #ccc;

        &:after {
            background: #111;
            content: "";
            height: 100%;
            position: absolute;
            left: 0;
            width: 75%;
        }
    }

    ${StyledPianoRollRow}:hover &,
    &:hover,
    &.sharpNote:hover:after,
    ${StyledPianoRollRow}:hover &.sharpNote:after {
        background: var(--theia-button-background);
        color: var(--theia-button-foreground)
    }

    ${StyledPianoRollRow}:nth-child(12n) & {
        border-bottom-width: 2px;
    }

    ${StyledPianoRollRow}:last-child & {
        border-bottom-width: 1px;
    }

    body.theia-light & {
        border-left: 1px solid var(--theia-secondaryButton-background);
        border-right: 1px solid var(--theia-secondaryButton-background);
    }

    body.theia-light ${StyledPianoRollRow}:first-child & {
        border-top: 1px solid var(--theia-secondaryButton-background);
    }

    body.theia-light ${StyledPianoRollRow}:last-child & {
        border-bottom: 1px solid var(--theia-secondaryButton-background);
    }
`;

export const StyledPianoRollKeyName = styled.div`
    display: none;
    z-index: 1;

    ${StyledPianoRollRow}:nth-child(12n) &,
    ${StyledPianoRollRow}:hover & {
        display: block;
    }
`;

export const StyledPianoRollPlacedNote = styled.div`
    background-color: rgba(0, 0, 0, .75);
    border-radius: 1px;
    box-sizing: border-box;
    color: #fff;
    cursor: pointer;
    font-size: ${PIANO_ROLL_NOTE_HEIGHT}px;
    line-height: ${PIANO_ROLL_NOTE_HEIGHT}px;
    min-height: ${PIANO_ROLL_NOTE_HEIGHT}px;
    max-height: ${PIANO_ROLL_NOTE_HEIGHT}px;
    min-width: ${PIANO_ROLL_NOTE_WIDTH}px;
    outline-offset: 1px;
    overflow: hidden;
    padding-left: 1px;
    position: absolute;
    text-overflow: ellipsis;
    z-index: 10;

    &.oc {
        border-radius: 0;
        outline-width: 0;
        opacity: .5;
        z-index: 0;
    }

    &.selected {
        outline: 3px solid var(--theia-focusBorder);
    }
`;

export const StyledPianoRollPlacedNoteDragHandle = styled.div`
    border-left: 1px solid;
    bottom: 2px;
    cursor: col-resize;
    position: absolute;
    right: 0;
    top: 2px;
    width: 2px;
`;

export const MetaLine = styled.div`
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    left: 0;
    min-height: 19px;
    overflow-x: hidden;
    padding: 1px 4px 0 0;
    position: sticky;
    background: var(--theia-editor-background);
    z-index: 200;
`;

export const MetaLineHeader = styled.div`
    background: var(--theia-editor-background);
    display: flex;
    flex-direction: column;
    height: 28px;
    left: 0;
    margin-right: 3px;
    min-width: 50px;
    position: sticky;
    width: 50px;
    z-index: 10;
`;

export const MetaLineHeaderLine = styled.div`
    align-items: center;
    display: flex;
    flex-grow: 1;
    justify-content: center;
    min-height: 13px;
    opacity: .75;
`;

export const MetaLineTick = styled.div`
    align-items: center;
    cursor: ew-resize;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    gap: 1px;
    margin-bottom: 1px;
    padding-right: 1px;
    min-width: ${PIANO_ROLL_NOTE_WIDTH}px;
    max-width: ${PIANO_ROLL_NOTE_WIDTH}px;
    position: relative;
    user-select: none;

    &:hover {
        background-color: var(--theia-focusBorder) !important;
        color: #fff;
    }
    &:nth-child(4n + 1) {
        padding-right: 2px;
    }
    &:last-child {
        padding-right: 0 !important;
    }
`;

export const MetaLineTickEffects = styled.div`
    align-items: center;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    justify-content: center;
    min-height: 28px;
    max-height: 28px;
    overflow: hidden;
    width: 100%;    
    
    ${MetaLineTick}.current & {
        background-color: var(--theia-secondaryButton-hoverBackground);

        &:hover {
            background-color: var(--theia-focusBorder);
            color: #fff;
        }
    }
`;

export const StyledPianoRollHeaderTick = styled(MetaLineTick)`
    border-top: 1px solid transparent;
    color: var(--theia-secondaryButton-background);
    min-height: 16px;
    padding-right: 1px;

    &.rangeStart, &.rangeEnd, &.inRange {
        border-top-color: var(--theia-focusBorder);
    }
    
    &.rangeStart::before {
        border-right: 10px solid transparent;
        border-top: 10px solid var(--theia-focusBorder);
        content: "";
        top: 0;
        position: absolute;
        left: 0;
        z-index: 1;
    }

    &.rangeEnd::after {
        border-left: 10px solid transparent;
        border-top: 10px solid var(--theia-focusBorder);
        content: "";
        top: 0;
        position: absolute;
        right: 0;
        z-index: 1;
    }

    &:nth-child(4n + 1) {
        padding-right: 2px;
    }

    &:nth-child(16n + 2) {
        color: inherit;
    }
`;

export const StyledPianoRoll = styled.div`
    align-items: start;
    display: flex;
    flex-direction: column;
    font-size: 10px;
    overflow: auto;
    margin: 2px var(--padding) var(--padding);
    position: relative;

    &.noteResolution-4 ${MetaLineTick}:nth-child(4n + 1) {
        padding-right: 3px;
    }
    &.noteResolution-4 ${StyledPianoRollEditorTick}:nth-child(4n + 1) {
        margin-right: 3px;
    }
    &.noteResolution-8 ${MetaLineTick}:nth-child(8n + 1) {
        padding-right: 3px;
    }
    &.noteResolution-8 ${StyledPianoRollEditorTick}:nth-child(8n + 1) {
        margin-right: 3px;
    }
    &.noteResolution-16 ${MetaLineTick}:nth-child(16n + 1) {
        padding-right: 3px;
    }
    &.noteResolution-16 ${StyledPianoRollEditorTick}:nth-child(16n + 1) {
        margin-right: 3px;
    }
    &.noteResolution-32 ${MetaLineTick}:nth-child(32n + 1) {
        padding-right: 3px;
    }
    &.noteResolution-32 ${StyledPianoRollEditorTick}:nth-child(32n + 1) {
        margin-right: 3px;
    }

    &.currentTick-0 ${StyledPianoRollEditorTick}:nth-child(2),
    &.currentTick-1 ${StyledPianoRollEditorTick}:nth-child(3),
    &.currentTick-2 ${StyledPianoRollEditorTick}:nth-child(4),
    &.currentTick-3 ${StyledPianoRollEditorTick}:nth-child(5),
    &.currentTick-4 ${StyledPianoRollEditorTick}:nth-child(6),
    &.currentTick-5 ${StyledPianoRollEditorTick}:nth-child(7),
    &.currentTick-6 ${StyledPianoRollEditorTick}:nth-child(8),
    &.currentTick-7 ${StyledPianoRollEditorTick}:nth-child(9),
    &.currentTick-8 ${StyledPianoRollEditorTick}:nth-child(10),
    &.currentTick-9 ${StyledPianoRollEditorTick}:nth-child(11),
    &.currentTick-10 ${StyledPianoRollEditorTick}:nth-child(12),
    &.currentTick-11 ${StyledPianoRollEditorTick}:nth-child(13),
    &.currentTick-12 ${StyledPianoRollEditorTick}:nth-child(14),
    &.currentTick-13 ${StyledPianoRollEditorTick}:nth-child(15),
    &.currentTick-14 ${StyledPianoRollEditorTick}:nth-child(16),
    &.currentTick-15 ${StyledPianoRollEditorTick}:nth-child(17),
    &.currentTick-16 ${StyledPianoRollEditorTick}:nth-child(18),
    &.currentTick-17 ${StyledPianoRollEditorTick}:nth-child(19),
    &.currentTick-18 ${StyledPianoRollEditorTick}:nth-child(20),
    &.currentTick-19 ${StyledPianoRollEditorTick}:nth-child(21),
    &.currentTick-20 ${StyledPianoRollEditorTick}:nth-child(22),
    &.currentTick-21 ${StyledPianoRollEditorTick}:nth-child(23),
    &.currentTick-22 ${StyledPianoRollEditorTick}:nth-child(24),
    &.currentTick-23 ${StyledPianoRollEditorTick}:nth-child(25),
    &.currentTick-24 ${StyledPianoRollEditorTick}:nth-child(26),
    &.currentTick-25 ${StyledPianoRollEditorTick}:nth-child(27),
    &.currentTick-26 ${StyledPianoRollEditorTick}:nth-child(28),
    &.currentTick-27 ${StyledPianoRollEditorTick}:nth-child(29),
    &.currentTick-28 ${StyledPianoRollEditorTick}:nth-child(30),
    &.currentTick-29 ${StyledPianoRollEditorTick}:nth-child(31),
    &.currentTick-30 ${StyledPianoRollEditorTick}:nth-child(32),
    &.currentTick-31 ${StyledPianoRollEditorTick}:nth-child(33),
    &.currentTick-32 ${StyledPianoRollEditorTick}:nth-child(34),
    &.currentTick-33 ${StyledPianoRollEditorTick}:nth-child(35),
    &.currentTick-34 ${StyledPianoRollEditorTick}:nth-child(36),
    &.currentTick-35 ${StyledPianoRollEditorTick}:nth-child(37),
    &.currentTick-36 ${StyledPianoRollEditorTick}:nth-child(38),
    &.currentTick-37 ${StyledPianoRollEditorTick}:nth-child(39),
    &.currentTick-38 ${StyledPianoRollEditorTick}:nth-child(40),
    &.currentTick-39 ${StyledPianoRollEditorTick}:nth-child(41),
    &.currentTick-40 ${StyledPianoRollEditorTick}:nth-child(42),
    &.currentTick-41 ${StyledPianoRollEditorTick}:nth-child(43),
    &.currentTick-42 ${StyledPianoRollEditorTick}:nth-child(44),
    &.currentTick-43 ${StyledPianoRollEditorTick}:nth-child(45),
    &.currentTick-44 ${StyledPianoRollEditorTick}:nth-child(46),
    &.currentTick-45 ${StyledPianoRollEditorTick}:nth-child(47),
    &.currentTick-46 ${StyledPianoRollEditorTick}:nth-child(48),
    &.currentTick-47 ${StyledPianoRollEditorTick}:nth-child(49),
    &.currentTick-48 ${StyledPianoRollEditorTick}:nth-child(50),
    &.currentTick-49 ${StyledPianoRollEditorTick}:nth-child(51),
    &.currentTick-50 ${StyledPianoRollEditorTick}:nth-child(52),
    &.currentTick-51 ${StyledPianoRollEditorTick}:nth-child(53),
    &.currentTick-52 ${StyledPianoRollEditorTick}:nth-child(54),
    &.currentTick-53 ${StyledPianoRollEditorTick}:nth-child(55),
    &.currentTick-54 ${StyledPianoRollEditorTick}:nth-child(56),
    &.currentTick-55 ${StyledPianoRollEditorTick}:nth-child(57),
    &.currentTick-56 ${StyledPianoRollEditorTick}:nth-child(58),
    &.currentTick-57 ${StyledPianoRollEditorTick}:nth-child(59),
    &.currentTick-58 ${StyledPianoRollEditorTick}:nth-child(60),
    &.currentTick-59 ${StyledPianoRollEditorTick}:nth-child(61),
    &.currentTick-60 ${StyledPianoRollEditorTick}:nth-child(62),
    &.currentTick-61 ${StyledPianoRollEditorTick}:nth-child(63),
    &.currentTick-62 ${StyledPianoRollEditorTick}:nth-child(64),
    &.currentTick-63 ${StyledPianoRollEditorTick}:nth-child(65),
    &.currentTick-64 ${StyledPianoRollEditorTick}:nth-child(66),
    &.currentTick-65 ${StyledPianoRollEditorTick}:nth-child(67),
    &.currentTick-66 ${StyledPianoRollEditorTick}:nth-child(68),
    &.currentTick-67 ${StyledPianoRollEditorTick}:nth-child(69),
    &.currentTick-68 ${StyledPianoRollEditorTick}:nth-child(70),
    &.currentTick-69 ${StyledPianoRollEditorTick}:nth-child(71),
    &.currentTick-70 ${StyledPianoRollEditorTick}:nth-child(72),
    &.currentTick-71 ${StyledPianoRollEditorTick}:nth-child(73),
    &.currentTick-72 ${StyledPianoRollEditorTick}:nth-child(74),
    &.currentTick-73 ${StyledPianoRollEditorTick}:nth-child(75),
    &.currentTick-74 ${StyledPianoRollEditorTick}:nth-child(76),
    &.currentTick-75 ${StyledPianoRollEditorTick}:nth-child(77),
    &.currentTick-76 ${StyledPianoRollEditorTick}:nth-child(78),
    &.currentTick-77 ${StyledPianoRollEditorTick}:nth-child(79),
    &.currentTick-78 ${StyledPianoRollEditorTick}:nth-child(80),
    &.currentTick-79 ${StyledPianoRollEditorTick}:nth-child(81),
    &.currentTick-80 ${StyledPianoRollEditorTick}:nth-child(82),
    &.currentTick-81 ${StyledPianoRollEditorTick}:nth-child(83),
    &.currentTick-82 ${StyledPianoRollEditorTick}:nth-child(84),
    &.currentTick-83 ${StyledPianoRollEditorTick}:nth-child(85),
    &.currentTick-84 ${StyledPianoRollEditorTick}:nth-child(86),
    &.currentTick-85 ${StyledPianoRollEditorTick}:nth-child(87),
    &.currentTick-86 ${StyledPianoRollEditorTick}:nth-child(88),
    &.currentTick-87 ${StyledPianoRollEditorTick}:nth-child(89),
    &.currentTick-88 ${StyledPianoRollEditorTick}:nth-child(90),
    &.currentTick-89 ${StyledPianoRollEditorTick}:nth-child(91),
    &.currentTick-90 ${StyledPianoRollEditorTick}:nth-child(92),
    &.currentTick-91 ${StyledPianoRollEditorTick}:nth-child(93),
    &.currentTick-92 ${StyledPianoRollEditorTick}:nth-child(94),
    &.currentTick-93 ${StyledPianoRollEditorTick}:nth-child(95),
    &.currentTick-94 ${StyledPianoRollEditorTick}:nth-child(96),
    &.currentTick-95 ${StyledPianoRollEditorTick}:nth-child(97),
    &.currentTick-96 ${StyledPianoRollEditorTick}:nth-child(98),
    &.currentTick-97 ${StyledPianoRollEditorTick}:nth-child(99),
    &.currentTick-98 ${StyledPianoRollEditorTick}:nth-child(100),
    &.currentTick-99 ${StyledPianoRollEditorTick}:nth-child(101),
    &.currentTick-100 ${StyledPianoRollEditorTick}:nth-child(102),
    &.currentTick-101 ${StyledPianoRollEditorTick}:nth-child(103),
    &.currentTick-102 ${StyledPianoRollEditorTick}:nth-child(104),
    &.currentTick-103 ${StyledPianoRollEditorTick}:nth-child(105),
    &.currentTick-104 ${StyledPianoRollEditorTick}:nth-child(106),
    &.currentTick-105 ${StyledPianoRollEditorTick}:nth-child(107),
    &.currentTick-106 ${StyledPianoRollEditorTick}:nth-child(108),
    &.currentTick-107 ${StyledPianoRollEditorTick}:nth-child(109),
    &.currentTick-108 ${StyledPianoRollEditorTick}:nth-child(110),
    &.currentTick-109 ${StyledPianoRollEditorTick}:nth-child(111),
    &.currentTick-110 ${StyledPianoRollEditorTick}:nth-child(112),
    &.currentTick-111 ${StyledPianoRollEditorTick}:nth-child(113),
    &.currentTick-112 ${StyledPianoRollEditorTick}:nth-child(114),
    &.currentTick-113 ${StyledPianoRollEditorTick}:nth-child(115),
    &.currentTick-114 ${StyledPianoRollEditorTick}:nth-child(116),
    &.currentTick-115 ${StyledPianoRollEditorTick}:nth-child(117),
    &.currentTick-116 ${StyledPianoRollEditorTick}:nth-child(118),
    &.currentTick-117 ${StyledPianoRollEditorTick}:nth-child(119),
    &.currentTick-118 ${StyledPianoRollEditorTick}:nth-child(120),
    &.currentTick-119 ${StyledPianoRollEditorTick}:nth-child(121),
    &.currentTick-120 ${StyledPianoRollEditorTick}:nth-child(122),
    &.currentTick-121 ${StyledPianoRollEditorTick}:nth-child(123),
    &.currentTick-122 ${StyledPianoRollEditorTick}:nth-child(124),
    &.currentTick-123 ${StyledPianoRollEditorTick}:nth-child(125),
    &.currentTick-124 ${StyledPianoRollEditorTick}:nth-child(126),
    &.currentTick-125 ${StyledPianoRollEditorTick}:nth-child(127),
    &.currentTick-126 ${StyledPianoRollEditorTick}:nth-child(128),
    &.currentTick-127 ${StyledPianoRollEditorTick}:nth-child(129),
    &.currentTick-128 ${StyledPianoRollEditorTick}:nth-child(130),
    &.currentTick-129 ${StyledPianoRollEditorTick}:nth-child(131),
    &.currentTick-130 ${StyledPianoRollEditorTick}:nth-child(132),
    &.currentTick-131 ${StyledPianoRollEditorTick}:nth-child(133),
    &.currentTick-132 ${StyledPianoRollEditorTick}:nth-child(134),
    &.currentTick-133 ${StyledPianoRollEditorTick}:nth-child(135),
    &.currentTick-134 ${StyledPianoRollEditorTick}:nth-child(136),
    &.currentTick-135 ${StyledPianoRollEditorTick}:nth-child(137),
    &.currentTick-136 ${StyledPianoRollEditorTick}:nth-child(138),
    &.currentTick-137 ${StyledPianoRollEditorTick}:nth-child(139),
    &.currentTick-138 ${StyledPianoRollEditorTick}:nth-child(140),
    &.currentTick-139 ${StyledPianoRollEditorTick}:nth-child(141),
    &.currentTick-140 ${StyledPianoRollEditorTick}:nth-child(142),
    &.currentTick-141 ${StyledPianoRollEditorTick}:nth-child(143),
    &.currentTick-142 ${StyledPianoRollEditorTick}:nth-child(144),
    &.currentTick-143 ${StyledPianoRollEditorTick}:nth-child(145),
    &.currentTick-144 ${StyledPianoRollEditorTick}:nth-child(146),
    &.currentTick-145 ${StyledPianoRollEditorTick}:nth-child(147),
    &.currentTick-146 ${StyledPianoRollEditorTick}:nth-child(148),
    &.currentTick-147 ${StyledPianoRollEditorTick}:nth-child(149),
    &.currentTick-148 ${StyledPianoRollEditorTick}:nth-child(150),
    &.currentTick-149 ${StyledPianoRollEditorTick}:nth-child(151),
    &.currentTick-150 ${StyledPianoRollEditorTick}:nth-child(152),
    &.currentTick-151 ${StyledPianoRollEditorTick}:nth-child(153),
    &.currentTick-152 ${StyledPianoRollEditorTick}:nth-child(154),
    &.currentTick-153 ${StyledPianoRollEditorTick}:nth-child(155),
    &.currentTick-154 ${StyledPianoRollEditorTick}:nth-child(156),
    &.currentTick-155 ${StyledPianoRollEditorTick}:nth-child(157),
    &.currentTick-156 ${StyledPianoRollEditorTick}:nth-child(158),
    &.currentTick-157 ${StyledPianoRollEditorTick}:nth-child(159),
    &.currentTick-158 ${StyledPianoRollEditorTick}:nth-child(160),
    &.currentTick-159 ${StyledPianoRollEditorTick}:nth-child(161),
    &.currentTick-160 ${StyledPianoRollEditorTick}:nth-child(162),
    &.currentTick-161 ${StyledPianoRollEditorTick}:nth-child(163),
    &.currentTick-162 ${StyledPianoRollEditorTick}:nth-child(164),
    &.currentTick-163 ${StyledPianoRollEditorTick}:nth-child(165),
    &.currentTick-164 ${StyledPianoRollEditorTick}:nth-child(166),
    &.currentTick-165 ${StyledPianoRollEditorTick}:nth-child(167),
    &.currentTick-166 ${StyledPianoRollEditorTick}:nth-child(168),
    &.currentTick-167 ${StyledPianoRollEditorTick}:nth-child(169),
    &.currentTick-168 ${StyledPianoRollEditorTick}:nth-child(170),
    &.currentTick-169 ${StyledPianoRollEditorTick}:nth-child(171),
    &.currentTick-170 ${StyledPianoRollEditorTick}:nth-child(172),
    &.currentTick-171 ${StyledPianoRollEditorTick}:nth-child(173),
    &.currentTick-172 ${StyledPianoRollEditorTick}:nth-child(174),
    &.currentTick-173 ${StyledPianoRollEditorTick}:nth-child(175),
    &.currentTick-174 ${StyledPianoRollEditorTick}:nth-child(176),
    &.currentTick-175 ${StyledPianoRollEditorTick}:nth-child(177),
    &.currentTick-176 ${StyledPianoRollEditorTick}:nth-child(178),
    &.currentTick-177 ${StyledPianoRollEditorTick}:nth-child(179),
    &.currentTick-178 ${StyledPianoRollEditorTick}:nth-child(180),
    &.currentTick-179 ${StyledPianoRollEditorTick}:nth-child(181),
    &.currentTick-180 ${StyledPianoRollEditorTick}:nth-child(182),
    &.currentTick-181 ${StyledPianoRollEditorTick}:nth-child(183),
    &.currentTick-182 ${StyledPianoRollEditorTick}:nth-child(184),
    &.currentTick-183 ${StyledPianoRollEditorTick}:nth-child(185),
    &.currentTick-184 ${StyledPianoRollEditorTick}:nth-child(186),
    &.currentTick-185 ${StyledPianoRollEditorTick}:nth-child(187),
    &.currentTick-186 ${StyledPianoRollEditorTick}:nth-child(188),
    &.currentTick-187 ${StyledPianoRollEditorTick}:nth-child(189),
    &.currentTick-188 ${StyledPianoRollEditorTick}:nth-child(190),
    &.currentTick-189 ${StyledPianoRollEditorTick}:nth-child(191),
    &.currentTick-190 ${StyledPianoRollEditorTick}:nth-child(192),
    &.currentTick-191 ${StyledPianoRollEditorTick}:nth-child(193) {
        background-color: rgba(255, 255, 255, .2);

        body.theia-light & {
            background: rgba(0, 0, 0, .2);
        }
    }

    ${[...Array(MAX_PATTERN_SIZE)].map((i, j) => `&.size-${j}  { 
        ${MetaLine}, 
        ${StyledPianoRollRow} { 
            width: ${getPianoRollWidth(j)}px; 
        } 
    }`)}
`;
