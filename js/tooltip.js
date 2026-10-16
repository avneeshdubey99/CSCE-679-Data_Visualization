/**
 * tooltip.js
 *
 * A small reusable hover tooltip. Both levels create one and hand it the
 * text to show; it owns its own DOM node, positioning and fading.
 */

/**
 * Creates a tooltip attached to the document body.
 *
 * The node is created once and reused for every hover rather than being
 * added and removed, which keeps the fade transitions smooth.
 *
 * @param {number} fadeMs Duration of the fade in and out, in milliseconds.
 * @returns {{show: Function, move: Function, hide: Function}} Tooltip handle.
 */
function createTooltip(fadeMs) {
  const tooltipNode = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  /** Distance from the cursor to the tooltip's corner, in pixels. */
  const cursorOffset = { x: 14, y: 12 };

  /**
   * Moves the tooltip so that it sits just below and right of the cursor.
   *
   * @param {MouseEvent} event The triggering mouse event.
   */
  function move(event) {
    tooltipNode
      .style("left", `${event.pageX + cursorOffset.x}px`)
      .style("top", `${event.pageY + cursorOffset.y}px`);
  }

  return {
    /**
     * Reveals the tooltip with the given text at the cursor.
     *
     * @param {MouseEvent} event The triggering mouse event.
     * @param {string} text Content to display.
     */
    show(event, text) {
      tooltipNode.text(text);
      move(event);
      tooltipNode.transition().duration(fadeMs).style("opacity", 1);
    },

    move,

    /** Fades the tooltip back out. */
    hide() {
      tooltipNode.transition().duration(fadeMs).style("opacity", 0);
    },
  };
}

/**
 * Builds the tooltip caption for one month.
 *
 * Month is zero-padded so every caption has the same width, which stops the
 * tooltip from jittering as the cursor moves between cells.
 *
 * @param {Object} monthlyRecord A record from summarizeByMonth.
 * @returns {string} Caption text, e.g. "Date: 2002-03, max: 28, min: 14".
 */
function formatMonthTooltip(monthlyRecord) {
  const paddedMonth = String(monthlyRecord.month).padStart(2, "0");
  return (
    `Date: ${monthlyRecord.year}-${paddedMonth}, ` +
    `max: ${monthlyRecord.maxTemperature}, ` +
    `min: ${monthlyRecord.minTemperature}`
  );
}
