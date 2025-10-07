import { corePreferenceSchema, isOSX, nls } from '@theia/core';
import { PreferenceSchema } from '@theia/core/lib/common/preferences/preference-schema';

export const VesCorePreferenceSchema: PreferenceSchema = {
    'properties': {
        ...corePreferenceSchema.properties,
        ['window.title']: {
            ...corePreferenceSchema.properties['window.title'],
            markdownDescription: corePreferenceSchema.properties['window.title'].markdownDescription
                + '\n- ' + nls.localize('vuengine/general/preferences/windowTitleProjectName', '`${projectName}`: name of project')
        },
        ['window.menuBarVisibility']: {
            ...corePreferenceSchema.properties['window.menuBarVisibility'],
            default: isOSX ? 'hidden' : 'compact',
            included: true
        }
    }
};
