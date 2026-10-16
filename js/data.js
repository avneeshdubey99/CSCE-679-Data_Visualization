/**
 * data.js
 *
 * Loads the daily temperature readings and rolls them up into the
 * month-level records that both matrices are drawn from.
 */

/**
 * Reads temperature_daily.csv and converts each row into a typed record.
 *
 * The CSV stores dates as "YYYY-MM-DD" strings and temperatures as text.
 * Year and month are split out here once so that later grouping steps do
 * not have to re-parse the date on every pass.
 *
 * @param {string} dataPath Location of the CSV file.
 * @returns {Promise<Array<Object>>} One record per day.
 */
async function loadDailyReadings(dataPath) {
  return d3.csv(dataPath, (row) => {
    const [year, month, day] = row.date.split("-").map(Number);
    return {
      date: row.date,
      year,
      month,
      day,
      maxTemperature: Number(row.max_temperature),
      minTemperature: Number(row.min_temperature),
    };
  });
}

/**
 * Groups daily readings into one record per calendar month.
 *
 * "Maximum temperature" for a month is the hottest daily high in it, and
 * "minimum temperature" is the coldest daily low — the same convention the
 * assignment's Level 1 reference tooltip uses.
 *
 * Each record also keeps its own daily readings, sorted by day, so that
 * Level 2 can draw a line chart inside the cell without regrouping.
 *
 * @param {Array<Object>} dailyReadings Output of loadDailyReadings.
 * @returns {Array<Object>} One record per year-month present in the data.
 */
function summarizeByMonth(dailyReadings) {
  const monthlyGroups = d3.group(
    dailyReadings,
    (reading) => reading.year,
    (reading) => reading.month
  );

  const monthlyRecords = [];

  monthlyGroups.forEach((monthsInYear, year) => {
    monthsInYear.forEach((readingsInMonth, month) => {
      const daysInOrder = readingsInMonth
        .slice()
        .sort((a, b) => d3.ascending(a.day, b.day));

      monthlyRecords.push({
        year,
        month,
        maxTemperature: d3.max(daysInOrder, (day) => day.maxTemperature),
        minTemperature: d3.min(daysInOrder, (day) => day.minTemperature),
        dailyReadings: daysInOrder,
      });
    });
  });

  return monthlyRecords;
}

/**
 * Lists every year present in the records, in ascending order.
 *
 * @param {Array<Object>} monthlyRecords Output of summarizeByMonth.
 * @returns {Array<number>} Sorted, de-duplicated years.
 */
function listYears(monthlyRecords) {
  return Array.from(new Set(monthlyRecords.map((record) => record.year))).sort(
    d3.ascending
  );
}

/**
 * Keeps only the records belonging to the most recent N years.
 *
 * Used by Level 2, which shows a smaller window than Level 1 so that each
 * cell has room for a legible line chart.
 *
 * @param {Array<Object>} monthlyRecords Output of summarizeByMonth.
 * @param {number} yearCount How many of the latest years to keep.
 * @returns {Array<Object>} The filtered subset of records.
 */
function filterToRecentYears(monthlyRecords, yearCount) {
  const recentYears = new Set(listYears(monthlyRecords).slice(-yearCount));
  return monthlyRecords.filter((record) => recentYears.has(record.year));
}

/**
 * Finds the range of one measure across a set of monthly records.
 *
 * The colour scale is built from the measure actually on screen rather than
 * from both measures combined. Monthly highs (18–37°C here) and monthly
 * lows (3–27°C) occupy different parts of the thermometer, so a shared
 * domain would squeeze each view into half the colour ramp and flatten the
 * contrast. The legend is redrawn whenever the measure changes, so the
 * mapping on screen always matches the colours on screen.
 *
 * @param {Array<Object>} monthlyRecords Output of summarizeByMonth.
 * @param {"maxTemperature"|"minTemperature"} measureKey Field to measure.
 * @returns {[number, number]} The [coldest, hottest] value of that measure.
 */
function measureExtent(monthlyRecords, measureKey) {
  return d3.extent(monthlyRecords, (record) => record[measureKey]);
}

/**
 * Finds the temperature range across every individual daily reading.
 *
 * Level 2 shares one vertical scale across all of its mini line charts so
 * that their shapes can be compared cell to cell; this supplies that scale's
 * domain.
 *
 * @param {Array<Object>} monthlyRecords Output of summarizeByMonth.
 * @returns {[number, number]} The [coldest, hottest] daily temperature.
 */
function dailyTemperatureExtent(monthlyRecords) {
  const allDays = monthlyRecords.flatMap((record) => record.dailyReadings);
  return [
    d3.min(allDays, (day) => day.minTemperature),
    d3.max(allDays, (day) => day.maxTemperature),
  ];
}
