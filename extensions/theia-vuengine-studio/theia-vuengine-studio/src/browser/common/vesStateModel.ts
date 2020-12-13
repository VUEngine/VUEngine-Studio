import { injectable } from 'inversify';
import { Emitter } from '@theia/core/lib/common/event';

@injectable()
export class VesStateModel {

    // is cleaning
    protected _isCleaning = false;
    protected readonly onDidChangeIsCleaningEmitter = new Emitter<boolean>();
    readonly onDidChangeIsCleaning = this.onDidChangeIsCleaningEmitter.event;
    set isCleaning(flag: boolean) {
        this._isCleaning = flag;
        this.onDidChangeIsCleaningEmitter.fire(this._isCleaning);
    }
    get isCleaning(): boolean {
        return this._isCleaning;
    }

    // is building
    protected _isBuilding = false;
    protected readonly onDidChangeIsBuildingEmitter = new Emitter<boolean>();
    readonly onDidChangeIsBuilding = this.onDidChangeIsBuildingEmitter.event;
    set isBuilding(flag: boolean) {
        this._isBuilding = flag;
        this.onDidChangeIsBuildingEmitter.fire(this._isBuilding);
    }
    get isBuilding(): boolean {
        return this._isBuilding;
    }

    // flash cart connected
    protected _connectedFlashCart = "";
    protected readonly onDidChangeConnectedFlashCartEmitter = new Emitter<string>();
    readonly onDidChangeConnectedFlashCart = this.onDidChangeConnectedFlashCartEmitter.event;
    set connectedFlashCart(name: string) {
        this._connectedFlashCart = name;
        this.onDidChangeConnectedFlashCartEmitter.fire(this._connectedFlashCart);
    }
    get connectedFlashCart(): string {
        return this._connectedFlashCart;
    }

    // export queue
    protected _isExportQueued = false;
    protected _exportQueueInterval: any = 0;
    protected readonly onDidChangeIsExportQueuedEmitter = new Emitter<boolean>();
    readonly onDidChangeIsExportQueued = this.onDidChangeIsExportQueuedEmitter.event;
    get isExportQueued(): boolean {
        return this._isExportQueued;
    }
    public enqueueExport(interval: any) {
        this._isExportQueued = true;
        this.onDidChangeIsExportQueuedEmitter.fire(this._isExportQueued);
        this._exportQueueInterval = interval;
    }
    public unqueueExport() {
        this._isExportQueued = false;
        this.onDidChangeIsExportQueuedEmitter.fire(this._isExportQueued);
        clearInterval(this._exportQueueInterval);
    }

    // run queue
    protected _isRunQueued = false;
    protected _runQueueInterval: any = 0;
    protected readonly onDidChangeIsRunQueuedEmitter = new Emitter<boolean>();
    readonly onDidChangeIsRunQueued = this.onDidChangeIsRunQueuedEmitter.event;
    get isRunQueued(): boolean {
        return this._isRunQueued;
    }
    public enqueueRun(interval: any) {
        this._isRunQueued = true;
        this.onDidChangeIsRunQueuedEmitter.fire(this._isRunQueued);
        this._runQueueInterval = interval;
    }
    public unqueueRun() {
        this._isRunQueued = false;
        this.onDidChangeIsRunQueuedEmitter.fire(this._isRunQueued);
        clearInterval(this._runQueueInterval);
    }

    // flash queue
    protected _isFlashQueued = false;
    protected _flashQueueInterval: any = 0;
    protected readonly onDidChangeIsFlashQueuedEmitter = new Emitter<boolean>();
    readonly onDidChangeIsFlashQueued = this.onDidChangeIsFlashQueuedEmitter.event;
    get isFlashQueued(): boolean {
        return this._isFlashQueued;
    }
    public enqueueFlash(interval: any) {
        this._isFlashQueued = true;
        this.onDidChangeIsFlashQueuedEmitter.fire(this._isFlashQueued);
        this._flashQueueInterval = interval;
    }
    public unqueueFlash() {
        this._isFlashQueued = false;
        this.onDidChangeIsFlashQueuedEmitter.fire(this._isFlashQueued);
        clearInterval(this._flashQueueInterval);
    }
}