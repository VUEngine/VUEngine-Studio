import * as React from 'react';
import { injectable, postConstruct } from 'inversify';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';

@injectable()
export class VesDocumentationWidget extends ReactWidget {
  static readonly ID = 'vesDocumentationWidget';
  static readonly LABEL = 'Documentation';

  protected buildLogLastElementRef = React.createRef<HTMLDivElement>();

  @postConstruct()
  protected async init(): Promise<void> {
    this.id = VesDocumentationWidget.ID;
    this.title.iconClass = 'fa fa-book';
    this.title.closable = true;
    this.title.label = VesDocumentationWidget.LABEL;
    this.title.caption = VesDocumentationWidget.LABEL;
    this.update();
  }

  protected render(): React.ReactNode {
    return <>

      <div className="theia-alert-message-container">
        <div className="theia-warning-alert">
          <div className="theia-message-header">
            <i className="fa fa-exclamation-circle"></i>&nbsp;
            Here be docs
          </div>
        </div>
      </div >
    </>;
  }
}
