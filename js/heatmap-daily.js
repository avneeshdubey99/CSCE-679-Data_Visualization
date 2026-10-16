/**
 * heatmap-daily.js — Level 2
 *
 * The same year/month matrix as Level 1, restricted to the most recent
 * years, with a miniature line chart drawn inside every cell showing how
 * the daily maximum and minimum moved through that month.
 *
 * The cell fill still encodes the month's highest temperature, so the
 * matrix keeps its overview reading while the lines add the detail.
 */

/**
 * Builds the scale that converts a day number into an x position inside a
 * cell's line chart.
 *
 * The domain is fixed at 1–31 rather than taken per month, so a short
 * month's line does not stretch to fill the cell and mislead by implying
 * the same span as a 31-day month.
 *
 * @param {Object} config Page configuration.
 * @param {number} cellWidth Width of one cell, in pixels.
 * @returns {Function} Linear scale from day of month to x offset.
 */
function buildDayScale(config, cellWidth) {
  const { sparklinePadding } = config;
  /** Longest possible month, used so every cell shares one horizontal scale. */
  const maxDaysInMonth = 31;

  return d3
    .scaleLinear()
    .domain([1, maxDaysInMonth])
    .range([sparklinePadding.left, cellWidth - sparklinePadding.right]);
}

/**
 * Builds the scale that converts a temperature into a y position inside a
 * cell's line chart.
 *
 * Every cell shares this scale so the sparkline shapes can be compared
 * across months and years.
 *
 * @param {[number, number]} dailyExtent Coldest and hottest daily readings.
 * @param {Object} config Page configuration.
 * @param {number} cellHeight Height of one cell, in pixels.
 * @returns {Function} Linear scale from temperature to y offset.
 */
function buildSparklineTemperatureScale(dailyExtent, config, cellHeight) {
  const { sparklinePadding } = config;

  return d3
    .scaleLinear()
    .domain(dailyExtent)
    // Range is inverted because SVG y grows downwards but temperature
    // should grow upwards.
    .range([cellHeight - sparklinePadding.bottom, sparklinePadding.top]);
}

/**
 * Draws the two daily temperature lines inside a single cell.
 *
 * @param {d3.Selection} cellGroup SVG group positioned at the cell's origin.
 * @param {Array<Object>} dailyReadings That month's readings, ordered by day.
 * @param {Function} dayScale Day number to x offset.
 * @param {Function} temperatureScale Temperature to y offset.
 * @param {Object} lineColors Stroke colour per series.
 * @param {number} strokeWidth Stroke width in pixels.
 */
function renderCellSparklines(
  cellGroup,
  dailyReadings,
  dayScale,
  temperatureScale,
  lineColors,
  strokeWidth
) {
  /**
   * Creates a line generator for one of the two temperature series.
   *
   * @param {"maxTemperature"|"minTemperature"} measureKey Field to plot.
   * @returns {Function} d3 line generator.
   */
  function lineGeneratorFor(measureKey) {
    return d3
      .line()
      .x((reading) => dayScale(reading.day))
      .y((reading) => temperatureScale(reading[measureKey]));
  }

  // Minimum is drawn first so the maximum line sits on top where they
  // touch, matching the reference image.
  const seriesInDrawOrder = ["minTemperature", "maxTemperature"];

  seriesInDrawOrder.forEach((measureKey) => {
    cellGroup
      .append("path")
      .attr("class", `sparkline-path sparkline-${measureKey}`)
      .attr("d", lineGeneratorFor(measureKey)(dailyReadings))
      .style("stroke", lineColors[measureKey])
      .style("stroke-width", strokeWidth);
  });
}

/**
 * Renders the Level 2 heatmap.
 *
 * @param {Array<Object>} monthlyRecords Records already filtered to the
 *     years that should be shown.
 * @param {Object} config Page configuration (LEVEL2_CONFIG).
 */
