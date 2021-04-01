import { interfaces } from "inversify";
import { bindVesWebViewViews } from "./webview/documentation-webview-view";
import "../../../src/browser/documentation/style/index.css";

export function bindVesDocumentationContributions(bind: interfaces.Bind): void {
  bindVesWebViewViews(bind);
};
