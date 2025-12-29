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
  const monthlyContributionInput = document.getElementById("monthlyContribution");
  const annualRateInput = document.getElementById("annualRate");
  const yearsInput = document.getElementById("years");
  const contributionTimingSelect = document.getElementById("contributionTiming");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Attach formatting where it makes sense
  attachLiveFormatting(initialAmountInput);
  attachLiveFormatting(monthlyContributionInput);
  attachLiveFormatting(annualRateInput);
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
      // Read mode (not used here)
      const mode = "default";

      // Parse inputs using toNumber() (from /scripts/main.js)
      const initialAmount = toNumber(initialAmountInput ? initialAmountInput.value : "");
      const monthlyContribution = toNumber(
        monthlyContributionInput ? monthlyContributionInput.value : ""
      );
      const annualRatePercent = toNumber(annualRateInput ? annualRateInput.value : "");
      const yearsRaw = toNumber(yearsInput ? yearsInput.value : "");
      const timing = contributionTimingSelect ? contributionTimingSelect.value : "end";

      // Basic existence guard
      if (
        !initialAmountInput ||
        !monthlyContributionInput ||
        !annualRateInput ||
        !yearsInput ||
        !contributionTimingSelect ||
        !resultDiv
      ) {
        return;
      }

      // Validation
      if (!validateNonNegative(initialAmount, "initial amount")) return;
      if (!validateNonNegative(monthlyContribution, "monthly contribution")) return;

      if (!Number.isFinite(annualRatePercent) || annualRatePercent < 0 || annualRatePercent > 100) {
        setResultError("Enter a valid annual simple interest rate between 0% and 100%.");
        return;
      }

      if (!Number.isFinite(yearsRaw) || yearsRaw <= 0 || yearsRaw > 100) {
        setResultError("Enter a valid time horizon in years (greater than 0 and up to 100).");
        return;
      }

      if (initialAmount === 0 && monthlyContribution === 0) {
        setResultError("Enter an initial amount or a monthly contribution (or both).");
        return;
      }

      // Convert years to a monthly schedule
      const months = Math.max(1, Math.round(yearsRaw * 12));
      const years = months / 12;

      // Calculation logic (simple interest on each deposit for its remaining time)
      const r = annualRatePercent / 100;

      const fvInitial = initialAmount * (1 + r * years);

      let fvContrib = 0;
      if (monthlyContribution > 0) {
        if (timing === "start") {
          // Remaining months: N, N-1, ..., 1
          const sumK = (months * (months + 1)) / 2;
          fvContrib = monthlyContribution * months + monthlyContribution * (r / 12) * sumK;
        } else {
          // End of month deposits. Remaining months: N-1, N-2, ..., 0
          const sumK = ((months - 1) * months) / 2;
          fvContrib = monthlyContribution * months + monthlyContribution * (r / 12) * sumK;
        }
      }

      const finalBalance = fvInitial + fvContrib;

      const totalContributed = initialAmount + monthlyContribution * months;
      const interestEarned = finalBalance - totalContributed;

      const avgInterestPerYear = years > 0 ? interestEarned / years : 0;

      const resultHtml = `
        <p><strong>Estimated final balance:</strong> ${formatNumberTwoDecimals(finalBalance)}</p>
        <p><strong>Total contributed:</strong> ${formatNumberTwoDecimals(totalContributed)}</p>
        <p><strong>Total interest earned (simple interest):</strong> ${formatNumberTwoDecimals(interestEarned)}</p>
        <p><strong>Average interest per year:</strong> ${formatNumberTwoDecimals(avgInterestPerYear)}</p>
        <p><strong>Assumed schedule:</strong> ${months} months (${years.toFixed(2)} years), contributions at ${
        timing === "start" ? "the start of each month" : "the end of each month"
      }.</p>
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
      const message = "Long-Term Savings Growth (Simple Interest) - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
