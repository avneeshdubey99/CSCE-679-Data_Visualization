/**
 * heatmap.js — Level 1
 *
 * Year/month matrix in which each cell is one calendar month, filled with
 * the colour of either that month's highest or lowest temperature.
 *
 * The matrix is drawn once; switching between the two measures only
 * recolours the existing cells rather than rebuilding them.
 *
 * The grid scales and axes come from matrix.js, which Level 2 shares.
 */

/**
 * Renders the Level 1 heatmap and wires up its measure toggle.
 *
 * @param {Array<Object>} monthlyRecords Output of summarizeByMonth.
 * @param {Object} config Page configuration (LEVEL1_CONFIG).
 */
function renderLevel1Heatmap(monthlyRecords, config) {
  const { margin, monthNames, colorInterpolator, legend, tooltipFadeMs } =
    config;

  const years = listYears(monthlyRecords);
  const { xScale, yScale, plotWidth, plotHeight } = buildMatrixScales(
    years,
    config
  );

  // The domain is set per measure in applyMeasure below, so each view uses
  // the whole colour ramp instead of half of it.
  const colorScale = d3.scaleSequential(colorInterpolator);

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

  const cells = plotGroup
    .selectAll("rect.matrix-cell")
    .data(monthlyRecords)
    .join("rect")
    .attr("class", "matrix-cell")
    .attr("x", (record) => xScale(record.year))
    .attr("y", (record) => yScale(record.month))
    .attr("width", xScale.bandwidth())
    .attr("height", yScale.bandwidth())
    .attr("rx", config.cellCornerRadius)
    .on("mouseover", (event, record) =>
      tooltip.show(event, formatMonthTooltip(record))
    )
    .on("mousemove", (event) => tooltip.move(event))
    .on("mouseout", () => tooltip.hide());

  // The legend lives in the right-hand margin. Its caption sits outside the
  // group that gets cleared on redraw so it is written only once.
  const legendOrigin = svg
    .append("g")
    .attr(
      "transform",
      `translate(${margin.left + plotWidth + legend.offsetLeft}, ${margin.top})`
    );

  const legendCaption = legendOrigin
    .append("text")
    .attr("class", "legend-title")
    .attr("y", -12);

  const legendGroup = legendOrigin.append("g");

  /** Caption shown above the legend for each measure. */
  const measureCaptions = {
    maxTemperature: "Monthly max",
    minTemperature: "Monthly min",
  };

  /**
   * Switches the view to the given measure.
   *
   * Rescaling the colour domain to the chosen measure means the legend has
   * to be redrawn alongside the cells, or it would describe a mapping that
   * is no longer on screen.
   *
   * @param {"maxTemperature"|"minTemperature"} measureKey Record field to show.
   */
  function applyMeasure(measureKey) {
    colorScale.domain(measureExtent(monthlyRecords, measureKey));
    cells.style("fill", (record) => colorScale(record[measureKey]));
    legendCaption.text(measureCaptions[measureKey]);
    renderColorLegend(
      legendGroup,
      colorScale,
      legend,
      "level1-legend-gradient"
    );
  }

  wireMeasureToggle(applyMeasure);
}

/**
 * Connects the max/min buttons to a callback and applies the initial state.
 *
 * The buttons carry their record field in a data-measure attribute, so
 * adding a third measure later needs no change to this function.
 *
 * @param {Function} onMeasureChange Called with the selected record field.
 */
function wireMeasureToggle(onMeasureChange) {
  const buttons = d3.selectAll(".measure-button");

  buttons.on("click", function () {
    const selectedMeasure = d3.select(this).attr("data-measure");
    buttons.classed("is-active", false);
    d3.select(this).classed("is-active", true);
    onMeasureChange(selectedMeasure);
  });

  const initialButton = buttons.filter(".is-active");
  onMeasureChange(initialButton.attr("data-measure"));
}

/** Entry point: load the data, then draw. */
async function initializeLevel1() {
  const dailyReadings = await loadDailyReadings(LEVEL1_CONFIG.dataPath);
  const monthlyRecords = summarizeByMonth(dailyReadings);
  renderLevel1Heatmap(monthlyRecords, LEVEL1_CONFIG);
}

initializeLevel1();
