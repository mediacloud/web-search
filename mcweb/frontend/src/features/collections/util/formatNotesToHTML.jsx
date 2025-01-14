import React from 'react';

const renderNotes = (notes, featured) => {
  if (featured) {
    const slicedNotes = String(notes).slice(0, 99);
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
