import React from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';

const OrderedWordCloudRenderer = {

  render: (data, termColor, exent, config) => {
    // setup the wrapper svg
    const innerWidth = config.width - (2 * config.padding);
    const svg = d3.create('svg')
      .attr('height', config.height)
      .attr('width', config.width)
      .attr('id', 'ordered-word-cloud')
      .attr('class', 'word-cloud');

    // start hieght calculations
    let y = config.height;
    let wordNodes;
    const wordListHeight = config.height - (2 * config.padding);
    const wordWrapper = svg.append('g')
      .attr('transform', `translate(${2 * config.padding},0)`);
    const sizeRange = { min: config.minFontSize, max: config.maxFontSize };
    const fullExtent = exent || d3.extent(data, (d) => d.tfnorm);

    // start layout loop
    while ((y >= wordListHeight) && (sizeRange.max > sizeRange.min)) {
      wordNodes = wordWrapper.selectAll('text') // one text per term
        .data(data, (d) => d.term)
        .enter()
        .append('text') // for incoming data
        .attr('class', '')
        .attr('fill', termColor)
        .attr('font-family', 'Lato, Helvetica, sans')
        .classed('word', true)
        .classed('hide', (d) => d.display === false)
        .classed('show', (d) => d.display !== false)
        .classed('selected', (d) => d.term === config.selectedTerm)
        .attr('font-size', (d) => OrderedWordCloudRenderer.fontSizeComputer(d, fullExtent, sizeRange))
        .text((d) => d.term)
        .attr('font-weight', 'bold')
        .on('mouseover', (d) => {
          const { event } = d3;
          d3.select(event.target).attr('fill', config.linkColor)
            .attr('cursor', 'pointer');
        })
        .on('mouseout', () => {
          const { event } = d3;
          d3.select(event.target).attr('fill', config.textColor)
            .attr('cursor', 'arrow');
        });

      // Layout
      y = 0;
      const leftHeight = OrderedWordCloudRenderer.listCloudLayout(wordNodes, innerWidth, fullExtent, sizeRange);
      y = Math.max(y, leftHeight);
      sizeRange.max -= 1;
    }

    // we need to return a DOM element for observable to render
    return svg.node();
  },

  listCloudLayout: (wordNodes, width, extent, sizeRange) => {
    const canvasContext2d = DOM.context2d(300, 300);
    let x = 0;
    if (typeof (wordNodes) === 'undefined') {
      return x;
    }
    wordNodes.attr('x', (d) => {
      const fs = fontSizeComputer(d, extent, sizeRange);
      canvasContext2d.font = `bold ${fs}px Lato`; // crazy hack for IE compat, instead of simply this.getComputedTextLength()
      const metrics = canvasContext2d.measureText(d.term);
      const textLength = metrics.width + 4; // give it a little horizontal spacing between words
      let lastX = x;
      if (x + textLength + 10 > width) { // TODO: replace 10 with state property for padding
        lastX = 0;
      }
      x = lastX + textLength + (0.5 * fs);
      return lastX;
    });
    let y = -0.5 * sizeRange.max;
    let lastAdded = 0;
    wordNodes.attr('y', (d, index, data) => { // need closure here for d3.select to work right on the element
      const xPosition = d3.select(data[index]).attr('x');
      if (xPosition === '0') { // WTF does this come out as a string???!?!?!?!
        const height = 1.2 * fontSizeComputer(d, extent, sizeRange);
        y += height;
        y = Math.max(y, height);
        lastAdded = height;
      }
      return y;
    });
    return y + lastAdded;
  },

  fontSizeComputer: (term, extent, sizeRange) => {
    const size = sizeRange.min + (((sizeRange.max - sizeRange.min)
            * (Math.log(term.tfnorm) - Math.log(extent[0]))) / (Math.log(extent[1]) - Math.log(extent[0])));
    return size;
  },

};

const OrderedWordCloud = ({ width, color, data }) => {
  const ref = React.useRef();

  React.useEffect(() => {
    OrderedWordCloudRenderer.render(
      data,
      color,
      null,
      {
        width,
        height: 250,
        maxTerms: 100,
        maxFontSize: 30,
        minFontSize: 12,
        padding: 0,
        selectedTerm: null,
      },
      d3.select(ref.current),

    );
    return () => {};
  }, data);
  return ref;
};

OrderedWordCloud.propTypes = {
  width: PropTypes.number.isRequired,
  color: PropTypes.number.isRequired,
  data: PropTypes.arrayOf(PropTypes.shape({
    term: PropTypes.string.isRequired,
    count: PropTypes.number.isRequired,
  })).isRequired,
};

export default OrderedWordCloud;
