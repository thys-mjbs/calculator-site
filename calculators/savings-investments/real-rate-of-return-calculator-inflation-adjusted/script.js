document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const nominalReturnInput = document.getElementById("nominalReturn");
  const inflationRateInput = document.getElementById("inflationRate");
  const startingAmountInput = document.getElementById("startingAmount");
  const yearsInput = document.getElementById("years");
  const compoundingSelect = document.getElementById("compounding");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Money and counts benefit from commas
  attachLiveFormatting(startingAmountInput);
  attachLiveFormatting(yearsInput);

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
  function validateFinite(value, fieldLabel) {
    if (!Number.isFinite(value)) {
      setResultError("Enter a valid " + fieldLabel + ".");
      return false;
    }
    return true;
  }

  function validateRate(value, fieldLabel) {
    if (!validateFinite(value, fieldLabel)) return false;
    if (value <= -100) {
      setResultError("Enter a valid " + fieldLabel + " greater than -100%.");
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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse required inputs
      const nominalPct = toNumber(nominalReturnInput ? nominalReturnInput.value : "");
      const inflationPct = toNumber(inflationRateInput ? inflationRateInput.value : "");

      // Basic existence guard
      if (!nominalReturnInput || !inflationRateInput) return;

      // Validation (required fields)
      if (!validateRate(nominalPct, "nominal annual return")) return;
      if (!validateRate(inflationPct, "inflation rate")) return;

      const nominal = nominalPct / 100;
      const inflation = inflationPct / 100;

      // Optional inputs with defaults (progressive disclosure)
      const pvRaw = startingAmountInput ? toNumber(startingAmountInput.value) : NaN;
      const yearsRaw = yearsInput ? toNumber(yearsInput.value) : NaN;

      const hasPv = Number.isFinite(pvRaw) && pvRaw > 0;
      const hasYears = Number.isFinite(yearsRaw) && yearsRaw > 0;

      const pv = hasPv ? pvRaw : 10000;
      const years = hasYears ? yearsRaw : 10;

      const compounding = compoundingSelect ? compoundingSelect.value : "annual";

      if (hasPv && !validatePositive(pvRaw, "starting amount")) return;
      if (hasYears && !validatePositive(yearsRaw, "time horizon (years)")) return;

      // Convert to effective annual rates based on compounding choice
      function effectiveAnnualRate(rate, mode) {
        if (!Number.isFinite(rate)) return NaN;
        if (mode === "monthly") {
          return Math.pow(1 + rate / 12, 12) - 1;
        }
        if (mode === "daily") {
          return Math.pow(1 + rate / 365, 365) - 1;
        }
        return rate; // annual
      }

      const effNominal = effectiveAnnualRate(nominal, compounding);
      const effInflation = effectiveAnnualRate(inflation, compounding);

      if (!Number.isFinite(effNominal) || !Number.isFinite(effInflation)) {
        setResultError("Enter valid rate inputs to calculate a real return.");
        return;
      }

      // Real return (Fisher-style)
      const real = (1 + effNominal) / (1 + effInflation) - 1;

      // Supporting figures (advanced estimate)
      const nominalFactor = Math.pow(1 + effNominal, years);
      const inflationFactor = Math.pow(1 + effInflation, years);

      const nominalEnding = pv * nominalFactor;
      const realEnding = nominalEnding / inflationFactor; // inflation-adjusted purchasing power
      const realEndingAlt = pv * Math.pow(1 + real, years);

      // Minor numeric drift can happen between methods; use the deflated nominal as primary.
      const realRatePct = real * 100;

      function pctTwo(n) {
        if (!Number.isFinite(n)) return "0.00";
        return formatNumberTwoDecimals(n);
      }

      const usedDefaults = [];
      if (!hasPv) usedDefaults.push("Starting amount defaulted to " + formatNumberTwoDecimals(pv) + ".");
      if (!hasYears) usedDefaults.push("Time horizon defaulted to " + formatNumberTwoDecimals(years) + " years.");

      const compLabel = compounding === "monthly" ? "Monthly" : compounding === "daily" ? "Daily" : "Annual";

      const resultHtml = `
        <p><strong>Real (inflation-adjusted) return:</strong> ${pctTwo(realRatePct)}% per year</p>

        <p><strong>What this means:</strong> At these rates, your purchasing power is expected to ${
          realRatePct >= 0 ? "increase" : "decrease"
        } by about ${pctTwo(Math.abs(realRatePct))}% per year after inflation.</p>

        <hr>

        <p><strong>Nominal ending value (estimate):</strong> ${formatNumberTwoDecimals(nominalEnding)}</p>
        <p><strong>Inflation-adjusted ending value (today’s money):</strong> ${formatNumberTwoDecimals(realEnding)}</p>

        <p><strong>Supporting factors over ${formatNumberTwoDecimals(years)} years:</strong></p>
        <ul>
          <li>Nominal growth factor: ${pctTwo(nominalFactor)}</li>
          <li>Inflation factor: ${pctTwo(inflationFactor)}</li>
          <li>Compounding used: ${compLabel}</li>
        </ul>

        <p><strong>Note:</strong> The inflation-adjusted ending value is calculated by deflating the nominal ending value by cumulative inflation. (A direct real-compounding method gives a very similar estimate: ${formatNumberTwoDecimals(realEndingAlt)}.)</p>

        ${usedDefaults.length ? `<p><strong>Defaults used:</strong> ${usedDefaults.join(" ")}</p>` : ""}
      `;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Real Rate of Return Calculator (Inflation-Adjusted) - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
