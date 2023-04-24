import React from 'react';
import Header from '../ui/Header';

function Footer() {
  return (
    <Header id="footer" reversed customColumns>
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
          <a href="https://cyber.law.harvard.edu/" target="_blank" rel="noreferrer">
            Berkman Klein Center for Internet & Society at Harvard University
          </a>
          .
        </p>
        <p>
          Need help? Join our
          {' '}
          <a href="https://groups.io/g/mediacloud" target="_blank" rel="noreferrer">discussion group</a>
          {' '}
          or fill out
          {' '}
          <a href="https://mediacloud.org/support-form" target="_blank" rel="noreferrer">our support form</a>
          .
          <br />
          Read our&nbsp;
          <a href="https://mediacloud.org/privacy-policy" target="_blank" rel="noreferrer">privacy policy</a>
          {' '}
          and
          {' '}
          <a href="https://mediacloud.org/terms-of-use" target="_blank" rel="noreferrer">terms of use</a>
          .
        </p>
        <p>
          v
          {document.settings.appVersion}
        </p>
      </div>
    </Header>
  );
}

export default Footer;
