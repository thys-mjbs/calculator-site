document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const startingMonthlyRevenueInput = document.getElementById("startingMonthlyRevenue");
  const forecastMonthsInput = document.getElementById("forecastMonths");
  const monthlyGrowthRateInput = document.getElementById("monthlyGrowthRate");
  const stepChangeMonthInput = document.getElementById("stepChangeMonth");
  const stepChangePercentInput = document.getElementById("stepChangePercent");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(startingMonthlyRevenueInput);
  attachLiveFormatting(forecastMonthsInput);
  attachLiveFormatting(monthlyGrowthRateInput);
  attachLiveFormatting(stepChangeMonthInput);
  attachLiveFormatting(stepChangePercentInput);

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
    clearResult();
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

  function validateMonths(value) {
    if (!Number.isFinite(value) || value <= 0) {
      setResultError("Enter a valid forecast length (months) greater than 0.");
      return false;
    }
    if (value > 240) {
      setResultError("Forecast length is too long. Use 240 months (20 years) or less.");
      return false;
    }
    return true;
  }

  function validateGrowthRate(value) {
    if (!Number.isFinite(value)) {
      setResultError("Enter a valid monthly growth rate (%).");
      return false;
    }
    if (value <= -100) {
      setResultError("Monthly growth rate must be greater than -100%.");
      return false;
    }
    if (value > 500) {
      setResultError("Monthly growth rate is too high for a simple forecast. Use 500% or less.");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const startingMonthlyRevenue = toNumber(startingMonthlyRevenueInput ? startingMonthlyRevenueInput.value : "");
      const forecastMonthsRaw = toNumber(forecastMonthsInput ? forecastMonthsInput.value : "");
      const monthlyGrowthRatePercent = toNumber(monthlyGrowthRateInput ? monthlyGrowthRateInput.value : "");

      const stepChangeMonthRaw = toNumber(stepChangeMonthInput ? stepChangeMonthInput.value : "");
      const stepChangePercentRaw = toNumber(stepChangePercentInput ? stepChangePercentInput.value : "");

      // Guard
      if (!startingMonthlyRevenueInput || !forecastMonthsInput || !monthlyGrowthRateInput) return;

      // Required validations
      if (!validatePositive(startingMonthlyRevenue, "starting monthly revenue")) return;

      // If months missing, default to 12 (do not block)
      const forecastMonths = Number.isFinite(forecastMonthsRaw) && forecastMonthsRaw > 0 ? Math.round(forecastMonthsRaw) : 12;
      if (!validateMonths(forecastMonths, "forecast length (months)")) return;

      // If growth missing, default to 0 (do not block)
      const growthPercent = Number.isFinite(monthlyGrowthRatePercent) ? monthlyGrowthRatePercent : 0;
      if (!validateGrowthRate(growthPercent)) return;

      const g = growthPercent / 100;

      // Optional step change handling
      let stepMonth = null;
      let stepFactor = 1;

      if (Number.isFinite(stepChangeMonthRaw) && stepChangeMonthRaw > 0) {
        stepMonth = Math.round(stepChangeMonthRaw);
      }

      if (Number.isFinite(stepChangePercentRaw) && stepChangePercentRaw !== 0) {
        if (stepChangePercentRaw <= -100) {
          setResultError("One-time step change (%) must be greater than -100%.");
          return;
        }
        if (stepChangePercentRaw > 500) {
          setResultError("One-time step change (%) is too high. Use 500% or less.");
          return;
        }
        stepFactor = 1 + (stepChangePercentRaw / 100);
      }

      if (stepMonth !== null) {
        if (stepMonth < 1 || stepMonth > forecastMonths) {
          setResultError("One-time step change month must be between 1 and " + forecastMonths + ".");
          return;
        }
      }

      // Calculation
      let totalRevenue = 0;
      let endingMonthlyRevenue = 0;

      function monthlyRevenueForMonth(m) {
        // m is 1-based
        let rev = startingMonthlyRevenue * Math.pow(1 + g, m - 1);
        if (stepMonth !== null && m >= stepMonth) {
          rev = rev * stepFactor;
        }
        return rev;
      }

      for (let m = 1; m <= forecastMonths; m++) {
        const rev = monthlyRevenueForMonth(m);
        totalRevenue += rev;
        if (m === forecastMonths) endingMonthlyRevenue = rev;
      }

      const averageMonthlyRevenue = totalRevenue / forecastMonths;

      // Snapshot months
      const snapshotMonths = [];
      snapshotMonths.push(1);
      if (forecastMonths >= 2) snapshotMonths.push(2);
      if (forecastMonths >= 3) snapshotMonths.push(3);
      if (forecastMonths > 3) snapshotMonths.push(forecastMonths);

      // De-duplicate
      const seen = {};
      const uniqueSnapshotMonths = snapshotMonths.filter(function (m) {
        if (seen[m]) return false;
        seen[m] = true;
        return true;
      });

      let snapshotRows = "";
      uniqueSnapshotMonths.forEach(function (m) {
        const rev = monthlyRevenueForMonth(m);
        snapshotRows += "<tr><td>Month " + m + "</td><td>" + formatNumberTwoDecimals(rev) + "</td></tr>";
      });

      // Build output HTML
      const totalFormatted = formatNumberTwoDecimals(totalRevenue);
      const endingFormatted = formatNumberTwoDecimals(endingMonthlyRevenue);
      const avgFormatted = formatNumberTwoDecimals(averageMonthlyRevenue);

      const assumptions = [];
      assumptions.push("Growth rate applied monthly: " + growthPercent + "%");
      assumptions.push("Forecast length: " + forecastMonths + " months");
      if (stepMonth !== null && stepFactor !== 1) {
        assumptions.push("Step change from month " + stepMonth + ": " + stepChangePercentRaw + "%");
      } else if (stepMonth !== null && stepFactor === 1) {
        assumptions.push("Step change month set, but step change % is 0% (no effect).");
      } else {
        assumptions.push("No step change applied.");
      }

      const resultHtml =
        '<div class="result-grid">' +
          "<p><strong>Total forecasted revenue:</strong> " + totalFormatted + "</p>" +
          "<p><strong>Ending monthly revenue (month " + forecastMonths + "):</strong> " + endingFormatted + "</p>" +
          "<p><strong>Average monthly revenue:</strong> " + avgFormatted + "</p>" +
        "</div>" +
        '<table class="result-table" aria-label="Revenue snapshot table">' +
          "<thead><tr><th>Period</th><th>Estimated monthly revenue</th></tr></thead>" +
          "<tbody>" + snapshotRows + "</tbody>" +
        "</table>" +
        "<p><strong>Assumptions used:</strong> " + assumptions.join(" | ") + "</p>";

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Forecasted Revenue Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
