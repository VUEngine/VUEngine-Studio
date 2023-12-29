import VesBrightnessRepeatEditorControl from './brightness-repeat-editor/ves-brightness-repeat-editor-control';
import VesBrightnessRepeatEditorControlTester from './brightness-repeat-editor/ves-brightness-repeat-editor-control-tester';
import VesColumnTableEditorControl from './column-table-editor/ves-column-table-editor-control';
import VesColumnTableEditorControlTester from './column-table-editor/ves-column-table-editor-control-tester';
import VesEntityEditorControl from './entity-editor/ves-entity-editor-control';
import VesEntityEditorControlTester from './entity-editor/ves-entity-editor-control-tester';
import VesFontEditorControl from './font-editor/ves-font-editor-control';
import VesFontEditorControlTester from './font-editor/ves-font-editor-control-tester';
import VesImageConvEditorControl from './image-conv-editor/ves-image-conv-editor-control';
import VesImageConvEditorControlTester from './image-conv-editor/ves-image-conv-editor-control-tester';
import VesMeshesControl from './meshes/ves-meshes-control';
import VesMeshesControlTester from './meshes/ves-meshes-control-tester';
import VesMusicEditorControl from './music-editor/ves-music-editor-control';
import VesMusicEditorControlTester from './music-editor/ves-music-editor-control-tester';
import VesPaletteControl from './palette/ves-palette-control';
import VesPaletteControlTester from './palette/ves-palette-control-tester';
import VesPcmEditorControl from './pcm-editor/ves-pcm-editor-control';
import VesPcmEditorControlTester from './pcm-editor/ves-pcm-editor-control-tester';
import VesRumbleEffectEditorControl from './rumble-effect-editor/ves-rumble-effect-editor-control';
import VesRumbleEffectEditorControlTester from './rumble-effect-editor/ves-rumble-effect-editor-control-tester';
import vesSimpleListEditorControl from './simple-list-editor/ves-simple-list-editor-control';
import vesSimpleListEditorControlTester from './simple-list-editor/ves-simple-list-editor-control-tester';
import VesTranslationsEditorControl from './translations-editor/ves-translations-editor-control';
import VesTranslationsEditorControlTester from './translations-editor/ves-translations-editor-control-tester';

export const VES_RENDERERS = [
    { tester: VesBrightnessRepeatEditorControlTester, renderer: VesBrightnessRepeatEditorControl },
    { tester: VesColumnTableEditorControlTester, renderer: VesColumnTableEditorControl },
    { tester: VesEntityEditorControlTester, renderer: VesEntityEditorControl },
    { tester: VesFontEditorControlTester, renderer: VesFontEditorControl },
    { tester: VesImageConvEditorControlTester, renderer: VesImageConvEditorControl },
    { tester: VesMusicEditorControlTester, renderer: VesMusicEditorControl },
    { tester: VesMeshesControlTester, renderer: VesMeshesControl },
    { tester: VesPaletteControlTester, renderer: VesPaletteControl },
    { tester: VesPcmEditorControlTester, renderer: VesPcmEditorControl },
    { tester: VesRumbleEffectEditorControlTester, renderer: VesRumbleEffectEditorControl },
    { tester: vesSimpleListEditorControlTester, renderer: vesSimpleListEditorControl },
    { tester: VesTranslationsEditorControlTester, renderer: VesTranslationsEditorControl },
];
