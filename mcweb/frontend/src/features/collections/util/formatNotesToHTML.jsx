import React from 'react';

const renderNotes = (notes, featured) => {
  if (featured) {
    const str = String(notes);
    const slicedNotes = str.includes('\n') ? str.split('\n')[0] : str.slice(0, 120);
    return slicedNotes.split('\n').map((line, index) => (
      // eslint-disable-next-line react/no-array-index-key
      <p key={index}>{line}</p>
    ));
  }
  return notes.split('\n').map((line, index) => (
    // eslint-disable-next-line react/no-array-index-key
    <p key={index}>{line}</p>
  ));
};

export default renderNotes;
