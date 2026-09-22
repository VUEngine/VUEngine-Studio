import { nls } from '@theia/core';
import { EmulatorConfig } from 'vueport-core/lib/browser/emulator-types';

export const VES_EMULATOR_WIDGET_ID = 'vesEmulatorWidget';

export const RED_VIPER_VBLINK_PORT = 22082;
export const RED_VIPER_VBLINK_CHUNK_SIZE_BYTES = 16384;

let _defaultEmulatorConfig: EmulatorConfig | undefined;

export function defaultEmulatorConfig(): EmulatorConfig {
  return _defaultEmulatorConfig ??= {
    name: nls.localize('vuengine/emulator/builtIn', 'Built-In'),
    path: '',
    args: '',
  };
}

export const RED_VIPER_CONFIG: EmulatorConfig = {
  name: 'Red Viper',
  path: '',
  args: '',
};
