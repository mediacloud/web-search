import React from 'react';
import releases from '../../../static/about/release_history.json';

export default function ReleaseNotes() {
  return (
    <div className="container">
      <h1>Release Notes</h1>
      {releases.map((release) => (
        <div key={release.version}>
          <h2>
            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
            {release.version} - {release.date}
          </h2>

          <h5>Changes</h5>
          <ul>
            {release.notes.map((note) => (
              <li key={note}>
                {note}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
