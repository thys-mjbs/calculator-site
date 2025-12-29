document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const startBalanceInput = document.getElementById("startBalance");
  const annualReturnInput = document.getElementById("annualReturn");
  const advisorFeeInput = document.getElementById("advisorFee");
  const yearsInput = document.getElementById("years");
  const annualContributionInput = document.getElementById("annualContribution");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (Not used for this calculator)

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
  attachLiveFormatting(startBalanceInput);
  attachLiveFormatting(yearsInput);
  attachLiveFormatting(annualContributionInput);

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

  function validatePercentRange(value, fieldLabel, minInclusive, maxInclusive) {
    if (!Number.isFinite(value) || value < minInclusive || value > maxInclusive) {
      setResultError(
        "Enter a valid " +
          fieldLabel +
          " between " +
          minInclusive +
          "% and " +
          maxInclusive +
          "%."
      );
      return false;
    }
    return true;
  }

  function validateYearsInteger(value) {
    if (!Number.isFinite(value) || value <= 0) {
      setResultError("Enter a valid time horizon (years) greater than 0.");
      return false;
    }
    const asInt = Math.floor(value);
    if (asInt !== value) {
      setResultError("Time horizon (years) must be a whole number.");
      return false;
    }
    if (asInt > 100) {
      setResultError("Time horizon (years) should be 100 or less for a realistic estimate.");
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

      // Parse inputs using toNumber() (from /scripts/main.js)
      const startBalance = toNumber(startBalanceInput ? startBalanceInput.value : "");
      const annualReturnPct = toNumber(annualReturnInput ? annualReturnInput.value : "");
      const advisorFeePct = toNumber(advisorFeeInput ? advisorFeeInput.value : "");
      const yearsRaw = toNumber(yearsInput ? yearsInput.value : "");
      const annualContribution = toNumber(
        annualContributionInput ? annualContributionInput.value : ""
      );

      // Basic existence guard
      if (
        !startBalanceInput ||
        !annualReturnInput ||
        !advisorFeeInput ||
        !yearsInput ||
        !resultDiv
      ) {
        return;
      }

      // Validation
      if (!validatePositive(startBalance, "starting portfolio balance")) return;
      if (!validateYearsInteger(yearsRaw)) return;

      // Allow negative returns down to -100%, and cap at 1000% to avoid nonsense
      if (!validatePercentRange(annualReturnPct, "expected annual return", -100, 1000)) return;

      // Advisor fee should be non-negative and within a reasonable band
      if (!validatePercentRange(advisorFeePct, "advisor fee", 0, 20)) return;

      if (!validateNonNegative(annualContribution, "annual contribution")) return;

      const years = Math.floor(yearsRaw);
      const r = annualReturnPct / 100;
      const feeRate = advisorFeePct / 100;

      // Calculation logic (year-by-year simulation)
      let balanceNoFee = startBalance;
      let balanceWithFee = startBalance;
      let totalFeesPaid = 0;

      for (let i = 0; i < years; i++) {
        // No-fee baseline
        balanceNoFee = balanceNoFee * (1 + r) + annualContribution;

        // With-fee scenario: grow, add contribution, then apply fee based on average balance estimate
        const startYear = balanceWithFee;
        const endBeforeFee = startYear * (1 + r) + annualContribution;
        const avgBalance = (startYear + endBeforeFee) / 2;
        const feeThisYear = avgBalance * feeRate;

        const endAfterFee = endBeforeFee - feeThisYear;

        totalFeesPaid += feeThisYear;
        balanceWithFee = endAfterFee;
      }

      const endingNoFee = balanceNoFee;
      const endingWithFee = balanceWithFee;

      const valueLost = endingNoFee - endingWithFee;
      const percentReduction =
        endingNoFee > 0 ? (valueLost / endingNoFee) * 100 : 0;

      // Build output HTML
      const endingNoFeeFmt = formatNumberTwoDecimals(endingNoFee);
      const endingWithFeeFmt = formatNumberTwoDecimals(endingWithFee);
      const totalFeesFmt = formatNumberTwoDecimals(totalFeesPaid);
      const valueLostFmt = formatNumberTwoDecimals(valueLost);
      const percentReductionFmt = formatNumberTwoDecimals(percentReduction);

      const resultHtml = `
        <p><strong>Ending value (with advisor fee):</strong> ${endingWithFeeFmt}</p>
        <p><strong>Ending value (no advisor fee):</strong> ${endingNoFeeFmt}</p>
        <p><strong>Value lost to fees (ending gap):</strong> ${valueLostFmt}</p>
        <p><strong>Estimated total fees paid:</strong> ${totalFeesFmt}</p>
        <p><strong>Reduction vs no-fee outcome:</strong> ${percentReductionFmt}%</p>
        <p><em>Interpretation:</em> The ending gap is usually larger than total fees paid because fees removed earlier cannot compound for the remaining years.</p>
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
      const message = "Advisor Fee Impact Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
