document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const startingBalanceInput = document.getElementById("startingBalance");
  const monthlyContributionInput = document.getElementById("monthlyContribution");
  const yearsInput = document.getElementById("years");
  const grossReturnInput = document.getElementById("grossReturn");
  const annualFeeInput = document.getElementById("annualFee");
  const additionalFeeInput = document.getElementById("additionalFee");

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
  attachLiveFormatting(startingBalanceInput);
  attachLiveFormatting(monthlyContributionInput);
  attachLiveFormatting(yearsInput);
  attachLiveFormatting(grossReturnInput);
  attachLiveFormatting(annualFeeInput);
  attachLiveFormatting(additionalFeeInput);

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

  function validatePercentRange(value, fieldLabel, min, max) {
    if (!Number.isFinite(value) || value < min || value > max) {
      setResultError("Enter a valid " + fieldLabel + " between " + min + "% and " + max + "%.");
      return false;
    }
    return true;
  }

  function futureValueMonthly(PV, PMT, monthlyRate, months) {
    if (!Number.isFinite(monthlyRate) || !Number.isFinite(months) || months < 0) return NaN;
    if (months === 0) return PV;
    if (monthlyRate === 0) return PV + PMT * months;
    const factor = Math.pow(1 + monthlyRate, months);
    return PV * factor + PMT * ((factor - 1) / monthlyRate);
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (
        !startingBalanceInput ||
        !monthlyContributionInput ||
        !yearsInput ||
        !grossReturnInput ||
        !annualFeeInput
      ) {
        return;
      }

      const startingBalance = toNumber(startingBalanceInput.value);
      const monthlyContribution = toNumber(monthlyContributionInput.value);
      const years = toNumber(yearsInput.value);
      const grossReturnPct = toNumber(grossReturnInput.value);
      const annualFeePct = toNumber(annualFeeInput.value);
      const additionalFeePct = additionalFeeInput ? toNumber(additionalFeeInput.value) : 0;

      if (!validateFinite(startingBalance, "starting balance")) return;
      if (!validateFinite(monthlyContribution, "monthly contribution")) return;
      if (!validateFinite(years, "time horizon (years)")) return;
      if (!validateFinite(grossReturnPct, "annual return")) return;
      if (!validateFinite(annualFeePct, "annual fee")) return;
      if (!validateFinite(additionalFeePct, "additional annual fee")) return;

      if (!validateNonNegative(startingBalance, "starting balance")) return;
      if (!validateNonNegative(monthlyContribution, "monthly contribution")) return;
      if (!validatePositive(years, "time horizon (years)")) return;

      if (!validatePercentRange(grossReturnPct, "annual return", -100, 100)) return;
      if (!validatePercentRange(annualFeePct, "annual fee", 0, 20)) return;
      if (!validatePercentRange(additionalFeePct, "additional annual fee", 0, 20)) return;

      const totalFeePct = annualFeePct + additionalFeePct;
      if (totalFeePct > 30) {
        setResultError("Your combined annual fees look unusually high. Enter total annual fees of 30% or less.");
        return;
      }

      const months = Math.round(years * 12);
      if (!Number.isFinite(months) || months <= 0) {
        setResultError("Enter a valid time horizon in years.");
        return;
      }

      const grossAnnual = grossReturnPct / 100;
      const feeAnnual = totalFeePct / 100;

      const grossMonthly = Math.pow(1 + grossAnnual, 1 / 12) - 1;

      // Practical net return approximation: netAnnual = (1 + gross) * (1 - fee) - 1
      const netAnnual = (1 + grossAnnual) * (1 - feeAnnual) - 1;
      const netMonthly = Math.pow(1 + netAnnual, 1 / 12) - 1;

      const fvNoFee = futureValueMonthly(startingBalance, monthlyContribution, grossMonthly, months);
      const fvWithFee = futureValueMonthly(startingBalance, monthlyContribution, netMonthly, months);

      if (!Number.isFinite(fvNoFee) || !Number.isFinite(fvWithFee)) {
        setResultError("Unable to calculate with these inputs. Check your values and try again.");
        return;
      }

      const feeDragAmount = fvNoFee - fvWithFee;
      const feeDragPctOfNoFee = fvNoFee === 0 ? 0 : (feeDragAmount / fvNoFee) * 100;

      const totalContributions = startingBalance + monthlyContribution * months;

      const resultHtml = `
        <p><strong>Ending value with fees:</strong> ${formatNumberTwoDecimals(fvWithFee)}</p>
        <p><strong>Ending value with no fees:</strong> ${formatNumberTwoDecimals(fvNoFee)}</p>
        <p><strong>Fee drag (difference):</strong> ${formatNumberTwoDecimals(feeDragAmount)} (${formatNumberTwoDecimals(feeDragPctOfNoFee)}% of the no-fee ending value)</p>
        <p><strong>Total contributed:</strong> ${formatNumberTwoDecimals(totalContributions)}</p>
        <p><strong>Implied net annual return after fees:</strong> ${formatNumberTwoDecimals(netAnnual * 100)}%</p>
        <p><em>Note:</em> This is a projection using steady returns and a steady annual fee. Real returns and fee timing vary.</p>
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
      const message = "Investment Fee Drag Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
