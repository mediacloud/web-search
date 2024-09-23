import React from 'react';
import Header from '../ui/Header';

function Footer() {
  return (
    <Header id="footer" reversed customColumns>
      <div className="col-8 offset-2">
        <p>
          Media Cloud is a consortium collaboration between the&nbsp;
          {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
          <a href="https://www.mediaecosystems.org/" target="_blank" rel="noreferrer">Media Ecosystems Analysis Group</a>,&nbsp;
          {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
          the <a href="https://www.umass.edu/" target="_blank" rel="noreferrer">University of Massachusetts Amherst</a>,&nbsp;
          {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
          and <a href="https://www.northeastern.edu/" target="_blank" rel="noreferrer">Northeastern University</a>.&nbsp;
          {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
          Learn more about&nbsp;
          <a href="https://www.mediacloud.org/consortium" target="_blank" rel="noreferrer">
            the consortium on mediacloud.org
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
          <a href="https://mediacloud.org/contact" target="_blank" rel="noreferrer">our support form</a>
          .
          <br />
          Read our
          {' '}
          <a href="https://www.mediacloud.org/legal/media-cloud-privacy-policy" target="_blank" rel="noreferrer">privacy policy</a>
          {' '}
          and
          {' '}
          <a href="https://www.mediacloud.org/legal/media-cloud-terms-of-use" target="_blank" rel="noreferrer">terms of use</a>
          .
        </p>
        <p>
          This material is based upon work supported by the National Science Foundation under Grant No. 2341858.
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
