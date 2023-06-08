import * as React from 'react';

function SystemAlert() {
  if (document.settings.systemAlert === undefined) {
    return undefined;
  }
  return (
    <div id="system-warning" className="warning">
      <div className="container">
        <div className="row">
          <div className="col-12">
            {/* eslint-disable-next-line react/no-danger */}
            <span dangerouslySetInnerHTML={{ __html: document.settings.systemAlert }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SystemAlert;
