document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const modeSelect = document.getElementById("modeSelect");
  const modeBlockKnown = document.getElementById("modeBlockKnown");
  const modeBlockEstimate = document.getElementById("modeBlockEstimate");

  const monthlyUsageKl = document.getElementById("monthlyUsageKl");
  const peopleCount = document.getElementById("peopleCount");
  const litersPerPersonPerDay = document.getElementById("litersPerPersonPerDay");
  const daysInMonth = document.getElementById("daysInMonth");

  const ratePerKl = document.getElementById("ratePerKl");
  const fixedFee = document.getElementById("fixedFee");
  const wastewaterPercent = document.getElementById("wastewaterPercent");
  const vatPercent = document.getElementById("vatPercent");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Add every input that should live-format with commas
  attachLiveFormatting(monthlyUsageKl);
  attachLiveFormatting(peopleCount);
  attachLiveFormatting(litersPerPersonPerDay);
  attachLiveFormatting(daysInMonth);
  attachLiveFormatting(ratePerKl);
  attachLiveFormatting(fixedFee);
  attachLiveFormatting(wastewaterPercent);
  attachLiveFormatting(vatPercent);

  // ------------------------------------------------------------
  // 3) RESULT HELPERS (CONSISTENT)
  // ------------------------------------------------------------
  function setResultError(message) {
    if (!resultDiv) return;
    resultDiv.classList.remove("success");
    resultDiv.classList.add("error");
    resultDiv.textContent = message;
  }

  function setResultSuccess(html) {
    if (!resultDiv) return;
    resultDiv.classList.remove("error");
    resultDiv.classList.add("success");
    resultDiv.innerHTML = html;
  }

  function clearResult() {
    if (!resultDiv) return;
    resultDiv.classList.remove("error", "success");
    resultDiv.textContent = "";
  }

  // ------------------------------------------------------------
  // 4) OPTIONAL MODE HANDLING (ONLY IF USED)
  // ------------------------------------------------------------
  function showMode(mode) {
    if (modeBlockKnown) modeBlockKnown.classList.add("hidden");
    if (modeBlockEstimate) modeBlockEstimate.classList.add("hidden");

    if (mode === "estimate") {
      if (modeBlockEstimate) modeBlockEstimate.classList.remove("hidden");
    } else {
      if (modeBlockKnown) modeBlockKnown.classList.remove("hidden");
    }

    clearResult();
  }

  if (modeSelect) {
    showMode(modeSelect.value);
    modeSelect.addEventListener("change", function () {
      showMode(modeSelect.value);
    });
  }

  // ------------------------------------------------------------
  // 5) VALIDATION HELPERS (OPTIONAL)
  // ------------------------------------------------------------
  function validatePositive(value, fieldLabel) {
    if (!Number.isFinite(value) || value <= 0) {
      setResultError("Enter a valid " + fieldLabel + " greater than 0.");
      return false;
    }
    return true;
  }

  function validateNonNegative(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0) {
      setResultError("Enter a valid " + fieldLabel + " (0 or higher).");
      return false;
    }
    return true;
  }

  function clampPercent(value) {
    if (!Number.isFinite(value)) return 0;
    if (value < 0) return 0;
    if (value > 100) return 100;
    return value;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = modeSelect ? modeSelect.value : "known";

      // Parse inputs using toNumber() (from /scripts/main.js)
      const rate = toNumber(ratePerKl ? ratePerKl.value : "");
      const fixed = fixedFee && fixedFee.value.trim() !== "" ? toNumber(fixedFee.value) : 0;
      const wastewaterPctRaw =
        wastewaterPercent && wastewaterPercent.value.trim() !== ""
          ? toNumber(wastewaterPercent.value)
          : 0;
      const vatPctRaw = vatPercent && vatPercent.value.trim() !== "" ? toNumber(vatPercent.value) : 0;

      // Basic existence guard
      if (!resultDiv || !calculateButton || !ratePerKl) return;

      // Validation
      if (!validatePositive(rate, "water tariff per kL")) return;
      if (!validateNonNegative(fixed, "fixed monthly fee")) return;

      const wastewaterPct = clampPercent(wastewaterPctRaw);
      const vatPct = clampPercent(vatPctRaw);

      let usageKl = 0;
      let usageSourceNote = "";

      if (mode === "estimate") {
        const people = toNumber(peopleCount ? peopleCount.value : "");
        const liters = toNumber(litersPerPersonPerDay ? litersPerPersonPerDay.value : "");
        const days = daysInMonth && daysInMonth.value.trim() !== "" ? toNumber(daysInMonth.value) : 30;

        if (!validatePositive(people, "people in household")) return;
        if (!validatePositive(liters, "litres per person per day")) return;
        if (!validatePositive(days, "days in month")) return;

        // Soft realism guardrails (do not block, but avoid nonsense)
        if (people > 20) {
          setResultError("People in household looks unusually high. If this is correct, continue by lowering it to a realistic household count or use monthly usage (kL) mode.");
          return;
        }

        // Convert litres to kL: litres / 1000
        usageKl = (people * liters * days) / 1000;
        usageSourceNote =
          "<p><strong>Estimated usage:</strong> " +
          formatNumberTwoDecimals(usageKl) +
          " kL (from daily use)</p>";
      } else {
        const monthlyKl = toNumber(monthlyUsageKl ? monthlyUsageKl.value : "");
        if (!validatePositive(monthlyKl, "monthly water usage (kL)")) return;
        usageKl = monthlyKl;
        usageSourceNote = "<p><strong>Usage entered:</strong> " + formatNumberTwoDecimals(usageKl) + " kL</p>";
      }

      // Calculation logic
      const waterUsageCharge = usageKl * rate;
      const wastewaterCharge = waterUsageCharge * (wastewaterPct / 100);
      const subtotal = waterUsageCharge + fixed + wastewaterCharge;
      const vatCharge = subtotal * (vatPct / 100);
      const total = subtotal + vatCharge;

      // Supporting figure
      const costPerDay = total / 30;

      // Build output HTML
      const resultHtml =
        "<p><strong>Estimated monthly water cost:</strong> " +
        formatNumberTwoDecimals(total) +
        "</p>" +
        usageSourceNote +
        "<p><strong>Breakdown</strong></p>" +
        "<p>Water usage charge: " +
        formatNumberTwoDecimals(waterUsageCharge) +
        "</p>" +
        "<p>Fixed monthly fee: " +
        formatNumberTwoDecimals(fixed) +
        "</p>" +
        "<p>Wastewater surcharge (" +
        formatNumberTwoDecimals(wastewaterPct) +
        "%): " +
        formatNumberTwoDecimals(wastewaterCharge) +
        "</p>" +
        "<p>VAT or sales tax (" +
        formatNumberTwoDecimals(vatPct) +
        "%): " +
        formatNumberTwoDecimals(vatCharge) +
        "</p>" +
        "<p><strong>Quick check:</strong> about " +
        formatNumberTwoDecimals(costPerDay) +
        " per day (assuming a 30-day month)</p>";

      // Output
      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Water Usage Cost Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
// :contentReference[oaicite:2]{index=2}
