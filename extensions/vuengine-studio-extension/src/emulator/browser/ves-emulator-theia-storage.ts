import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import URI from '@theia/core/lib/common/uri';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VueportFile, VueportStorage } from 'vueport-core/lib/common/emulator-host';

/**
 * The studio's side of {@link VueportStorage}.
 *
 * This is the whole of what binds the emulator to Theia's filesystem — the
 * point being that it is small, and that a different host writes its own
 * version of exactly this rather than touching the emulator. Deliberately free
 * of Theia's *browser* layer, so it can be exercised without a DOM.
 *
 * Paths here are URI strings, which is what `VueportStorage`'s contract allows:
 * the emulator never parses one, it only asks this class to take them apart and
 * put them back together.
 */
export class VesEmulatorTheiaStorage implements VueportStorage {

    constructor(
        protected readonly fileService: FileService,
        protected readonly workspaceService: WorkspaceService,
    ) { }

    async read(path: string): Promise<Uint8Array> {
        return (await this.fileService.readFile(new URI(path))).value.buffer;
    }

    async readText(path: string): Promise<string> {
        return (await this.fileService.readFile(new URI(path))).value.toString();
    }

    async write(path: string, data: Uint8Array): Promise<void> {
        await this.fileService.writeFile(new URI(path), BinaryBuffer.wrap(data));
    }

    async writeText(path: string, text: string): Promise<void> {
        await this.fileService.writeFile(new URI(path), BinaryBuffer.fromString(text));
    }

    async exists(path: string): Promise<boolean> {
        return this.fileService.exists(new URI(path));
    }

    async delete(path: string): Promise<void> {
        await this.fileService.delete(new URI(path));
    }

    async list(directory: string): Promise<VueportFile[]> {
        const resolved = await this.fileService.resolve(new URI(directory));
        return (resolved.children ?? [])
            .filter(child => !child.isDirectory)
            .map(child => ({
                path: child.resource.toString(),
                name: child.resource.path.base,
                size: child.size ?? 0,
            }));
    }

    parent(path: string): string {
        return new URI(path).parent.toString();
    }

    stem(path: string): string {
        return new URI(path).path.name;
    }

    name(path: string): string {
        return new URI(path).path.base;
    }

    join(directory: string, name: string): string {
        return new URI(directory).resolve(name).toString();
    }

    /**
     * Exported files land in the project, under a folder named for what they
     * are. A workspace is what makes that possible, so without one the export
     * is dropped rather than guessed at.
     */
    async export(name: string, data: Uint8Array): Promise<void> {
        await this.workspaceService.ready;
        const root = this.workspaceService.tryGetRoots()[0]?.resource;
        if (!root) {
            return;
        }
        await this.fileService.writeFile(
            root.resolve(name),
            BinaryBuffer.wrap(data)
        );
    }
}
