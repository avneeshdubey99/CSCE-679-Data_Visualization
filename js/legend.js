/**
 * legend.js
 *
 * Draws the vertical colour legend that explains the cell fills. Shared by
 * both levels, so the two pages cannot drift apart visually.
 */

/**
 * Renders a continuous colour ramp with a labelled temperature axis.
 *
 * The ramp itself is an SVG linear gradient sampled from the colour scale,
 * which keeps it in step with the scale automatically: change the
 * interpolator in config.js and the legend changes with it.
 *
 * Calling this again on the same group replaces the previous legend, which
 * is what lets Level 1 redraw it when the viewer switches measures.
 *
 * @param {d3.Selection} parentGroup SVG group to draw the legend into.
 * @param {Function} colorScale Sequential scale mapping temperature to colour.
 * @param {Object} legendConfig Width, height, tickCount from the page config.
 * @param {string} gradientId Unique id for the gradient element.
 */
function renderColorLegend(parentGroup, colorScale, legendConfig, gradientId) {
  const { width, height, tickCount } = legendConfig;
  const [coldest, hottest] = colorScale.domain();

  parentGroup.selectAll("*").remove();

  // Sample the scale at evenly spaced points to build the gradient. More
  // stops than this is wasted detail; fewer starts to show banding.
  const gradientStopCount = 24;

  const gradient = parentGroup
    .append("defs")
    .append("linearGradient")
    .attr("id", gradientId)
    // y1 at the bottom and y2 at the top so the hottest colour ends up on
    // top, matching the axis drawn beside it.
    .attr("x1", "0%")
    .attr("x2", "0%")
    .attr("y1", "100%")
    .attr("y2", "0%");

  d3.range(gradientStopCount + 1).forEach((stopIndex) => {
    const position = stopIndex / gradientStopCount;
    gradient
      .append("stop")
      .attr("offset", `${position * 100}%`)
      .attr("stop-color", colorScale(coldest + position * (hottest - coldest)));
  });

  parentGroup
    .append("rect")
    .attr("class", "legend-bar")
    .attr("width", width)
    .attr("height", height)
    .style("fill", `url(#${gradientId})`);

  // The axis runs hottest-at-top to match the gradient direction above.
  const legendAxisScale = d3
    .scaleLinear()
    .domain([hottest, coldest])
    .range([0, height]);

  parentGroup
    .append("g")
    .attr("class", "legend-axis")
    .attr("transform", `translate(${width}, 0)`)
    .call(
      d3
        .axisRight(legendAxisScale)
        .ticks(tickCount)
        .tickFormat((temperature) => `${temperature}°C`)
    );
}

/**
 * Renders a key for the two daily temperature lines used in Level 2.
 *
 * @param {d3.Selection} parentGroup SVG group to draw the key into.
 * @param {Object} lineColors Colours keyed by series name.
 */
function renderLineSeriesLegend(parentGroup, lineColors) {
  const series = [
    { label: "Daily max", color: lineColors.maxTemperature },
    { label: "Daily min", color: lineColors.minTemperature },
  ];

  /** Vertical distance between the two entries, in pixels. */
  const rowHeight = 20;
  /** Length of the colour swatch line, in pixels. */
  const swatchLength = 22;

  const entries = parentGroup
    .selectAll("g.series-legend-entry")
    .data(series)
    .join("g")
    .attr("class", "series-legend-entry")
    .attr("transform", (entry, index) => `translate(0, ${index * rowHeight})`);

  entries
    .append("line")
    .attr("x1", 0)
    .attr("x2", swatchLength)
    .attr("y1", 0)
    .attr("y2", 0)
    .style("stroke", (entry) => entry.color)
    .style("stroke-width", 2.5);

  entries
    .append("text")
    .attr("class", "series-legend-label")
    .attr("x", swatchLength + 8)
    .attr("dy", "0.32em")
    .text((entry) => entry.label);
}
