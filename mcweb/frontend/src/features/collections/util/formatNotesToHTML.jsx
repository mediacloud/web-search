function formatNotesToHTML(text) {
    const sentences = text.split("\n");
    let htmlToShow = "";
    sentences.forEach(sentence => {
        htmlToShow += `<p>${sentence}</p>`;
    });
    return htmlToShow;
}

export default formatNotesToHTML;