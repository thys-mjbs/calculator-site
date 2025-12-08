/* Global script file for all calculators */

/* Utility: safely convert numeric input */
function toNumber(value) {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

/* Utility: format a number with commas and two decimals */
function formatNumberTwoDecimals(value) {
  const num = Number(value);
  if (isNaN(num)) {
    return "0.00";
  }

  return num.toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/* Utility: format a currency with a symbol (default R) */
function formatCurrency(amount, symbol = "R") {
  return symbol + formatNumberTwoDecimals(amount);
}

/* Placeholder: calculators can call this if needed */
function initCalculator() {
  console.log("Global script loaded");
}
