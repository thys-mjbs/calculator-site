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

/* Utility: format an input string with commas, allowing decimals */
function formatInputWithCommas(value) {
  if (typeof value !== "string") {
    value = String(value || "");
  }

  // Remove existing commas
  let cleaned = value.replace(/,/g, "");

  if (cleaned === "") {
    return "";
  }

  const hasDot = cleaned.includes(".");
  let [integerPart, decimalPart = ""] = cleaned.split(".");

  // Strip non-digits from integer and decimal parts
  integerPart = integerPart.replace(/\D/g, "");
  decimalPart = decimalPart.replace(/\D/g, "").slice(0, 2); // max 2 decimals

  if (integerPart === "") {
    // If user is trying to type ".xx", treat as "0.xx"
    if (decimalPart !== "") {
      return "0." + decimalPart;
    }
    return "";
  }

  // Add commas to integer part
  const withCommas = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // If user just typed a dot and no decimals yet, keep trailing dot
  if (hasDot && value.endsWith(".") && decimalPart === "") {
    return withCommas + ".";
  }

  // If there is a decimal part, append it
  if (hasDot && decimalPart !== "") {
    return withCommas + "." + decimalPart;
  }

  // No decimal part
  return withCommas;
}

/* Placeholder: calculators can call this if needed */
function initCalculator() {
  console.log("Global script loaded");
}

/* =========================
   MOBILE NAV TOGGLE
   ========================= */

document.addEventListener("DOMContentLoaded", function () {
  const toggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (!toggle || !navLinks) return;

  toggle.addEventListener("click", function () {
    const isOpen = navLinks.classList.toggle("open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
});
