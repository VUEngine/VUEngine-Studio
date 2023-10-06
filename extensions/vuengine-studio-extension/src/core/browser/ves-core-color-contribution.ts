import { ColorContribution } from '@theia/core/lib/browser/color-application-contribution';
import { ColorRegistry } from '@theia/core/lib/browser/color-registry';
import { injectable } from '@theia/core/shared/inversify';

@injectable()
export class VesColorContribution implements ColorContribution {
  registerColors(colors: ColorRegistry): void {
    colors.register(
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
