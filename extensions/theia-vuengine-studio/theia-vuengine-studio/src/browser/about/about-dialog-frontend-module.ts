import { AboutDialog } from '@theia/core/lib/browser/about-dialog';
import { interfaces } from 'inversify';
import { VesAboutDialog } from './about-dialog';

import "../../../src/browser/about/style/index.css";

export function bindTheiaCustomizationAboutDialogModule(bind: interfaces.Bind, rebind: interfaces.Rebind): void {
    bind(VesAboutDialog).toSelf().inSingletonScope();
    rebind(AboutDialog).to(VesAboutDialog);
}
