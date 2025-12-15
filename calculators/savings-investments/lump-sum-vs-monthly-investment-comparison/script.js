document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const lumpSumAmount = document.getElementById("lumpSumAmount");
  const monthlyContribution = document.getElementById("monthlyContribution");
  const years = document.getElementById("years");
  const annualReturn = document.getElementById("annualReturn");
  const annualFee = document.getElementById("annualFee");
  const inflationRate = document.getElementById("inflationRate");
  const depositTiming = document.getElementById("depositTiming");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (not used)
  

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
  attachLiveFormatting(lumpSumAmount);
  attachLiveFormatting(monthlyContribution);

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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Optional: if you have modes, read it here:
      // const mode = modeSelect ? modeSelect.value : "default";
      

      // Parse inputs using toNumber() (from /scripts/main.js)
      const P = toNumber(lumpSumAmount ? lumpSumAmount.value : "");
      const PMT = toNumber(monthlyContribution ? monthlyContribution.value : "");
      const yrs = toNumber(years ? years.value : "");
      const rAnnualPct = toNumber(annualReturn ? annualReturn.value : "");
      const feeAnnualPct = toNumber(annualFee ? annualFee.value : "");
      const inflPct = toNumber(inflationRate ? inflationRate.value : "");
      const timing = depositTiming ? depositTiming.value : "end";

      // Basic existence guard (optional but recommended)
      if (!lumpSumAmount || !monthlyContribution || !years || !annualReturn || !annualFee || !inflationRate || !depositTiming) return;

      // Validation (use validatePositive/validateNonNegative or custom)
      if (!validateNonNegative(P, "lump sum amount")) return;
      if (!validateNonNegative(PMT, "monthly contribution")) return;
      if (!validatePositive(yrs, "time horizon (years)")) return;

      if (!Number.isFinite(rAnnualPct) || rAnnualPct < -100) {
        setResultError("Enter a valid expected annual return (%).");
        return;
      }

      if (!Number.isFinite(feeAnnualPct) || feeAnnualPct < 0 || feeAnnualPct > 10) {
        setResultError("Enter a valid annual fee (%), typically between 0 and 10.");
        return;
      }

      if (!Number.isFinite(inflPct) || inflPct < 0 || inflPct > 30) {
        setResultError("Enter a valid inflation rate (%), typically between 0 and 30.");
        return;
      }

      if (P === 0 && PMT === 0) {
        setResultError("Enter a lump sum amount, a monthly contribution, or both.");
        return;
      }

      // Calculation logic
      const monthsRaw = yrs * 12;
      const n = Math.round(monthsRaw);

      if (!Number.isFinite(n) || n <= 0) {
        setResultError("Enter a valid time horizon that results in at least 1 month.");
        return;
      }

      const rAnnual = rAnnualPct / 100;
      const feeAnnual = feeAnnualPct / 100;

      // Net annual growth approximation: apply fee as an annual drag on gross growth.
      // netAnnual = (1 + rAnnual) * (1 - feeAnnual) - 1
      const netAnnual = (1 + rAnnual) * (1 - feeAnnual) - 1;

      // Convert to monthly effective rate
      let rMonthly;
      if (netAnnual <= -1) {
        // If net annual is -100% or worse, the model breaks. Clamp and warn via error.
        setResultError("Your return and fee combination implies a total loss. Adjust your assumptions.");
        return;
      } else {
        rMonthly = Math.pow(1 + netAnnual, 1 / 12) - 1;
      }

      const growthFactor = Math.pow(1 + rMonthly, n);

      // Lump sum future value
      const fvLump = P * growthFactor;

      // Monthly contribution future value (ordinary annuity by default)
      let fvMonthly;
      if (Math.abs(rMonthly) < 1e-12) {
        fvMonthly = PMT * n;
      } else {
        fvMonthly = PMT * ((growthFactor - 1) / rMonthly);
      }

      // If deposits are at start of month (annuity due), one extra compounding period
      if (timing === "start") {
        fvMonthly = fvMonthly * (1 + rMonthly);
      }

      const totalContributedMonthly = PMT * n;
      const growthMonthly = fvMonthly - totalContributedMonthly;

      const difference = fvLump - fvMonthly;
      const winner = difference > 0 ? "Lump sum" : difference < 0 ? "Monthly investing" : "Tie";

      // Break-even monthly payment to match lump sum FV
      let breakEvenMonthly;
      if (P === 0) {
        breakEvenMonthly = 0;
      } else if (Math.abs(rMonthly) < 1e-12) {
        breakEvenMonthly = P / n;
      } else {
        // For ordinary annuity: P * (1+r)^n = PMT * (( (1+r)^n - 1)/r)
        // PMT = P * (1+r)^n * r / ((1+r)^n - 1)
        breakEvenMonthly = (P * growthFactor * rMonthly) / (growthFactor - 1);

        // Adjust for annuity due if deposits at start: divide by (1+r)
        if (timing === "start") {
          breakEvenMonthly = breakEvenMonthly / (1 + rMonthly);
        }
      }

      // Inflation-adjusted (real) values
      const infl = inflPct / 100;
      const inflFactor = Math.pow(1 + infl, yrs);
      const fvLumpReal = infl > 0 ? fvLump / inflFactor : fvLump;
      const fvMonthlyReal = infl > 0 ? fvMonthly / inflFactor : fvMonthly;

      // Build output HTML
      const fvLumpFmt = formatNumberTwoDecimals(fvLump);
      const fvMonthlyFmt = formatNumberTwoDecimals(fvMonthly);
      const diffFmtAbs = formatNumberTwoDecimals(Math.abs(difference));
      const totalContribFmt = formatNumberTwoDecimals(totalContributedMonthly);
      const growthMonthlyFmt = formatNumberTwoDecimals(growthMonthly);
      const breakEvenFmt = formatNumberTwoDecimals(breakEvenMonthly);

      const netAnnualPct = netAnnual * 100;
      const netAnnualFmt = formatNumberTwoDecimals(netAnnualPct);

      let realBlock = "";
      if (infl > 0) {
        realBlock = `
          <hr>
          <p><strong>Inflation-adjusted values (today’s money):</strong></p>
          <p>Lump sum future value (real): <strong>${formatNumberTwoDecimals(fvLumpReal)}</strong></p>
          <p>Monthly investing future value (real): <strong>${formatNumberTwoDecimals(fvMonthlyReal)}</strong></p>
        `;
      }

      const resultHtml = `
        <p><strong>Results (nominal):</strong></p>
        <p>Lump sum future value: <strong>${fvLumpFmt}</strong></p>
        <p>Monthly investing future value: <strong>${fvMonthlyFmt}</strong></p>
        <p><strong>Difference:</strong> ${winner} is higher by <strong>${diffFmtAbs}</strong></p>

        <hr>
        <p><strong>Monthly plan details:</strong></p>
        <p>Total contributed (monthly): <strong>${totalContribFmt}</strong></p>
        <p>Estimated growth (monthly): <strong>${growthMonthlyFmt}</strong></p>

        <hr>
        <p><strong>Break-even monthly amount:</strong> About <strong>${breakEvenFmt}</strong> per month would match the lump sum under these assumptions.</p>
        <p><strong>Net return after fee (approx.):</strong> ${netAnnualFmt}% per year, compounded monthly.</p>
        ${realBlock}
      `;

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
      const message = "Lump Sum vs Monthly Investment Comparison - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
