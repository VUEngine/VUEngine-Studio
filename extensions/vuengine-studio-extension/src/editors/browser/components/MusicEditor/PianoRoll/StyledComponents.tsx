import styled from 'styled-components';
import { CHANNEL_BG_COLORS, PIANO_ROLL_NOTE_HEIGHT, PIANO_ROLL_NOTE_WIDTH } from '../MusicEditorTypes';

// these need to be in a single fine for references to each other to work

export const StyledPianoRollEditor = styled.div`
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    padding: 1px 0;

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
        outline: 2px solid var(--theia-editor-foreground);
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
    padding: 1px 2px 1px 0;
    position: sticky;
    z-index: 100;
    background: var(--theia-editor-background);
`;

export const MetaLineHeader = styled.div`
    background: var(--theia-editor-background);
    display: flex;
    flex-direction: column;
    height: 30px;
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
    margin-right: 1px;
    min-width: 15px;
    max-width: 15px;
    position: relative;

    &:hover {
        border-radius: 1px;
        outline: 1px solid var(--theia-focusBorder);
    }
    &:nth-child(4n + 1) {
        margin-right: 2px;
    }
    &:last-child {
        margin-right: 0 !important;
    }
`;

export const MetaLineNoteEffects = styled.div`
    align-items: center;
    display: flex;
    font-size: 8px;
    flex-grow: 1;
    justify-content: center;
    min-height: 13px;
    max-height: 13px;
    overflow: hidden;
    width: 100%;    
    
    ${MetaLineNote}.current & {
        background-color: var(--theia-secondaryButton-hoverBackground);
    }
`;

export const MetaLineNoteVolume = styled.div`
    align-items: end;
    background-color: var(--theia-secondaryButton-background);
    display: flex;
    height: 16px;
    width: 100%;
`;

export const MetaLineNoteVolumeChannel = styled.div`
    background-color: var(--theia-editor-foreground);
    flex-grow: 1;
    opacity: .4;
`;

