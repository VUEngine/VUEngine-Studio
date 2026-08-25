import { Command, isOSX, isWindows, nls } from '@theia/core';
import { KeybindingRegistry } from '@theia/core/lib/browser';
import { KeybindingScope, ScopedKeybinding } from '@theia/core/lib/browser/keybinding';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { Keybinding } from '@theia/core/lib/common/keybinding';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { VesProcessWatcher } from '../../process/browser/ves-process-service-watcher';
import { VesProcessService, VesProcessType } from '../../process/common/ves-process-service-protocol';
import { isValidKeybinding, VesCaptureKeybindingDialog, VesKeymapsServiceProvider } from './ves-capture-keybinding-dialog';

@injectable()
export class VesCommonService {
  @inject(EnvVariablesServer)
  protected envVariablesServer!: EnvVariablesServer;
  @inject(KeybindingRegistry)
  protected readonly keybindingRegistry!: KeybindingRegistry;
  @inject(VesKeymapsServiceProvider)
  protected readonly keymapsServiceProvider!: VesKeymapsServiceProvider;
  @inject(VesProcessService)
  protected readonly vesProcessService!: VesProcessService;
  @inject(VesProcessWatcher)
  protected readonly vesProcessWatcher!: VesProcessWatcher;

  @postConstruct()
  protected init(): void {
    this.doInit();
  }

  protected async doInit(): Promise<void> {
    await this.determineIsWslInstalled();
  }

  isWslInstalled: boolean = false;

  getOs(): string {
    return isWindows ? 'win' : isOSX ? 'osx' : 'linux';
  }

  getByKey(o: any, s: string): any {
    // convert indexes to properties
    s = s.replace(/\[(\w+)\]/g, '.$1');
    // strip leading dot
    s = s.replace(/^\./, '');
    const a = s.split('.');
    for (let i = 0, n = a.length; i < n; ++i) {
      const k = a[i];
      if (k in o) {
        o = o[k];
      } else {
        return '';
      }
    }
    return o;
  }

  async getResourcesUri(): Promise<URI> {
    const envVar = await this.envVariablesServer.getValue('THEIA_APP_PROJECT_PATH');
    const applicationPath = envVar && envVar.value
      ? isWindows
        ? `/${envVar.value}`
        : envVar.value
      : '';

    return new URI(applicationPath).withScheme('file');
  }

  basename(path: URI | string): string {
    if (typeof path !== 'string') {
      path = path.path.fsPath();
    }

    return path.replace(/\\/g, '\/').split('/').pop() || '';
  }

  cleanSpecName(name: string): string {
    return name
      ? name
        .replace(/[-\s]/g, '') // remove some
        .replace(/[^A-Za-z0-9_]/g, '') // remove all that are not of the given characters
        .replace(/^[0-9]+/, '_') // replace leading numbers
        .replace(/[_+]/g, '_') // replace multiple underscores by one
      : ';';
  }

