import styled from 'styled-components';
import { CHANNEL_BG_COLORS, PIANO_ROLL_NOTE_HEIGHT, PIANO_ROLL_NOTE_WIDTH } from '../SoundEditorTypes';

// these need to be in a single fine for references to each other to work

export const StyledPianoRollEditor = styled.div`
    display: flex;
    flex-direction: column;
    flex-grow: 1;

    body.theia-light & {
        background: var(--theia-secondaryButton-background);
    }

    body.theia-hc & {
        background: var(--theia-contrastBorder);
    }
`;

export const StyledPianoRollRow = styled.div`
    min-height: ${PIANO_ROLL_NOTE_HEIGHT + 1}px;
    display: flex;

    &:nth-child(12n) {
        min-height: ${PIANO_ROLL_NOTE_HEIGHT + 2}px;
    }
    &:last-child {
        min-height: ${PIANO_ROLL_NOTE_HEIGHT}px;
    }
`;

export const StyledPianoRollNote = styled.div`
    background-color: var(--theia-secondaryButton-background);
    cursor: crosshair;
    flex-grow: 1;
    margin-bottom: 1px;
    margin-right: 1px;
    min-height: ${PIANO_ROLL_NOTE_HEIGHT}px;
    max-height: ${PIANO_ROLL_NOTE_HEIGHT}px;
    min-width: ${PIANO_ROLL_NOTE_WIDTH}px;
    max-width: ${PIANO_ROLL_NOTE_WIDTH}px;

    body.theia-light &,
    body.theia-hc & {
        background: var(--theia-editor-background);
    }

    &.set-1 {
        background-color: ${CHANNEL_BG_COLORS[0]}85 !important;
    }
    &.set-2 {
        background-color: ${CHANNEL_BG_COLORS[1]}85 !important;
    }
    &.set-3 {
        background-color: ${CHANNEL_BG_COLORS[2]}85 !important;
    }
    &.set-4 {
        background-color: ${CHANNEL_BG_COLORS[3]}85 !important;
    }
    &.set-5 {
        background-color: ${CHANNEL_BG_COLORS[4]}85 !important;
    }
    &.set-6 {
        background-color: ${CHANNEL_BG_COLORS[5]}85 !important;
    }
    &.set-1.current-1 {
        background-color: ${CHANNEL_BG_COLORS[0]} !important;
    }
    &.set-2.current-2 {
        background-color: ${CHANNEL_BG_COLORS[1]} !important;
    }
    &.set-3.current-3 {
        background-color: ${CHANNEL_BG_COLORS[2]} !important;
    }
    &.set-4.current-4 {
        background-color: ${CHANNEL_BG_COLORS[3]} !important;
    }
    &.set-5.current-5 {
        background-color: ${CHANNEL_BG_COLORS[4]} !important;
    }
    &.set-6.current-6 {
        background-color: ${CHANNEL_BG_COLORS[5]} !important;
    }
    &.current-1,
    &.current-2,
    &.current-3,
    &.current-4,
    &.current-5,
    &.current-6 {
        border-radius: 1px;
        outline: 2px solid var(--theia-focusBorder);
        outline-offset: 1px;
        transition: all .2s;
        z-index: 10;
    }

    &:hover {
        border-radius: 1px;
        outline: 2px solid var(--theia-focusBorder);
        outline-offset: 1px;
        z-index: 12;
    }
    &:nth-child(4n + 1) {
        margin-right: 2px;
    }

    ${StyledPianoRollRow}:hover & {
        background-color: var(--theia-secondaryButton-hoverBackground);
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

export const MetaLine = styled.div`
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    left: 0;
    padding: 1px 4px 1px 0;
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

export const MetaLineNote = styled.div`
    align-items: center;
    cursor: ew-resize;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    gap: 1px;
    margin-bottom: 1px;
    padding-right: 1px;
    min-width: 15px;
    max-width: 15px;
    position: relative;
    user-select: none;

    &:hover {
        border-radius: 1px;
        outline: 1px solid var(--theia-focusBorder);
    }
    &:nth-child(4n + 1) {
        padding-right: 2px;
    }
    &:last-child {
        padding-right: 0 !important;
    }
`;

export const MetaLineNoteEffects = styled.div`
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
    
    ${MetaLineNote}.current & {
        background-color: var(--theia-secondaryButton-hoverBackground);
    }
`;

