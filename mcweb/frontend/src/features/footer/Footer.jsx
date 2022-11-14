import React from 'react';

function Footer() {
  return (
    <div id="footer" className="feature-area reverse">
      <div className="container">
        <div className="row">
          <div className="col-8 offset-2">
            <p>
              Media Cloud is a consortium research project
              across multiple institutions, including the&nbsp;
              <a href="https://www.umass.edu/">University of Massachusetts Amherst</a>
              ,&nbsp;
              <a href="https://www.northeastern.edu/">Northeastern University</a>
              , and the&nbsp;
              <a href="https://cyber.law.harvard.edu/">Berkman Klein Center for Internet & Society at Harvard University</a>
              .
            </p>
            <p>
              v
              { document.settings.appVersion }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Footer;
