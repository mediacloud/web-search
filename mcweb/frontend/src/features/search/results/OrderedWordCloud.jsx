import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';

/**
 * The approach here is to keep the d3 rendering isolated from the react as much as possible. So the React
 * component just delegates rendering to the rendered object, which is just a set of funcitons that use d3
 * to actually do the work. Note that the React component needs to pass in the element to render to, and a
 * canvas to the renderer, so it uses `useRef` and `useEffect` to get the d3 code to render to the virtual DOM
 * it is building.
 */

const OrderedWordCloudRenderer = {

  render: (wrapperEl, canvasEl, data, termColor, exent, config) => {
    // setup the wrapper svg
    const innerWidth = config.width - (2 * config.padding);
    const wrapper = d3.select(wrapperEl);
    const svg = wrapper.append('svg')
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
    const fullExtent = exent || d3.extent(data, (d) => d.term_ratio);

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
        .attr('font-weight', 'bold');

      // Layout
      y = 0;
      const leftHeight = OrderedWordCloudRenderer.listCloudLayout(canvasEl, wordNodes, innerWidth, fullExtent, sizeRange);
      y = Math.max(y, leftHeight);
      sizeRange.max -= 1;
    }

    // we need to return a DOM element for observable to render
    return svg.node();
  },

  listCloudLayout: (canvasEl, wordNodes, width, extent, sizeRange) => {
    const canvasContext2d = canvasEl.getContext('2d');
    let x = 0;
    if (typeof (wordNodes) === 'undefined') {
      return x;
    }
    wordNodes.attr('x', (d) => {
      const fs = OrderedWordCloudRenderer.fontSizeComputer(d, extent, sizeRange);
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
        const height = OrderedWordCloudRenderer.fontSizeComputer(d, extent, sizeRange);
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
            * (Math.log(term.term_ratio) - Math.log(extent[0]))) / (Math.log(extent[1]) - Math.log(extent[0])));
    return size;
  },

};

export default function OrderedWordCloud({ width, color, data }) {
  const canvasRef = useRef(null);
  const d3WrapperRef = useRef(null);

  useEffect(
    () => {
      if (data && canvasRef && d3WrapperRef) {
        OrderedWordCloudRenderer.render(
          d3WrapperRef.current,
          canvasRef.current,
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
        );
      }
    },
    [data, d3WrapperRef.current, canvasRef.current],
  );
  console.log(data);
  // the canvas item is required to compute font metrics for the terms in the word cloud
  return (
    <>
      <div ref={d3WrapperRef} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </>
  );
}

OrderedWordCloud.propTypes = {
  width: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  data: PropTypes.arrayOf(PropTypes.shape({
    term: PropTypes.string.isRequired,
    doc_count: PropTypes.number.isRequired,
    doc_ratio: PropTypes.number.isRequired,
    term_ratio: PropTypes.number.isRequired,
    term_count: PropTypes.number.isRequired,
    sample_size: PropTypes.number.isRequired,
  })).isRequired,
};