export const MetaLineNoteVolumeChannel = styled.div`
    background-color: var(--theia-editor-foreground);
    flex-grow: 1;
    opacity: .4;
`;

export const StyledPianoRollHeaderNote = styled(MetaLineNote)`
    border-top: 1px solid transparent;
    color: var(--theia-secondaryButton-background);
    justify-content: end;
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
`;

export const StyledPianoRoll = styled.div`
    align-items: start;
    display: flex;
    flex-direction: column;
    font-size: 10px;
    overflow: auto;
    margin: 0 var(--padding) var(--padding);
    position: relative;

    &.noteResolution-4 ${MetaLineNote}:nth-child(4n + 1) {
        padding-right: 3px;
    }
    &.noteResolution-4 ${StyledPianoRollNote}:nth-child(4n + 1) {
        margin-right: 3px;
    }
    &.noteResolution-8 ${MetaLineNote}:nth-child(8n + 1) {
        padding-right: 3px;
    }
    &.noteResolution-8 ${StyledPianoRollNote}:nth-child(8n + 1) {
        margin-right: 3px;
    }
    &.noteResolution-16 ${MetaLineNote}:nth-child(16n + 1) {
        padding-right: 3px;
    }
    &.noteResolution-16 ${StyledPianoRollNote}:nth-child(16n + 1) {
        margin-right: 3px;
    }
    &.noteResolution-32 ${MetaLineNote}:nth-child(32n + 1) {
        padding-right: 3px;
    }
    &.noteResolution-32 ${StyledPianoRollNote}:nth-child(32n + 1) {
        margin-right: 3px;
    }

    &.currentTick-0 ${StyledPianoRollNote}:nth-child(2),
    &.currentTick-1 ${StyledPianoRollNote}:nth-child(3),
    &.currentTick-2 ${StyledPianoRollNote}:nth-child(4),
    &.currentTick-3 ${StyledPianoRollNote}:nth-child(5),
    &.currentTick-4 ${StyledPianoRollNote}:nth-child(6),
    &.currentTick-5 ${StyledPianoRollNote}:nth-child(7),
    &.currentTick-6 ${StyledPianoRollNote}:nth-child(8),
    &.currentTick-7 ${StyledPianoRollNote}:nth-child(9),
    &.currentTick-8 ${StyledPianoRollNote}:nth-child(10),
    &.currentTick-9 ${StyledPianoRollNote}:nth-child(11),
    &.currentTick-10 ${StyledPianoRollNote}:nth-child(12),
    &.currentTick-11 ${StyledPianoRollNote}:nth-child(13),
    &.currentTick-12 ${StyledPianoRollNote}:nth-child(14),
    &.currentTick-13 ${StyledPianoRollNote}:nth-child(15),
    &.currentTick-14 ${StyledPianoRollNote}:nth-child(16),
    &.currentTick-15 ${StyledPianoRollNote}:nth-child(17),
    &.currentTick-16 ${StyledPianoRollNote}:nth-child(18),
    &.currentTick-17 ${StyledPianoRollNote}:nth-child(19),
    &.currentTick-18 ${StyledPianoRollNote}:nth-child(20),
    &.currentTick-19 ${StyledPianoRollNote}:nth-child(21),
    &.currentTick-20 ${StyledPianoRollNote}:nth-child(22),
    &.currentTick-21 ${StyledPianoRollNote}:nth-child(23),
    &.currentTick-22 ${StyledPianoRollNote}:nth-child(24),
    &.currentTick-23 ${StyledPianoRollNote}:nth-child(25),
    &.currentTick-24 ${StyledPianoRollNote}:nth-child(26),
    &.currentTick-25 ${StyledPianoRollNote}:nth-child(27),
    &.currentTick-26 ${StyledPianoRollNote}:nth-child(28),
    &.currentTick-27 ${StyledPianoRollNote}:nth-child(29),
    &.currentTick-28 ${StyledPianoRollNote}:nth-child(30),
    &.currentTick-29 ${StyledPianoRollNote}:nth-child(31),
    &.currentTick-30 ${StyledPianoRollNote}:nth-child(32),
    &.currentTick-31 ${StyledPianoRollNote}:nth-child(33),
    &.currentTick-32 ${StyledPianoRollNote}:nth-child(34),
    &.currentTick-33 ${StyledPianoRollNote}:nth-child(35),
    &.currentTick-34 ${StyledPianoRollNote}:nth-child(36),
    &.currentTick-35 ${StyledPianoRollNote}:nth-child(37),
    &.currentTick-36 ${StyledPianoRollNote}:nth-child(38),
    &.currentTick-37 ${StyledPianoRollNote}:nth-child(39),
    &.currentTick-38 ${StyledPianoRollNote}:nth-child(40),
    &.currentTick-39 ${StyledPianoRollNote}:nth-child(41),
    &.currentTick-40 ${StyledPianoRollNote}:nth-child(42),
    &.currentTick-41 ${StyledPianoRollNote}:nth-child(43),
    &.currentTick-42 ${StyledPianoRollNote}:nth-child(44),
    &.currentTick-43 ${StyledPianoRollNote}:nth-child(45),
    &.currentTick-44 ${StyledPianoRollNote}:nth-child(46),
    &.currentTick-45 ${StyledPianoRollNote}:nth-child(47),
    &.currentTick-46 ${StyledPianoRollNote}:nth-child(48),
    &.currentTick-47 ${StyledPianoRollNote}:nth-child(49),
    &.currentTick-48 ${StyledPianoRollNote}:nth-child(50),
    &.currentTick-49 ${StyledPianoRollNote}:nth-child(51),
    &.currentTick-50 ${StyledPianoRollNote}:nth-child(52),
    &.currentTick-51 ${StyledPianoRollNote}:nth-child(53),
    &.currentTick-52 ${StyledPianoRollNote}:nth-child(54),
    &.currentTick-53 ${StyledPianoRollNote}:nth-child(55),
    &.currentTick-54 ${StyledPianoRollNote}:nth-child(56),
    &.currentTick-55 ${StyledPianoRollNote}:nth-child(57),
    &.currentTick-56 ${StyledPianoRollNote}:nth-child(58),
    &.currentTick-57 ${StyledPianoRollNote}:nth-child(59),
    &.currentTick-58 ${StyledPianoRollNote}:nth-child(60),
    &.currentTick-59 ${StyledPianoRollNote}:nth-child(61),
    &.currentTick-60 ${StyledPianoRollNote}:nth-child(62),
    &.currentTick-61 ${StyledPianoRollNote}:nth-child(63),
    &.currentTick-62 ${StyledPianoRollNote}:nth-child(64),
    &.currentTick-63 ${StyledPianoRollNote}:nth-child(65),
    &.currentTick-64 ${StyledPianoRollNote}:nth-child(66),
    &.currentTick-65 ${StyledPianoRollNote}:nth-child(67),
    &.currentTick-66 ${StyledPianoRollNote}:nth-child(68),
    &.currentTick-67 ${StyledPianoRollNote}:nth-child(69),
    &.currentTick-68 ${StyledPianoRollNote}:nth-child(70),
    &.currentTick-69 ${StyledPianoRollNote}:nth-child(71),
    &.currentTick-70 ${StyledPianoRollNote}:nth-child(72),
    &.currentTick-71 ${StyledPianoRollNote}:nth-child(73),
    &.currentTick-72 ${StyledPianoRollNote}:nth-child(74),
    &.currentTick-73 ${StyledPianoRollNote}:nth-child(75),
    &.currentTick-74 ${StyledPianoRollNote}:nth-child(76),
    &.currentTick-75 ${StyledPianoRollNote}:nth-child(77),
    &.currentTick-76 ${StyledPianoRollNote}:nth-child(78),
    &.currentTick-77 ${StyledPianoRollNote}:nth-child(79),
    &.currentTick-78 ${StyledPianoRollNote}:nth-child(80),
    &.currentTick-79 ${StyledPianoRollNote}:nth-child(81),
    &.currentTick-80 ${StyledPianoRollNote}:nth-child(82),
    &.currentTick-81 ${StyledPianoRollNote}:nth-child(83),
    &.currentTick-82 ${StyledPianoRollNote}:nth-child(84),
    &.currentTick-83 ${StyledPianoRollNote}:nth-child(85),
    &.currentTick-84 ${StyledPianoRollNote}:nth-child(86),
    &.currentTick-85 ${StyledPianoRollNote}:nth-child(87),
    &.currentTick-86 ${StyledPianoRollNote}:nth-child(88),
    &.currentTick-87 ${StyledPianoRollNote}:nth-child(89),
    &.currentTick-88 ${StyledPianoRollNote}:nth-child(90),
    &.currentTick-89 ${StyledPianoRollNote}:nth-child(91),
    &.currentTick-90 ${StyledPianoRollNote}:nth-child(92),
    &.currentTick-91 ${StyledPianoRollNote}:nth-child(93),
    &.currentTick-92 ${StyledPianoRollNote}:nth-child(94),
    &.currentTick-93 ${StyledPianoRollNote}:nth-child(95),
    &.currentTick-94 ${StyledPianoRollNote}:nth-child(96),
    &.currentTick-95 ${StyledPianoRollNote}:nth-child(97),
    &.currentTick-96 ${StyledPianoRollNote}:nth-child(98),
    &.currentTick-97 ${StyledPianoRollNote}:nth-child(99),
    &.currentTick-98 ${StyledPianoRollNote}:nth-child(100),
    &.currentTick-99 ${StyledPianoRollNote}:nth-child(101),
    &.currentTick-100 ${StyledPianoRollNote}:nth-child(102),
    &.currentTick-101 ${StyledPianoRollNote}:nth-child(103),
    &.currentTick-102 ${StyledPianoRollNote}:nth-child(104),
    &.currentTick-103 ${StyledPianoRollNote}:nth-child(105),
    &.currentTick-104 ${StyledPianoRollNote}:nth-child(106),
    &.currentTick-105 ${StyledPianoRollNote}:nth-child(107),
    &.currentTick-106 ${StyledPianoRollNote}:nth-child(108),
    &.currentTick-107 ${StyledPianoRollNote}:nth-child(109),
    &.currentTick-108 ${StyledPianoRollNote}:nth-child(110),
    &.currentTick-109 ${StyledPianoRollNote}:nth-child(111),
    &.currentTick-110 ${StyledPianoRollNote}:nth-child(112),
    &.currentTick-111 ${StyledPianoRollNote}:nth-child(113),
    &.currentTick-112 ${StyledPianoRollNote}:nth-child(114),
    &.currentTick-113 ${StyledPianoRollNote}:nth-child(115),
    &.currentTick-114 ${StyledPianoRollNote}:nth-child(116),
    &.currentTick-115 ${StyledPianoRollNote}:nth-child(117),
    &.currentTick-116 ${StyledPianoRollNote}:nth-child(118),
    &.currentTick-117 ${StyledPianoRollNote}:nth-child(119),
    &.currentTick-118 ${StyledPianoRollNote}:nth-child(120),
    &.currentTick-119 ${StyledPianoRollNote}:nth-child(121),
    &.currentTick-120 ${StyledPianoRollNote}:nth-child(122),
    &.currentTick-121 ${StyledPianoRollNote}:nth-child(123),
    &.currentTick-122 ${StyledPianoRollNote}:nth-child(124),
    &.currentTick-123 ${StyledPianoRollNote}:nth-child(125),
    &.currentTick-124 ${StyledPianoRollNote}:nth-child(126),
    &.currentTick-125 ${StyledPianoRollNote}:nth-child(127),
    &.currentTick-126 ${StyledPianoRollNote}:nth-child(128),
    &.currentTick-127 ${StyledPianoRollNote}:nth-child(129),
    &.currentTick-128 ${StyledPianoRollNote}:nth-child(130),
    &.currentTick-129 ${StyledPianoRollNote}:nth-child(131),
    &.currentTick-130 ${StyledPianoRollNote}:nth-child(132),
    &.currentTick-131 ${StyledPianoRollNote}:nth-child(133),
    &.currentTick-132 ${StyledPianoRollNote}:nth-child(134),
    &.currentTick-133 ${StyledPianoRollNote}:nth-child(135),
    &.currentTick-134 ${StyledPianoRollNote}:nth-child(136),
    &.currentTick-135 ${StyledPianoRollNote}:nth-child(137),
    &.currentTick-136 ${StyledPianoRollNote}:nth-child(138),
    &.currentTick-137 ${StyledPianoRollNote}:nth-child(139),
    &.currentTick-138 ${StyledPianoRollNote}:nth-child(140),
    &.currentTick-139 ${StyledPianoRollNote}:nth-child(141),
    &.currentTick-140 ${StyledPianoRollNote}:nth-child(142),
    &.currentTick-141 ${StyledPianoRollNote}:nth-child(143),
    &.currentTick-142 ${StyledPianoRollNote}:nth-child(144),
    &.currentTick-143 ${StyledPianoRollNote}:nth-child(145),
    &.currentTick-144 ${StyledPianoRollNote}:nth-child(146),
    &.currentTick-145 ${StyledPianoRollNote}:nth-child(147),
    &.currentTick-146 ${StyledPianoRollNote}:nth-child(148),
    &.currentTick-147 ${StyledPianoRollNote}:nth-child(149),
    &.currentTick-148 ${StyledPianoRollNote}:nth-child(150),
    &.currentTick-149 ${StyledPianoRollNote}:nth-child(151),
    &.currentTick-150 ${StyledPianoRollNote}:nth-child(152),
    &.currentTick-151 ${StyledPianoRollNote}:nth-child(153),
    &.currentTick-152 ${StyledPianoRollNote}:nth-child(154),
    &.currentTick-153 ${StyledPianoRollNote}:nth-child(155),
    &.currentTick-154 ${StyledPianoRollNote}:nth-child(156),
    &.currentTick-155 ${StyledPianoRollNote}:nth-child(157),
    &.currentTick-156 ${StyledPianoRollNote}:nth-child(158),
    &.currentTick-157 ${StyledPianoRollNote}:nth-child(159),
    &.currentTick-158 ${StyledPianoRollNote}:nth-child(160),
    &.currentTick-159 ${StyledPianoRollNote}:nth-child(161),
    &.currentTick-160 ${StyledPianoRollNote}:nth-child(162),
    &.currentTick-161 ${StyledPianoRollNote}:nth-child(163),
    &.currentTick-162 ${StyledPianoRollNote}:nth-child(164),
    &.currentTick-163 ${StyledPianoRollNote}:nth-child(165),
    &.currentTick-164 ${StyledPianoRollNote}:nth-child(166),
    &.currentTick-165 ${StyledPianoRollNote}:nth-child(167),
    &.currentTick-166 ${StyledPianoRollNote}:nth-child(168),
    &.currentTick-167 ${StyledPianoRollNote}:nth-child(169),
    &.currentTick-168 ${StyledPianoRollNote}:nth-child(170),
    &.currentTick-169 ${StyledPianoRollNote}:nth-child(171),
    &.currentTick-170 ${StyledPianoRollNote}:nth-child(172),
    &.currentTick-171 ${StyledPianoRollNote}:nth-child(173),
    &.currentTick-172 ${StyledPianoRollNote}:nth-child(174),
    &.currentTick-173 ${StyledPianoRollNote}:nth-child(175),
    &.currentTick-174 ${StyledPianoRollNote}:nth-child(176),
    &.currentTick-175 ${StyledPianoRollNote}:nth-child(177),
    &.currentTick-176 ${StyledPianoRollNote}:nth-child(178),
    &.currentTick-177 ${StyledPianoRollNote}:nth-child(179),
    &.currentTick-178 ${StyledPianoRollNote}:nth-child(180),
    &.currentTick-179 ${StyledPianoRollNote}:nth-child(181),
    &.currentTick-180 ${StyledPianoRollNote}:nth-child(182),
    &.currentTick-181 ${StyledPianoRollNote}:nth-child(183),
    &.currentTick-182 ${StyledPianoRollNote}:nth-child(184),
    &.currentTick-183 ${StyledPianoRollNote}:nth-child(185),
    &.currentTick-184 ${StyledPianoRollNote}:nth-child(186),
    &.currentTick-185 ${StyledPianoRollNote}:nth-child(187),
    &.currentTick-186 ${StyledPianoRollNote}:nth-child(188),
    &.currentTick-187 ${StyledPianoRollNote}:nth-child(189),
    &.currentTick-188 ${StyledPianoRollNote}:nth-child(190),
    &.currentTick-189 ${StyledPianoRollNote}:nth-child(191),
    &.currentTick-190 ${StyledPianoRollNote}:nth-child(192),
    &.currentTick-191 ${StyledPianoRollNote}:nth-child(193) {
        background-color: var(--theia-secondaryButton-hoverBackground);
    }
`;
