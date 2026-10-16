/**
 * config.js
 *
 * Every tunable value for both visualizations lives here. Nothing in the
 * drawing code hard-codes a pixel size, a colour or a label: changing the
 * cell size, the palette or the number of years on screen is a one-line
 * edit in this file.
 */

/** Values shared by the Level 1 and Level 2 matrices. */
const SHARED_CONFIG = {
  /** Path to the source data, relative to the HTML page that loads it. */
  dataPath: "data/temperature_daily.csv",

  /**
   * Month labels in calendar order. The index of a label is also its
   * month number minus one, so this array doubles as the y-axis domain.
   */
  monthNames: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],

  /**
   * d3 interpolator used to map a temperature to a colour.
   *
   * YlOrRd (pale yellow -> orange -> dark red) reproduces the warm palette
   * of the reference images. Swap in d3.interpolateSpectral or any other
   * sequential interpolator here and both levels follow automatically.
   */
  colorInterpolator: d3.interpolateYlOrRd,

  /** Milliseconds the tooltip takes to fade in and out. */
  tooltipFadeMs: 120,
};

/** Level 1: one cell per month, coloured by that month's temperature. */
const LEVEL1_CONFIG = {
  ...SHARED_CONFIG,

  /** CSS selector of the element the chart is rendered into. */
  containerSelector: "#chart",

  /** Space reserved around the plotting area for axis labels and legend. */
  margin: { top: 60, right: 140, bottom: 30, left: 90 },

  /** Size of a single matrix cell, in pixels. */
  cell: { width: 38, height: 38 },

  /** Gap between neighbouring cells, in pixels. */
  cellPadding: 4,

  /** Corner rounding of each cell, in pixels. */
  cellCornerRadius: 3,

  /** Dimensions and tick count of the vertical colour legend. */
  legend: {
    width: 16,
    height: 320,
    tickCount: 6,
    /** Distance from the right edge of the matrix to the legend bar. */
    offsetLeft: 40,
  },
};

/** Level 2: the same matrix, with a daily line chart drawn inside each cell. */
const LEVEL2_CONFIG = {
  ...SHARED_CONFIG,

  containerSelector: "#chart",

  margin: { top: 60, right: 150, bottom: 30, left: 90 },

  /**
   * Cells are wider here because each one has to hold a readable line
   * chart of up to 31 daily readings.
   */
  cell: { width: 88, height: 62 },

  cellPadding: 6,

  cellCornerRadius: 2,

  /**
   * How many of the most recent years to show. The assignment asks for the
   * last 5 to 10 years; the reference image shows 10.
   */
  recentYearCount: 10,

  /** Padding between a cell's edge and the mini line chart inside it. */
  sparklinePadding: { top: 6, right: 4, bottom: 6, left: 4 },

  /** Stroke width of the daily temperature lines, in pixels. */
  sparklineStrokeWidth: 1.4,

  /** Line colours for the two daily series, matching the reference image. */
  sparklineColors: {
    maxTemperature: "#2e7d32",
    minTemperature: "#b0bec5",
  },

  legend: {
    width: 16,
    height: 320,
    tickCount: 6,
    offsetLeft: 40,
  },
};