export const StyledPianoRollHeaderNote = styled(MetaLineNote)`
    margin-right: 0px !important;
    padding-right: 1px;

    &.rangeStart, &.rangeEnd, &.inRange {
        border-top: 1px solid var(--theia-focusBorder);
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

    &.noteResolution-4 ${MetaLineNote}:nth-child(4n + 1),
    &.noteResolution-4 ${StyledPianoRollNote}:nth-child(4n + 1) {
        margin-right: 3px;
    }
    &.noteResolution-8 ${MetaLineNote}:nth-child(8n + 1),
    &.noteResolution-8 ${StyledPianoRollNote}:nth-child(8n + 1) {
        margin-right: 3px;
    }
    &.noteResolution-16 ${MetaLineNote}:nth-child(16n + 1),
    &.noteResolution-16 ${StyledPianoRollNote}:nth-child(16n + 1) {
        margin-right: 3px;
    }
    &.noteResolution-32 ${MetaLineNote}:nth-child(32n + 1),
    &.noteResolution-32 ${StyledPianoRollNote}:nth-child(32n + 1) {
        margin-right: 3px;
    }

    &.currentNote-0 ${StyledPianoRollNote}:nth-child(2),
    &.currentNote-1 ${StyledPianoRollNote}:nth-child(3),
    &.currentNote-2 ${StyledPianoRollNote}:nth-child(4),
    &.currentNote-3 ${StyledPianoRollNote}:nth-child(5),
    &.currentNote-4 ${StyledPianoRollNote}:nth-child(6),
    &.currentNote-5 ${StyledPianoRollNote}:nth-child(7),
    &.currentNote-6 ${StyledPianoRollNote}:nth-child(8),
    &.currentNote-7 ${StyledPianoRollNote}:nth-child(9),
    &.currentNote-8 ${StyledPianoRollNote}:nth-child(10),
    &.currentNote-9 ${StyledPianoRollNote}:nth-child(11),
    &.currentNote-10 ${StyledPianoRollNote}:nth-child(12),
    &.currentNote-11 ${StyledPianoRollNote}:nth-child(13),
    &.currentNote-12 ${StyledPianoRollNote}:nth-child(14),
    &.currentNote-13 ${StyledPianoRollNote}:nth-child(15),
    &.currentNote-14 ${StyledPianoRollNote}:nth-child(16),
    &.currentNote-15 ${StyledPianoRollNote}:nth-child(17),
    &.currentNote-16 ${StyledPianoRollNote}:nth-child(18),
    &.currentNote-17 ${StyledPianoRollNote}:nth-child(19),
    &.currentNote-18 ${StyledPianoRollNote}:nth-child(20),
    &.currentNote-19 ${StyledPianoRollNote}:nth-child(21),
    &.currentNote-20 ${StyledPianoRollNote}:nth-child(22),
    &.currentNote-21 ${StyledPianoRollNote}:nth-child(23),
    &.currentNote-22 ${StyledPianoRollNote}:nth-child(24),
    &.currentNote-23 ${StyledPianoRollNote}:nth-child(25),
    &.currentNote-24 ${StyledPianoRollNote}:nth-child(26),
    &.currentNote-25 ${StyledPianoRollNote}:nth-child(27),
    &.currentNote-26 ${StyledPianoRollNote}:nth-child(28),
    &.currentNote-27 ${StyledPianoRollNote}:nth-child(29),
    &.currentNote-28 ${StyledPianoRollNote}:nth-child(30),
    &.currentNote-29 ${StyledPianoRollNote}:nth-child(31),
    &.currentNote-30 ${StyledPianoRollNote}:nth-child(32),
    &.currentNote-31 ${StyledPianoRollNote}:nth-child(33),
    &.currentNote-32 ${StyledPianoRollNote}:nth-child(34),
    &.currentNote-33 ${StyledPianoRollNote}:nth-child(35),
    &.currentNote-34 ${StyledPianoRollNote}:nth-child(36),
    &.currentNote-35 ${StyledPianoRollNote}:nth-child(37),
    &.currentNote-36 ${StyledPianoRollNote}:nth-child(38),
    &.currentNote-37 ${StyledPianoRollNote}:nth-child(39),
    &.currentNote-38 ${StyledPianoRollNote}:nth-child(40),
    &.currentNote-39 ${StyledPianoRollNote}:nth-child(41),
    &.currentNote-40 ${StyledPianoRollNote}:nth-child(42),
    &.currentNote-41 ${StyledPianoRollNote}:nth-child(43),
    &.currentNote-42 ${StyledPianoRollNote}:nth-child(44),
    &.currentNote-43 ${StyledPianoRollNote}:nth-child(45),
    &.currentNote-44 ${StyledPianoRollNote}:nth-child(46),
    &.currentNote-45 ${StyledPianoRollNote}:nth-child(47),
    &.currentNote-46 ${StyledPianoRollNote}:nth-child(48),
    &.currentNote-47 ${StyledPianoRollNote}:nth-child(49),
    &.currentNote-48 ${StyledPianoRollNote}:nth-child(50),
    &.currentNote-49 ${StyledPianoRollNote}:nth-child(51),
    &.currentNote-50 ${StyledPianoRollNote}:nth-child(52),
    &.currentNote-51 ${StyledPianoRollNote}:nth-child(53),
    &.currentNote-52 ${StyledPianoRollNote}:nth-child(54),
    &.currentNote-53 ${StyledPianoRollNote}:nth-child(55),
    &.currentNote-54 ${StyledPianoRollNote}:nth-child(56),
    &.currentNote-55 ${StyledPianoRollNote}:nth-child(57),
    &.currentNote-56 ${StyledPianoRollNote}:nth-child(58),
    &.currentNote-57 ${StyledPianoRollNote}:nth-child(59),
    &.currentNote-58 ${StyledPianoRollNote}:nth-child(60),
    &.currentNote-59 ${StyledPianoRollNote}:nth-child(61),
    &.currentNote-60 ${StyledPianoRollNote}:nth-child(62),
    &.currentNote-61 ${StyledPianoRollNote}:nth-child(63),
    &.currentNote-62 ${StyledPianoRollNote}:nth-child(64),
    &.currentNote-63 ${StyledPianoRollNote}:nth-child(65),
    &.currentNote-64 ${StyledPianoRollNote}:nth-child(66),
    &.currentNote-65 ${StyledPianoRollNote}:nth-child(67),
    &.currentNote-66 ${StyledPianoRollNote}:nth-child(68),
    &.currentNote-67 ${StyledPianoRollNote}:nth-child(69),
    &.currentNote-68 ${StyledPianoRollNote}:nth-child(70),
    &.currentNote-69 ${StyledPianoRollNote}:nth-child(71),
    &.currentNote-70 ${StyledPianoRollNote}:nth-child(72),
    &.currentNote-71 ${StyledPianoRollNote}:nth-child(73),
    &.currentNote-72 ${StyledPianoRollNote}:nth-child(74),
    &.currentNote-73 ${StyledPianoRollNote}:nth-child(75),
    &.currentNote-74 ${StyledPianoRollNote}:nth-child(76),
    &.currentNote-75 ${StyledPianoRollNote}:nth-child(77),
    &.currentNote-76 ${StyledPianoRollNote}:nth-child(78),
    &.currentNote-77 ${StyledPianoRollNote}:nth-child(79),
    &.currentNote-78 ${StyledPianoRollNote}:nth-child(80),
    &.currentNote-79 ${StyledPianoRollNote}:nth-child(81),
    &.currentNote-80 ${StyledPianoRollNote}:nth-child(82),
    &.currentNote-81 ${StyledPianoRollNote}:nth-child(83),
    &.currentNote-82 ${StyledPianoRollNote}:nth-child(84),
    &.currentNote-83 ${StyledPianoRollNote}:nth-child(85),
    &.currentNote-84 ${StyledPianoRollNote}:nth-child(86),
    &.currentNote-85 ${StyledPianoRollNote}:nth-child(87),
    &.currentNote-86 ${StyledPianoRollNote}:nth-child(88),
    &.currentNote-87 ${StyledPianoRollNote}:nth-child(89),
    &.currentNote-88 ${StyledPianoRollNote}:nth-child(90),
    &.currentNote-89 ${StyledPianoRollNote}:nth-child(91),
    &.currentNote-90 ${StyledPianoRollNote}:nth-child(92),
    &.currentNote-91 ${StyledPianoRollNote}:nth-child(93),
    &.currentNote-92 ${StyledPianoRollNote}:nth-child(94),
    &.currentNote-93 ${StyledPianoRollNote}:nth-child(95),
    &.currentNote-94 ${StyledPianoRollNote}:nth-child(96),
    &.currentNote-95 ${StyledPianoRollNote}:nth-child(97),
    &.currentNote-96 ${StyledPianoRollNote}:nth-child(98),
    &.currentNote-97 ${StyledPianoRollNote}:nth-child(99),
    &.currentNote-98 ${StyledPianoRollNote}:nth-child(100),
    &.currentNote-99 ${StyledPianoRollNote}:nth-child(101),
    &.currentNote-100 ${StyledPianoRollNote}:nth-child(102),
    &.currentNote-101 ${StyledPianoRollNote}:nth-child(103),
    &.currentNote-102 ${StyledPianoRollNote}:nth-child(104),
    &.currentNote-103 ${StyledPianoRollNote}:nth-child(105),
    &.currentNote-104 ${StyledPianoRollNote}:nth-child(106),
    &.currentNote-105 ${StyledPianoRollNote}:nth-child(107),
    &.currentNote-106 ${StyledPianoRollNote}:nth-child(108),
    &.currentNote-107 ${StyledPianoRollNote}:nth-child(109),
    &.currentNote-108 ${StyledPianoRollNote}:nth-child(110),
    &.currentNote-109 ${StyledPianoRollNote}:nth-child(111),
    &.currentNote-110 ${StyledPianoRollNote}:nth-child(112),
    &.currentNote-111 ${StyledPianoRollNote}:nth-child(113),
    &.currentNote-112 ${StyledPianoRollNote}:nth-child(114),
    &.currentNote-113 ${StyledPianoRollNote}:nth-child(115),
    &.currentNote-114 ${StyledPianoRollNote}:nth-child(116),
    &.currentNote-115 ${StyledPianoRollNote}:nth-child(117),
    &.currentNote-116 ${StyledPianoRollNote}:nth-child(118),
    &.currentNote-117 ${StyledPianoRollNote}:nth-child(119),
    &.currentNote-118 ${StyledPianoRollNote}:nth-child(120),
    &.currentNote-119 ${StyledPianoRollNote}:nth-child(121),
    &.currentNote-120 ${StyledPianoRollNote}:nth-child(122),
    &.currentNote-121 ${StyledPianoRollNote}:nth-child(123),
    &.currentNote-122 ${StyledPianoRollNote}:nth-child(124),
    &.currentNote-123 ${StyledPianoRollNote}:nth-child(125),
    &.currentNote-124 ${StyledPianoRollNote}:nth-child(126),
    &.currentNote-125 ${StyledPianoRollNote}:nth-child(127),
    &.currentNote-126 ${StyledPianoRollNote}:nth-child(128),
    &.currentNote-127 ${StyledPianoRollNote}:nth-child(129),
    &.currentNote-128 ${StyledPianoRollNote}:nth-child(130),
    &.currentNote-129 ${StyledPianoRollNote}:nth-child(131),
    &.currentNote-130 ${StyledPianoRollNote}:nth-child(132),
    &.currentNote-131 ${StyledPianoRollNote}:nth-child(133),
    &.currentNote-132 ${StyledPianoRollNote}:nth-child(134),
    &.currentNote-133 ${StyledPianoRollNote}:nth-child(135),
    &.currentNote-134 ${StyledPianoRollNote}:nth-child(136),
    &.currentNote-135 ${StyledPianoRollNote}:nth-child(137),
    &.currentNote-136 ${StyledPianoRollNote}:nth-child(138),
    &.currentNote-137 ${StyledPianoRollNote}:nth-child(139),
    &.currentNote-138 ${StyledPianoRollNote}:nth-child(140),
    &.currentNote-139 ${StyledPianoRollNote}:nth-child(141),
    &.currentNote-140 ${StyledPianoRollNote}:nth-child(142),
    &.currentNote-141 ${StyledPianoRollNote}:nth-child(143),
    &.currentNote-142 ${StyledPianoRollNote}:nth-child(144),
    &.currentNote-143 ${StyledPianoRollNote}:nth-child(145),
    &.currentNote-144 ${StyledPianoRollNote}:nth-child(146),
    &.currentNote-145 ${StyledPianoRollNote}:nth-child(147),
    &.currentNote-146 ${StyledPianoRollNote}:nth-child(148),
    &.currentNote-147 ${StyledPianoRollNote}:nth-child(149),
    &.currentNote-148 ${StyledPianoRollNote}:nth-child(150),
    &.currentNote-149 ${StyledPianoRollNote}:nth-child(151),
    &.currentNote-150 ${StyledPianoRollNote}:nth-child(152),
    &.currentNote-151 ${StyledPianoRollNote}:nth-child(153),
    &.currentNote-152 ${StyledPianoRollNote}:nth-child(154),
    &.currentNote-153 ${StyledPianoRollNote}:nth-child(155),
    &.currentNote-154 ${StyledPianoRollNote}:nth-child(156),
    &.currentNote-155 ${StyledPianoRollNote}:nth-child(157),
    &.currentNote-156 ${StyledPianoRollNote}:nth-child(158),
    &.currentNote-157 ${StyledPianoRollNote}:nth-child(159),
    &.currentNote-158 ${StyledPianoRollNote}:nth-child(160),
    &.currentNote-159 ${StyledPianoRollNote}:nth-child(161),
    &.currentNote-160 ${StyledPianoRollNote}:nth-child(162),
    &.currentNote-161 ${StyledPianoRollNote}:nth-child(163),
    &.currentNote-162 ${StyledPianoRollNote}:nth-child(164),
    &.currentNote-163 ${StyledPianoRollNote}:nth-child(165),
    &.currentNote-164 ${StyledPianoRollNote}:nth-child(166),
    &.currentNote-165 ${StyledPianoRollNote}:nth-child(167),
    &.currentNote-166 ${StyledPianoRollNote}:nth-child(168),
    &.currentNote-167 ${StyledPianoRollNote}:nth-child(169),
    &.currentNote-168 ${StyledPianoRollNote}:nth-child(170),
    &.currentNote-169 ${StyledPianoRollNote}:nth-child(171),
    &.currentNote-170 ${StyledPianoRollNote}:nth-child(172),
    &.currentNote-171 ${StyledPianoRollNote}:nth-child(173),
    &.currentNote-172 ${StyledPianoRollNote}:nth-child(174),
    &.currentNote-173 ${StyledPianoRollNote}:nth-child(175),
    &.currentNote-174 ${StyledPianoRollNote}:nth-child(176),
    &.currentNote-175 ${StyledPianoRollNote}:nth-child(177),
    &.currentNote-176 ${StyledPianoRollNote}:nth-child(178),
    &.currentNote-177 ${StyledPianoRollNote}:nth-child(179),
    &.currentNote-178 ${StyledPianoRollNote}:nth-child(180),
    &.currentNote-179 ${StyledPianoRollNote}:nth-child(181),
    &.currentNote-180 ${StyledPianoRollNote}:nth-child(182),
    &.currentNote-181 ${StyledPianoRollNote}:nth-child(183),
    &.currentNote-182 ${StyledPianoRollNote}:nth-child(184),
    &.currentNote-183 ${StyledPianoRollNote}:nth-child(185),
    &.currentNote-184 ${StyledPianoRollNote}:nth-child(186),
    &.currentNote-185 ${StyledPianoRollNote}:nth-child(187),
    &.currentNote-186 ${StyledPianoRollNote}:nth-child(188),
    &.currentNote-187 ${StyledPianoRollNote}:nth-child(189),
    &.currentNote-188 ${StyledPianoRollNote}:nth-child(190),
    &.currentNote-189 ${StyledPianoRollNote}:nth-child(191),
    &.currentNote-190 ${StyledPianoRollNote}:nth-child(192),
    &.currentNote-191 ${StyledPianoRollNote}:nth-child(193) {
        background-color: var(--theia-secondaryButton-hoverBackground);
    }
`;