  base64ToBytes(base64: string): Uint8Array {
    const binString = atob(base64);
    return Uint8Array.from(binString, m => m.codePointAt(0) ?? 0);
  }
  bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
  }

  async compressJson(data: any): Promise<string> {
    const stream = new Blob([JSON.stringify(data)], {
      type: 'application/json',
    }).stream();
    const compressedReadableStream = stream.pipeThrough(
      new CompressionStream('gzip')
    );
    const compressedResponse = new Response(compressedReadableStream);
    const blob = await compressedResponse.blob();
    const buffer = await blob.arrayBuffer();

    return this.bytesToBase64(new Uint8Array(buffer));
  }

  async unzipJson(data: any): Promise<unknown> {
    if (typeof data !== 'string') {
      return data;
    }

    const compressed = this.base64ToBytes(data);
    const stream = new Blob([compressed.buffer as ArrayBuffer], {
      type: 'application/json',
    }).stream();
    const compressedReadableStream = stream.pipeThrough(
      new DecompressionStream('gzip')
    );
    const resp = new Response(compressedReadableStream);
    const blob = await resp.blob();

    return JSON.parse(await blob.text());
  }

  isValidUrl(url: string): boolean {
    const urlPattern = new RegExp('^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // ipv4
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return !!urlPattern.test(url);
  }

  getKeybindingLabel(
    commandId: string,
    wrapInBrackets: boolean = false
  ): string {
    const keybindings = this.keybindingRegistry.getKeybindingsForCommand(commandId);
    const keybindingAccelerators: string[] = [];
    keybindings.forEach(k => {
      if (k) {
        keybindingAccelerators.push(
          this.keybindingRegistry.acceleratorFor(k, '').join(', ')
            .replace(/\s/, nls.localize('vuengine/general/space', 'Space'))
            .replace(/\+/, nls.localize('vuengine/general/plus', 'Plus'))
        );
      }
    });

    let keybindingAccelerator = keybindingAccelerators.join(` ${nls.localize('vuengine/general/or', 'or')} `);
    if (wrapInBrackets && keybindingAccelerator !== '') {
      keybindingAccelerator = ` (${keybindingAccelerator})`;
    }

    return keybindingAccelerator;
  }

  /**
   * Ask for a key combination and map it to a command.
   *
   * The captured combination is *added* to whatever the command already
   * answers to, rather than replacing it: a control is usually reachable from
   * several keys. The dialog's other two buttons are how to get rid of what is
   * there — Clear All Mappings leaves the command answering to nothing, Reset
   * to Default puts the application's own mappings back — and neither closes
   * it, so a mapping can be cleared and a new one captured in one visit.
   * Returns whether anything changed at all, so a caller showing the mappings
   * can redraw them.
   *
   * `when` is the context the new mapping applies in, and matters as much as
   * the key does: these commands are game pad buttons and editor shortcuts,
   * which must not answer to their key everywhere in the application. A caller
   * that does not name one gets the context the command's existing mappings
   * use, which is the same thing for every command that has any.
   *
   * This is here rather than in the button that opens it because that button
   * is a plain component shared by the editors and the emulator, and this is
   * the service all of them already hold.
   */
  async captureKeybinding(command: Command, when?: string): Promise<boolean> {
    const existing = this.keybindingRegistry.getKeybindingsForCommand(command.id);
    // Either button changes the mappings without closing the dialog, so a
    // caller showing them has to redraw even when no key was captured.
    let changed = false;

    const dialog = new VesCaptureKeybindingDialog({
      title: command.category ? `${command.category}: ${command.label}` : `${command.label}`,
      maxWidth: 400,
      initialValue: '',
      validate: value => isValidKeybinding(value)
        ? ''
        : nls.localizeByDefault('Enter a valid keybinding.'),
      currentMappings: () => this.getKeybindingLabel(command.id),
      clearAll: async () => {
        await this.clearKeybindings(command.id);
        changed = true;
      },
      resetToDefault: async () => {
        // Removing every entry the user's keymap holds for the command — the
        // mappings they added and the ones switching defaults off — is what
        // leaves the application's own mappings in force.
        await this.keymapsServiceProvider().removeKeybinding(command.id);
        changed = true;
      },
    });

    const keybinding = await dialog.open();
    if (keybinding && isValidKeybinding(keybinding)) {
      await this.addKeybinding(command, keybinding, when ?? this.contextOf(existing));
      return true;
    }
    return changed;
  }

  /**
   * Add one mapping to a command, keeping the ones it already has.
   *
   * Clearing a command's mappings does not delete its defaults — nothing can —
   * but writes a `-command` entry that switches each of them off. Mapping such
   * a key again therefore has to take that entry away first, or the mapping
   * lands in the file and is cancelled by it: present in `keymaps.json`, absent
   * from the Keyboard Shortcuts editor, and dead in the application. With the
   * entry gone the default is back, so a user copy of it would only be a
   * duplicate row saying the same thing, and is not written.
   */
  protected async addKeybinding(command: Command, keybinding: string, when?: string): Promise<void> {
    const keymaps = this.keymapsServiceProvider();
    const sameKey = (candidate: Keybinding): boolean =>
      candidate.keybinding === keybinding && (candidate.when || undefined) === (when || undefined);

    const disabling = this.keybindingRegistry.getKeybindingsByScope(KeybindingScope.USER)
      .filter(candidate => candidate.command === `-${command.id}` && sameKey(candidate));
    for (const entry of disabling) {
      await keymaps.unsetKeybinding(entry);
    }

    const covered = this.keybindingRegistry.getKeybindingsForCommand(command.id).some(sameKey);
    if (!covered) {
      // No old keybinding to hand over: that is what makes this an addition
      // rather than a replacement.
      await keymaps.setKeybinding({ command: command.id, keybinding, when }, undefined);
    }
  }

  /**
   * The context a command's existing mappings apply in, if they agree on one.
   *
   * The application's own mappings are what declare this — every default for a
   * given command carries the same `when` — so copying it is how a mapping
   * added later lands in the same place. A command with no mappings at all has
   * nothing to copy, which is why callers that have such commands say so
   * themselves.
   */
  protected contextOf(keybindings: ScopedKeybinding[]): string | undefined {
    const defaults = keybindings.filter(keybinding => keybinding.scope === KeybindingScope.DEFAULT);
    return (defaults[0] ?? keybindings[0])?.when;
  }

  /**
   * Drop every mapping a command has.
   *
   * Two steps, because the two kinds of mapping go different ways: the ones in
   * the user's keymap are deleted outright, while a default cannot be deleted
   * at all and is instead written back as a disabled entry. Each of those
   * rewrites the file from the registry, so they run one at a time.
   */
  protected async clearKeybindings(commandId: string): Promise<void> {
    await this.keymapsServiceProvider().removeKeybinding(commandId);
    const defaults = this.keybindingRegistry.getKeybindingsForCommand(commandId)
      .filter(keybinding => keybinding.scope === KeybindingScope.DEFAULT);
    for (const keybinding of defaults) {
      await this.keymapsServiceProvider().unsetKeybinding(keybinding);
    }
  }

  protected async determineIsWslInstalled(): Promise<void> {
    if (!isWindows) {
      this.isWslInstalled = false;
      return;
    }

    const checkProcess = await this.vesProcessService.launchProcess(VesProcessType.Raw, {
      command: 'wsl.exe',
      args: ['--list', '--verbose']
    });

    await new Promise<void>((resolve, reject) => {
      this.vesProcessWatcher.onDidReceiveOutputStreamData(({ pId, data }) => {
        if (checkProcess.processManagerId === pId) {
          data = data.replace(/\0/g, ''); // clean of NUL characters
          this.isWslInstalled = data.includes('NAME') && data.includes('STATE') && data.includes('VERSION');
          resolve();
        }
      });
      this.vesProcessWatcher.onDidExitProcess(({ pId }) => {
        if (checkProcess.processManagerId === pId) {
          resolve();
        }
      });
    });
  }
}
