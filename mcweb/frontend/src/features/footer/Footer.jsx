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
          <br />
          {/* eslint-disable-next-line react/jsx-one-expression-per-line, max-len */}
          the <a href="https://publicinfrastructure.org/" target="_blank" rel="noreferrer">Initiative for Digital Public Infrastructure</a> at&nbsp;
          {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
          <a href="https://www.umass.edu/" target="_blank" rel="noreferrer">University of Massachusetts Amherst</a>,&nbsp;
          <br />
          {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
          and <a href="https://camd.northeastern.edu/journalism/" target="_blank" rel="noreferrer">the School of Journalism </a>
          {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
          at&nbsp;
          {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
          <a href="https://www.northeastern.edu/" target="_blank" rel="noreferrer">Northeastern University</a>,&nbsp;
          <br />
          {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
          Learn more about&nbsp;
          <a href="https://www.mediacloud.org/consortium" target="_blank" rel="noreferrer">
            the consortium on mediacloud.org
          </a>
          .

        </p>
        <p>
          This material is based upon work supported by the National Science Foundation under
          {' '}
          <a href="https://www.nsf.gov/awardsearch/showAward?AWD_ID=2341858&HistoricalAwards=false">
            Grant No. 2341858.
          </a>
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
          <a href="https://www.mediacloud.org/legal/media-cloud-privacy-policy" target="_blank" rel="noreferrer">
            privacy policy
          </a>
          {' '}
          and
          {' '}
          <a href="https://www.mediacloud.org/legal/media-cloud-terms-of-use" target="_blank" rel="noreferrer">terms of use</a>
          {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
          .
        </p>
        <p>
          Using Media Cloud tools and data?
          {' '}
          <a href="https://ojs.aaai.org/index.php/ICWSM/article/view/18127" target="_blank" rel="noreferrer">
            Please cite us.
          </a>
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
