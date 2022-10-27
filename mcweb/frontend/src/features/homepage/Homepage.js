import * as React from 'react';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';

export default function Homepage(props) {
  return (
    <div id="homepage">

      <div className="feature-area">
        <div className="container">
          <div className="row">
            <div className="col-12 text-center">
              <h1>Media Cloud is an open-source platform<br />for media analysis.</h1>
              <Link to="/search"><Button variant="contained">Search Now</Button></Link>
            </div>
          </div>
        </div>
      </div>

      <div className="feature-area filled">
        <div className="container">
          <div className="row">
            <div className="col-5 offset-1">
              <h2>Search Online News & Social Media</h2>
              <p>
              Our search tools let you author queries across media platforms, without having to worry about platform-specific search syntax. Based on what their APIs support, we can show attention over time, total attention, and sample matching content. This lets you quickly narrow in on a query to find exactly the type of conten you are looking for.
              </p>
            </div>
            <div className="col-5">
              [screenshot]
            </div>
          </div>
        </div>
      </div>

      <div className="feature-area">
        <div className="container">
          <div className="row">
            <div className="col-5 offset-1">
              [screenshot]
            </div>
            <div className="col-5">
              <h2>Track Attention Over Time</h2>
              <p>
              Media Cloud shows you attention to an issue over time to help you understand how much it is covered. Our data can reveal key events that cause spikes in coverage and conversation. Plateaus can reveal stable, "normal", levels of attention to compare against. You can download all our charts and the underlying aggregated data.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="feature-area filled">
        <div className="container">
          <div className="row">
            <div className="col-5 offset-1">
              <h2>Search with Global Coverage</h2>
              <p>
              For online news, Media Cloud supports searching individual media sources, or across media sources grouped into collections. We have collections covering top media sources in over 100 countries, and add more all the time. Media Cloud also lets you search by language, including various levels of support for English, Spanish, Arabic, Japanese, and other languages.
              </p>
            </div>
            <div className="col-5">
              [screenshot]
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
