// function formatNotesToHTML(text) {
//     const sentences = text.split("\n");
//     let htmlToShow = "";
//     sentences.forEach(sentence => {
//         htmlToShow += `<p>${sentence}</p>`;
//     });
//     return htmlToShow;
// }

// export default formatNotesToHTML;


// function formatNotesToHTML(text) {
//     return text.split("\n").map((sentence, index) => (
//         <p key={index}>{sentence}</p>
//     ));
// }

// export default formatNotesToHTML;

// export default function formatNotesToHTML(notes) {
//     if (!notes) return null;
  
//     // Split the notes by newline characters and filter out empty lines
//     const paragraphs = notes.split('\n').filter(line => line.trim() !== '');
  
//     // Map each line to a <p> element
//     return paragraphs.map((paragraph, index) => (
//       <p key={index}>{paragraph}</p>
//     ));
//   }
import React from 'react';
export const renderNotes = (notes) => {
    return notes.split('\n').map((line, index) => (
      <p key={index}>{line}</p>
    ));
  };
  