import { ColorContribution } from '@theia/core/lib/browser/color-application-contribution';
import { ColorRegistry } from '@theia/core/lib/browser/color-registry';
import { injectable } from '@theia/core/shared/inversify';

@injectable()
export class VesColorContribution implements ColorContribution {
  registerColors(colorRegistry: ColorRegistry): void {
    colorRegistry.register(
      {
        id: 'activityBar.hoverBackground',
        defaults: {
          dark: '#2a2d2e',
          light: '#e8e8e8',
          hc: '#00000000'
        },
        description: 'Background color of activity bar items on hover'
      }
    );

    colorRegistry.register(
      {
        id: 'editorSuccess-foreground',
        defaults: {
          dark: '#4aa94e',
          light: '#4aa94e',
          hc: '#fff'
        },
        description: 'Success text color'
      }
    );
  }
}
