import React from 'react';

export const renderNotes = (notes) => {
    return notes.split('\n').map((line, index) => (
      <p key={index}>{line}</p>
    ));
  };