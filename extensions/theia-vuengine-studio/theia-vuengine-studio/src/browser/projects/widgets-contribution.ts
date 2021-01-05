import { interfaces } from "inversify";
import { VesNewProjectDialog, VesNewProjectDialogProps } from "./new-project-dialog";

export function bindVesProjectsWidgets(bind: interfaces.Bind): void {
  bind(VesNewProjectDialog).toSelf().inSingletonScope();
  bind(VesNewProjectDialogProps).toConstantValue({ title: 'New Project' });
}