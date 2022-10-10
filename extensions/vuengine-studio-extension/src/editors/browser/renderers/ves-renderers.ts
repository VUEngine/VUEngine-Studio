import vesBrightnessRepeatEditorControl from './brightness-repeat-editor/ves-brightness-repeat-editor-control';
import vesBrightnessRepeatEditorControlTester from './brightness-repeat-editor/ves-brightness-repeat-editor-control-tester';
import vesColumnTableEditorControl from './column-table-editor/ves-column-table-editor-control';
import vesColumnTableEditorControlTester from './column-table-editor/ves-column-table-editor-control-tester';
import vesFontEditorControl from './font-editor/ves-font-editor-control';
import vesFontEditorControlTester from './font-editor/ves-font-editor-control-tester';
import vesImagesControl from './images/ves-images-control';
import vesImagesControlTester from './images/ves-images-control-tester';
import vesMeshesControl from './meshes/ves-meshes-control';
import vesMeshesControlTester from './meshes/ves-meshes-control-tester';
import vesMusicEditorControl from './music-editor/ves-music-editor-control';
import vesMusicEditorControlTester from './music-editor/ves-music-editor-control-tester';
import vesPaletteControl from './palette/ves-palette-control';
import vesPaletteControlTester from './palette/ves-palette-control-tester';
import vesRatingControl from './starRating/ves-rating-control';
import vesRatingControlTester from './starRating/ves-rating-control-tester';

export const VES_RENDERERS = [
    { tester: vesBrightnessRepeatEditorControlTester, renderer: vesBrightnessRepeatEditorControl },
    { tester: vesColumnTableEditorControlTester, renderer: vesColumnTableEditorControl },
    { tester: vesFontEditorControlTester, renderer: vesFontEditorControl },
    { tester: vesMusicEditorControlTester, renderer: vesMusicEditorControl },
    { tester: vesImagesControlTester, renderer: vesImagesControl },
    { tester: vesMeshesControlTester, renderer: vesMeshesControl },
    { tester: vesPaletteControlTester, renderer: vesPaletteControl },
    { tester: vesRatingControlTester, renderer: vesRatingControl },
];
