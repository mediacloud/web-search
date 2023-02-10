import React from 'react';
import { assetUrl } from '../ui/uiUtil';

export default function AboutSearch() {
  return (
    <div className="container">
      <h1>API Search Guide</h1>
      <p>
        Media Cloud uses a collection of APIs, in conjunction with our own specialized
        collections of sources, to provide as much searchable information as we can.
        While some APIs (like the Wayback Machine) are able to give us more comprehensive
        data such as complete article text, others (such as Youtube), are more limited in
        the information they make available to researchers.
      </p>
      <p>
        We&rsquo;ve included a guide here on all of the APIs currently used by the Media Cloud
        search tool, and what is able to be searched with each one. We are always looking
        for new ways to enrich our research tools, and will update this page to reflect any
        changes over time.
      </p>

      <div className="row">
        <div className="col-6">
          <h3>Wayback Machine</h3>
          <ul>
            <li style={{ width: '60%' }}>
              Search against the Wayback Machine&rsquo;s database through an API we developed
              to be able to search against the large number of sources and collections we
              have developed. Search is against title text.
            </li>
            <li>
              <a href="https://pypi.org/project/wayback-news-search/">Python Package</a>
            </li>
          </ul>
          <h3>Pushshift.io</h3>
          <ul>
            <li style={{ width: '60%' }}>
              Api for searching reddit, we are able to search against certain subreddits or
              reddit at large.
            </li>
            <li>
              Supports attention over time, total attention, samples, words, languages
            </li>
            <li>
              <a href="https://reddit-api.readthedocs.io/en/latest/#what-is-the-purpose-of-this-api">Purpose</a>
            </li>
          </ul>
          <h3>Twitter API</h3>
          <ul>
            <li>
              {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
              Search against twitter, or individual handles, using <a href="https://developer.twitter.com/en/docs/twitter-api">
                twitter&rsquo;s api
                {/* eslint-disable-next-line react/jsx-closing-tag-location */}
              </a>
            </li>
            <li>
              Supports attention over time, total attention, samples, words, languages
            </li>
          </ul>
          <h3>YouTube API</h3>
          <ul>
            <li>
              {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
              We use the <a href="https://developers.google.com/youtube/v3/docs/search/list">
                data api
                {/* eslint-disable-next-line react/jsx-closing-tag-location */}
              </a>
            </li>
            <li>
              This Api is fairly limited, can pretty much only get sample videos
            </li>
          </ul>
        </div>
        <img
          src={assetUrl('img/full_search_screen_AM_search_highlighted.png')}
          alt="screenshot of advanced search"
          width="100%"
          height="90%"
          className="col-6"
          style={{ marginTop: 100, border: '1px solid black' }}
        />
      </div>

      <div className="row" style={{ marginTop: 20 }}>
        <div className="col-6">
          <h2>Simple Search Tool</h2>
          <p>
            Welcome to the search tool! Search phrases are translated automatically into the
            query syntax supported by the platform you are searching against. This saves you
            from having to learn the often esoteric syntax for each platform and API.
          </p>
          <p>
            You also have the option to write queries in plain text with syntax highlighting by
            using the Advanced Search, something users of previous versions of Media Cloud may be
            familiar with.
          </p>
          <ul>
            <li>
              Search phrases are being translated automatically into the query syntax supported by
              the platform you are searching against. This saves you from having to learn the esoteric
              syntax for each platform and API.
            </li>
          </ul>
        </div>
        <img
          src={assetUrl('img/simple_search.png')}
          alt="screenshot of simple search"
          width="100%"
          height="50%"
          className="col-6"
          style={{ marginTop: 100, border: '1px solid black' }}
        />
      </div>
      <br />
      <br />
      <div className="row" style={{ marginTop: 20 }}>
        <img
          src={assetUrl('img/advaced_search_screen.png')}
          alt="screenshot of advanced search"
          width="100%"
          className="col-6"
          style={{ border: '1px solid black' }}
        />
        <div className="col-6">
          <ul>
            <li>
              <h4>
                Advanced Search
              </h4>
            </li>
            <ul>

              <li>
                Option to write queries in plain text with syntax highlighting. Import to make sure
                the query syntax is correct for the chosen platform. Once Advanced search is chosen,
                there is no going back to your query in the Simple Search view.
              </li>
            </ul>
          </ul>
        </div>
      </div>

      <div className="row" style={{ marginTop: 60 }}>
        <div className="col-6">

          <h2>
            Media Picker
          </h2>
          <p>
            Here you can choose collections or sources to search against for each platform tab.
            Due to how we access each platform&rsquo;s API, cross-platform searches are not currently supported.
          </p>
          <ul>
            <li>
              Featured Collections
            </li>
            <ul>
              <li>
                These are curated collections that appear based on platform.
              </li>
              <li>
                Other collections may be available, but these are often the highlights of our
                current collections.
              </li>
            </ul>
            <li>
              Search Collection or Sources for Selected Platform
            </li>
            <ul>
              <li>
                Search for any source or collection from our database, based on platform.
              </li>
              <li>
                We recommend finding sources by searching the domain name of the resource you are interested in.
              </li>
              <li>
                You can add multiple collections and/or sources to a search.
              </li>
            </ul>
          </ul>
        </div>
        <img
          src={assetUrl('img/media_picker_modal.png')}
          alt="screenshot of media picker"
          width="100%"
          className="col-6"
          style={{ border: '1px solid black' }}
        />
      </div>
      <div className="row" style={{ marginTop: 60 }}>
        <img
          src={assetUrl('img/date_picker.png')}
          alt="screenshot of date picker"
          width="100%"
          className="col-6"
          style={{ border: '1px solid black' }}
        />
        <div className="col-6">

          <h2>Date Picker</h2>
          <p>
            You are able to limit a search to specific date periods. The dates that are available
            to search will adjust over time as Media Cloud ingests historical data. Current date
            fields available are:
          </p>
          <ul>
            <li>Date limits</li>
            <ul>
              <li>Wayback Machine before 8/1/22</li>
              <li>Pushshift before 11/1/22</li>
            </ul>
          </ul>
        </div>
      </div>
      <h2>Copy Search</h2>
      <ul>
        <li>
          Ability to copy a url of an in progress query or a query that has been run, to share with others.
        </li>
      </ul>
      <h2>Results</h2>
      <ul>
        <li>Total Attention</li>
        <ul>
          <li>
            See the total number of hits and the % of stories your topic was for a time period
          </li>
        </ul>
        <li>Attention Over Time</li>
        <ul>
          <li>
            Check day by day what the number of hits or % of stories your topic was for a time period
          </li>
        </ul>
        <li>Sample Results</li>
        <ul>
          <li>
            Get a small sample of results from your query, will change depending on platform
          </li>
          <ul>
            <li>
              Option to download all results for each platform
            </li>
          </ul>
        </ul>
        <li>Words (experimental)</li>
        <ul>
          <li>
            Experimental feature to see words that appear most often in results
          </li>
        </ul>
        <li>Languages (experimental)</li>
        <ul>
          <li>
            Experimental feature to see what languages that appear most often in results
          </li>
        </ul>
      </ul>
    </div>
  );
}
