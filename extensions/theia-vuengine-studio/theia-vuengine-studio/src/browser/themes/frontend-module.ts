import { interfaces } from 'inversify';
import { bindVesThemeColors } from './color-contribution';

export function bindVesThemeContributions(bind: interfaces.Bind): void {
    bindVesThemeColors(bind);
}
