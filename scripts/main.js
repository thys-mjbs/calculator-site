/* Global script file for all calculators */

/* Utility: safely convert numeric input (removes commas) */
function toNumber(value) {
  if (typeof value !== "string") {
    value = String(value || "");
  }

  const cleaned = value.replace(/,/g, "").trim();
  const num = parseFloat(cleaned);
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

/* Utility: format an input string with commas (no forced decimals) */
function formatInputWithCommas(value) {
  if (typeof value !== "string") {
    value = String(value || "");
  }

  // Remove existing commas
  let cleaned = value.replace(/,/g, "");

  // Split integer and decimal part
  const parts = cleaned.split(".");
  let integerPart = parts[0] || "";
  const decimalPart = parts[1] || "";

  // If not a number at all, just return empty
  if (integerPart === "" && decimalPart === "") {
    return "";
  }

  // Remove any non-digit from integer part
  integerPart = integerPart.replace(/\D/g, "");

  if (integerPart === "") {
    return "";
  }

  // Add commas to integer part
  const withCommas = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // Reattach decimal part if user typed it
  if (decimalPart !== "") {
    return withCommas + "." + decimalPart;
  }

  return withCommas;
}

/* Placeholder: calculators can call this if needed */
function initCalculator() {
  console.log("Global script loaded");
}
