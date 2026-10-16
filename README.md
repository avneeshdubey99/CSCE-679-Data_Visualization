# Hong Kong Temperature Heatmap

CSCE 679 Data Visualization — Assignment 1
Avneesh Dubey

Daily temperature readings for Hong Kong from 1997 to 2017, visualized as a
year/month matrix with D3 v7.

- **Level 1** (`level1.html`) — one cell per month across all 21 years,
  coloured by that month's temperature, with a toggle between the monthly
  maximum and the monthly minimum.
- **Level 2** (`level2.html`) — the last 10 years, with a miniature line
  chart inside each cell tracing that month's daily highs and lows.

## Running it

The pages load the CSV with `fetch`, so they need to be served over HTTP
rather than opened directly from the filesystem:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000/>. D3 is vendored in `js/lib/`, so no
network connection is needed.

## Project structure

```
index.html            Landing page linking to both levels
level1.html           Level 1 page
level2.html           Level 2 page
css/styles.css        All presentation styling
js/config.js          Every tunable constant for both levels
js/data.js            CSV loading and month-level aggregation
js/matrix.js          Grid scales and axes, shared by both levels
js/tooltip.js         Reusable hover tooltip
js/legend.js          Reusable colour ramp and line-series key
js/heatmap.js         Level 1 rendering
js/heatmap-daily.js   Level 2 rendering
data/                 temperature_daily.csv
js/lib/d3.min.js      D3 v7.8.5
```

The two levels share everything except what gets drawn inside a cell.
`matrix.js`, `legend.js`, `tooltip.js` and `data.js` are used unchanged by
both, so a change to the grid or the tooltip applies to each level at once.

### Changing things

All dimensions, colours, paddings and labels live in `js/config.js`. No
pixel value or colour is hard-coded in the drawing code. For example:

| To change | Edit |
| --- | --- |
| Cell size | `cell.width` / `cell.height` |
| Colour palette | `colorInterpolator` (any d3 sequential interpolator) |
| Years shown in Level 2 | `recentYearCount` |
| Daily line colours | `sparklineColors` |
| Legend size or ticks | `legend` |

## Design decisions

**Colour scale.** `d3.interpolateYlOrRd`, a sequential ramp running from
pale yellow through orange to dark red. Temperature is a quantitative
attribute with no meaningful midpoint, so a sequential scheme is the correct
choice over a diverging one, and ordering by luminance keeps it readable in
greyscale and under colour vision deficiency.

**The colour domain follows the measure on screen.** Monthly highs span
18–37 °C and monthly lows span 3–27 °C. A single domain covering both would
confine each view to roughly half the ramp and flatten the contrast, so the
domain is recomputed when the measure changes. Because that alters what each
colour means, the legend is redrawn at the same time — the key on screen
always describes the cells on screen.

**Monthly aggregation.** A month's maximum is the hottest daily high in it
and its minimum is the coldest daily low, which is what the Level 1
reference tooltip shows for March 2002 (max 28, min 14).

**Level 2 cell fill.** Cells are coloured by the month's maximum, so the
matrix keeps the same overview reading as Level 1 while the lines supply the
within-month detail.

**Shared scales across Level 2 cells.** Every mini line chart uses the same
vertical temperature scale and the same horizontal day scale, fixed to a
31-day month. Per-cell scales would make a mild month look as variable as an
extreme one and would stretch a 28-day February across the same width as a
31-day January, so shapes could not be compared cell to cell.

**Band scales for both axes.** Years and months are categorical keys —
there is no meaningful position between February and March — so `scaleBand`
is used rather than a linear or time scale.

**Axis tick marks removed.** The grid of cells already separates the
categories; tick marks would be redundant ink.

## Data

`data/temperature_daily.csv` — 7,532 daily records from 1997-01-01 to
2017-10-28, with columns `date`, `max_temperature`, `min_temperature`.
November and December 2017 are absent from the source data, so those cells
are absent from the matrix rather than drawn empty.
