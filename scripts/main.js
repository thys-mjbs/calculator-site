/* Global script file for all calculators */

/* Utility: safely convert numeric input */
function toNumber(value) {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

/* Placeholder: calculators will call this */
function initCalculator() {
  console.log("Global script loaded");
}
