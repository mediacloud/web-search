import React from 'react';
import { Link } from 'react-router-dom';
import Button from '@mui/material/Button';
import SearchIcon from '@mui/icons-material/Search';
import { assetUrl } from '../ui/uiUtil';

export default function AboutSearch() {
  return (

    <div className="about-page">
      <div className="feature-area filled">
        <div className="container">
          <div className="row">
            <div className="col-12 text-center">
              <h1>
                Media Cloud Search Tool
              </h1>
              <Link
                to="/search"
              >
                <Button
                  variant="contained"
                  endIcon={<SearchIcon titleAccess="search online news and social media" />}
                >
                  Search Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="feature-area">
        <div className="container">
          <div className="row">
            <div className="col-4">
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
            <div className="col-7">
              <img
                src={assetUrl('img/simple_search.jpg')}
                alt="screenshot of simple search"
                style={{ marginTop: '15%' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="feature-area filled">
        <div className="container">
          <div className="row">
            <div className="col-9">
              <img
                src={assetUrl('img/advanced_search.jpg')}
                alt="screenshot of advanced search"
                style={{ marginTop: '5%' }}
              />
            </div>
            <div className="col-3">
              <h2> Advanced Search</h2>
              <p>
                Option to write queries in plain text with syntax highlighting. Import to make sure
                the query syntax is correct for the chosen platform. Once Advanced search is chosen,
                there is no going back to your query in the Simple Search view.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="feature-area ">
        <div className="container">
          <div className="row">
            <div className="col-5">
              <h2>Media Picker</h2>
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
            <div className="col-7">
              <img
                src={assetUrl('img/media_picker_modal.jpg')}
                alt="screenshot of media picker"

              />
            </div>
          </div>
        </div>
      </div>

      <div className="feature-area filled">
        <div className="container">
          <div className="row">
            <div className="col-7">
              <img
                src={assetUrl('img/date_picker.jpg')}
                alt="screenshot of date picker"

              />
            </div>
            <div className="col-4">
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
        </div>
      </div>
      <div className="feature-area">
        <div className="container">
          <div className="row">
            <div className="col-3" style={{ marginTop: '5%' }}>
              <h2>Copy Search</h2>
              <p>
                Copy a url of an in progress query or a query that has been run, to share with others.

              </p>
            </div>
            <div className="col-9">
              <img
                src={assetUrl('img/copy_search.jpg')}
                alt="screenshot of copy search modal"
                style={{ marginLeft: '15%' }}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="feature-area filled">
        <div className="container">
          <div className="row">
            <div className="col-12 text-center">
              <h1>
                Results
              </h1>
            </div>
          </div>
        </div>
      </div>
      <div className="feature-area">
        <div className="container">
          <div className="row">
            <div className="col-4">
              <h2>Total Attention</h2>
              <p>
                See the total number of hits and the % of stories your topic returned for a time period
              </p>
            </div>
            <div className="col-7">
              <img
                src={assetUrl('img/total_attention.jpg')}
                alt="screenshot of total attention"

              />
            </div>
          </div>
        </div>
      </div>

      <div className="feature-area filled">
        <div className="container">
          <div className="row">
            <div className="col-9">
              <img
                src={assetUrl('img/attention_over_time_annotated.jpg')}
                alt="screenshot of attention over time"

              />
            </div>
            <div className="col-3">
              <h2> Attention Over Time</h2>
              <p>
                Check day by day what the number of hits or % of stories your topic was for a time period
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="feature-area">
        <div className="container">
          <div className="row">
            <div className="col-3">
              <h2>Sample Results</h2>
              <p>
                Get a small sample of results from your query, will change depending on platform,
                option to download for each platform
              </p>
            </div>
            <div className="col-9">
              <img
                src={assetUrl('img/sample_content.jpg')}
                alt="screenshot of sample_content"

              />
            </div>
          </div>
        </div>
      </div>

      <div className="feature-area filled">
        <div className="container">
          <div className="row">
            <div className="col-8">
              <img
                src={assetUrl('img/top_words.jpg')}
                alt="screenshot of sample_content"

              />
            </div>
            <div className="col-4">
              <h2> Words (experimental)</h2>
              <p>
                Experimental feature to see words that appear most often in results
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="feature-area">
        <div className="container">
          <div className="row">
            <div className="col-4">
              <h2>Languages (experimental)</h2>
              <p>
                Experimental feature to see what languages that appear most often in results
              </p>
            </div>
            <div className="col-8">
              <img
                src={assetUrl('img/top_languages.jpg')}
                alt="screenshot of sample_content"

              />
            </div>
          </div>
        </div>
      </div>

      <div className="feature-area filled">
        <div className="container">
          <div className="row">
            <div className="col-10 text-center">
              <h1>
                API Search Guide
              </h1>
              <p>
                Media Cloud uses a collection of APIs, in conjunction with our own specialized
                collections of sources, to provide as much searchable information as we can.
                While some APIs (like the Wayback Machine) are able to give us more comprehensive
                data such as complete article text, others (such as Youtube), are more limited in
                the information they make available.
              </p>
              <p>
                We&rsquo;ve included a guide here on all of the APIs currently used by the Media Cloud
                search tool, and what is able to be searched with each one. We are always looking
                for new ways to enrich our research tools, and will update this page to reflect any
                changes over time.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="feature-area">
        <div className="container">
          <div className="row">
            <div className="col-4">
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
                  Search against twitter, or
                  {/* eslint-disable-next-line react/jsx-one-expression-per-line */}

                  individual handles, using
                  {' '}
                  <a href="https://developer.twitter.com/en/docs/twitter-api">
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
            <div className="col-5">
              <img
                src={assetUrl('img/full_search_screen_AM_search_highlighted.jpg')}
                alt="screenshot of advanced search"
                style={{ marginTop: '15%' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
