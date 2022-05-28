import { injectable } from '@theia/core/shared/inversify';
import { ColorContribution } from '@theia/core/lib/browser/color-application-contribution';
import { Color, ColorRegistry } from '@theia/core/lib/browser/color-registry';

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
        description: 'Background of title bar buttons'
      },
      {
        id: 'titleBar.buttonBackground',
        defaults: {
          dark: Color.darken('titleBar.activeBackground', 0.3),
          light: Color.darken('titleBar.activeBackground', 0.3),
          hc: '#000'
        },
        description: 'Background of title bar buttons'
      },
      {
        id: 'titleBar.hoverButtonBackground',
        defaults: {
          dark: Color.darken('titleBar.activeBackground', 0.6),
          light: Color.darken('titleBar.activeBackground', 0.6),
          hc: '#000',
        },
        description: 'Background of title bar buttons when hovered over'
      }
    );
  }
}
