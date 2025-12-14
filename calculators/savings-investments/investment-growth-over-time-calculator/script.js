document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const initialAmountInput = document.getElementById("initialAmount");
  const regularContributionInput = document.getElementById("regularContribution");
  const annualRateInput = document.getElementById("annualRate");
  const yearsInput = document.getElementById("years");
  const compoundFrequencySelect = document.getElementById("compoundFrequency");
  const contributionTimingSelect = document.getElementById("contributionTiming");
  const inflationRateInput = document.getElementById("inflationRate");

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
  attachLiveFormatting(initialAmountInput);
  attachLiveFormatting(regularContributionInput);
  attachLiveFormatting(annualRateInput);
  attachLiveFormatting(yearsInput);
  attachLiveFormatting(inflationRateInput);

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
  // 5) VALIDATION HELPERS (OPTIONAL)
  // ------------------------------------------------------------
  function validateNonNegative(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0) {
      setResultError("Enter a valid " + fieldLabel + " (0 or higher).");
      return false;
    }
    return true;
  }

  function validatePositive(value, fieldLabel) {
    if (!Number.isFinite(value) || value <= 0) {
      setResultError("Enter a valid " + fieldLabel + " greater than 0.");
      return false;
    }
    return true;
  }

  function validatePercentRange(value, fieldLabel) {
    if (!Number.isFinite(value) || value < -100 || value > 100) {
      setResultError("Enter a valid " + fieldLabel + " between -100 and 100.");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  function computeFutureValue(pv, pmt, ratePerPeriod, periods, isBegin) {
    const whenFactor = isBegin ? (1 + ratePerPeriod) : 1;

    if (periods <= 0) return pv;

    if (Math.abs(ratePerPeriod) < 1e-12) {
      return pv + (pmt * periods);
    }

    const growth = Math.pow(1 + ratePerPeriod, periods);
    const fvPv = pv * growth;
    const fvPmt = pmt * ((growth - 1) / ratePerPeriod) * whenFactor;
    return fvPv + fvPmt;
  }

  function money(n) {
    return formatNumberTwoDecimals(n);
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (
        !initialAmountInput ||
        !regularContributionInput ||
        !annualRateInput ||
        !yearsInput ||
        !compoundFrequencySelect ||
        !contributionTimingSelect
      ) {
        return;
      }

      const pv = toNumber(initialAmountInput.value);
      const pmt = toNumber(regularContributionInput.value);
      const annualRatePct = toNumber(annualRateInput.value);
      const years = toNumber(yearsInput.value);

      const n = Number(compoundFrequencySelect.value);
      const timing = contributionTimingSelect.value;
      const isBegin = timing === "begin";

      const inflationPctRaw = inflationRateInput ? toNumber(inflationRateInput.value) : 0;
      const useInflation = inflationRateInput && inflationRateInput.value.trim() !== "";

      if (!validateNonNegative(pv, "initial investment")) return;
      if (!validateNonNegative(pmt, "regular contribution")) return;
      if (!validatePercentRange(annualRatePct, "expected annual return")) return;
      if (!validatePositive(years, "time horizon (years)")) return;

      if (!Number.isFinite(n) || n <= 0) {
        setResultError("Choose a valid compounding frequency.");
        return;
      }

      if (useInflation && !validatePercentRange(inflationPctRaw, "inflation rate")) return;

      const periodsTotal = Math.round(years * n);
      if (periodsTotal <= 0) {
        setResultError("Time horizon is too small for the chosen compounding frequency.");
        return;
      }

      const ratePerPeriod = (annualRatePct / 100) / n;

      const fv = computeFutureValue(pv, pmt, ratePerPeriod, periodsTotal, isBegin);
      const totalContributed = pv + (pmt * periodsTotal);
      const interestEarned = fv - totalContributed;

      let fvReal = null;
      if (useInflation) {
        const inflationRate = inflationPctRaw / 100;
        const inflationFactor = Math.pow(1 + inflationRate, years);
        if (inflationFactor > 0) {
          fvReal = fv / inflationFactor;
        }
      }

      // Build yearly table
      const maxYearsForTable = 60;
      const yearsInt = Math.max(1, Math.min(maxYearsForTable, Math.round(years)));

      let rowsHtml = "";
      for (let y = 1; y <= yearsInt; y++) {
        const p = y * n;
        const fvY = computeFutureValue(pv, pmt, ratePerPeriod, p, isBegin);
        const contribY = pv + (pmt * p);
        const growthY = fvY - contribY;

        rowsHtml +=
          "<tr>" +
          "<td>" + y + "</td>" +
          "<td>" + money(contribY) + "</td>" +
          "<td>" + money(growthY) + "</td>" +
          "<td><strong>" + money(fvY) + "</strong></td>" +
          "</tr>";
      }

      const inflationLine = (fvReal === null)
        ? ""
        : "<p><strong>Inflation-adjusted final value (rough):</strong> " + money(fvReal) + "</p>";

      const noteLine = (Math.round(years) > maxYearsForTable)
        ? "<p><em>Year-by-year table is capped at " + maxYearsForTable + " years for readability.</em></p>"
        : "";

      const resultHtml =
        "<p><strong>Estimated final value:</strong> " + money(fv) + "</p>" +
        "<p><strong>Total contributed:</strong> " + money(totalContributed) + "</p>" +
        "<p><strong>Growth earned:</strong> " + money(interestEarned) + "</p>" +
        inflationLine +
        "<hr>" +
        "<p><strong>Year-by-year estimate</strong></p>" +
        "<div style=\"overflow-x:auto;\">" +
        "<table style=\"width:100%; border-collapse:collapse; font-size:13px;\">" +
        "<thead>" +
        "<tr>" +
        "<th style=\"text-align:left; padding:6px; border-bottom:1px solid #e6e6e6;\">Year</th>" +
        "<th style=\"text-align:left; padding:6px; border-bottom:1px solid #e6e6e6;\">Total contributed</th>" +
        "<th style=\"text-align:left; padding:6px; border-bottom:1px solid #e6e6e6;\">Growth earned</th>" +
        "<th style=\"text-align:left; padding:6px; border-bottom:1px solid #e6e6e6;\">Balance</th>" +
        "</tr>" +
        "</thead>" +
        "<tbody>" + rowsHtml + "</tbody>" +
        "</table>" +
        "</div>" +
        noteLine;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Investment Growth Over Time Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
