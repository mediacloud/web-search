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
              <a href="https://www.umass.edu/" target="_blank" rel="noreferrer">University of Massachusetts Amherst</a>
              ,&nbsp;
              <a href="https://www.northeastern.edu/" target="_blank" rel="noreferrer">Northeastern University</a>
              , the
              {' '}
              <a href="https://archive.org/about" target="_blank" rel="noreferrer">Internet Archive&apos;s</a>
              {' '}
              <a href="https://web.archive.org" target="_blank" rel="noreferrer">Wayback Machine</a>
              , and the&nbsp;
              <a href="https://cyber.law.harvard.edu/" target="_blank" rel="noreferrer">Berkman Klein Center for Internet & Society at Harvard University</a>
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