function renderLevel2Heatmap(monthlyRecords, config) {
  const {
    margin,
    monthNames,
    colorInterpolator,
    legend,
    tooltipFadeMs,
    sparklineColors,
    sparklineStrokeWidth,
  } = config;

  const years = listYears(monthlyRecords);
  const { xScale, yScale, plotWidth, plotHeight } = buildMatrixScales(
    years,
    config
  );

  // Cells are filled by the month's highest temperature, so the colour
  // domain is the range of that measure alone.
  const colorScale = d3
    .scaleSequential(colorInterpolator)
    .domain(measureExtent(monthlyRecords, "maxTemperature"));

  const dayScale = buildDayScale(config, xScale.bandwidth());
  const temperatureScale = buildSparklineTemperatureScale(
    dailyTemperatureExtent(monthlyRecords),
    config,
    yScale.bandwidth()
  );

  const svg = d3
    .select(config.containerSelector)
    .append("svg")
    .attr("width", plotWidth + margin.left + margin.right)
    .attr("height", plotHeight + margin.top + margin.bottom);

  const plotGroup = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  renderMatrixAxes(plotGroup, xScale, yScale, monthNames);

  const tooltip = createTooltip(tooltipFadeMs);

  // Each cell is a group holding its background rect and its sparklines, so
  // the two move together if the layout changes.
  const cellGroups = plotGroup
    .selectAll("g.matrix-cell-group")
    .data(monthlyRecords)
    .join("g")
    .attr("class", "matrix-cell-group")
    .attr(
      "transform",
      (record) => `translate(${xScale(record.year)}, ${yScale(record.month)})`
    );

  cellGroups
    .append("rect")
    .attr("class", "matrix-cell")
    .attr("width", xScale.bandwidth())
    .attr("height", yScale.bandwidth())
    .attr("rx", config.cellCornerRadius)
    .style("fill", (record) => colorScale(record.maxTemperature))
    .on("mouseover", (event, record) =>
      tooltip.show(event, formatMonthTooltip(record))
    )
    .on("mousemove", (event) => tooltip.move(event))
    .on("mouseout", () => tooltip.hide());

  cellGroups.each(function (record) {
    const sparklineGroup = d3
      .select(this)
      .append("g")
      .attr("class", "sparkline-group");

    renderCellSparklines(
      sparklineGroup,
      record.dailyReadings,
      dayScale,
      temperatureScale,
      sparklineColors,
      sparklineStrokeWidth
    );
  });

  renderLevel2Legends(svg, colorScale, config, plotWidth);
}

/**
 * Draws the colour ramp and the line-series key in the right-hand margin.
 *
 * @param {d3.Selection} svg Root SVG element.
 * @param {Function} colorScale Sequential temperature colour scale.
 * @param {Object} config Page configuration.
 * @param {number} plotWidth Width of the matrix, in pixels.
 */
function renderLevel2Legends(svg, colorScale, config, plotWidth) {
  const { margin, legend, sparklineColors } = config;

  const legendGroup = svg
    .append("g")
    .attr(
      "transform",
      `translate(${margin.left + plotWidth + legend.offsetLeft}, ${margin.top})`
    );

  legendGroup
    .append("text")
    .attr("class", "legend-title")
    .attr("y", -12)
    .text("Monthly max");

  renderColorLegend(legendGroup, colorScale, legend, "level2-legend-gradient");

  /** Gap between the bottom of the colour ramp and the line key. */
  const lineLegendOffsetTop = 36;

  const seriesLegendGroup = legendGroup
    .append("g")
    .attr("transform", `translate(0, ${legend.height + lineLegendOffsetTop})`);

  seriesLegendGroup
    .append("text")
    .attr("class", "legend-title")
    .attr("y", -14)
    .text("Daily readings");

  renderLineSeriesLegend(seriesLegendGroup, sparklineColors);
}

/** Entry point: load the data, trim it to the recent window, then draw. */
async function initializeLevel2() {
  const dailyReadings = await loadDailyReadings(LEVEL2_CONFIG.dataPath);
  const allMonthlyRecords = summarizeByMonth(dailyReadings);
  const recentMonthlyRecords = filterToRecentYears(
    allMonthlyRecords,
    LEVEL2_CONFIG.recentYearCount
  );
  renderLevel2Heatmap(recentMonthlyRecords, LEVEL2_CONFIG);
}

initializeLevel2();
