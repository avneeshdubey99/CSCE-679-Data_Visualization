/**
 * matrix.js
 *
 * The year/month grid shared by both levels: the scales that place cells
 * and the axes that label them. Level 1 and Level 2 differ in what they
 * draw inside a cell, not in how the grid itself is laid out, so that part
 * lives here once.
 */

/**
 * Builds the band scales that position cells along each axis.
 *
 * d3.scaleBand is used in both directions because years and months are
 * categorical keys here, not continuous quantities: there is no meaningful
 * position "between" February and March.
 *
 * @param {Array<number>} years Every year to place along the x axis.
 * @param {Object} config Page configuration, for cell size and padding.
 * @returns {{xScale: Function, yScale: Function, plotWidth: number,
 *     plotHeight: number}} Scales and the overall matrix size in pixels.
 */
function buildMatrixScales(years, config) {
  const { cell, cellPadding, monthNames } = config;

  const plotWidth = years.length * (cell.width + cellPadding);
  const plotHeight = monthNames.length * (cell.height + cellPadding);

  // scaleBand expects padding as a fraction of one band, so the pixel gap
  // from the config is converted here rather than being guessed at.
  const horizontalPaddingFraction = cellPadding / (cell.width + cellPadding);
  const verticalPaddingFraction = cellPadding / (cell.height + cellPadding);

  const xScale = d3
    .scaleBand()
    .domain(years)
    .range([0, plotWidth])
    .paddingInner(horizontalPaddingFraction);

  const yScale = d3
    .scaleBand()
    .domain(d3.range(1, monthNames.length + 1))
    .range([0, plotHeight])
    .paddingInner(verticalPaddingFraction);

  return { xScale, yScale, plotWidth, plotHeight };
}

/**
 * Draws the year axis above the matrix and the month axis to its left.
 *
 * Tick marks are removed on both axes: the cell grid already separates the
 * categories, so the ticks would be redundant ink.
 *
 * @param {d3.Selection} plotGroup SVG group holding the matrix.
 * @param {Function} xScale Band scale for years.
 * @param {Function} yScale Band scale for months.
 * @param {Array<string>} monthNames Month labels, January first.
 */
function renderMatrixAxes(plotGroup, xScale, yScale, monthNames) {
  plotGroup
    .append("g")
    .attr("class", "axis axis-year")
    .call(d3.axisTop(xScale).tickFormat(d3.format("d")).tickSize(0))
    .call((axis) => axis.selectAll(".tick line").remove());

  plotGroup
    .append("g")
    .attr("class", "axis axis-month")
    .call(
      d3
        .axisLeft(yScale)
        .tickFormat((monthNumber) => monthNames[monthNumber - 1])
        .tickSize(0)
    )
    .call((axis) => axis.selectAll(".tick line").remove());
}
