document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const principalInput = document.getElementById("principalInput");
  const monthlyContributionInput = document.getElementById(
    "monthlyContributionInput"
  );
  const rateInput = document.getElementById("rateInput");
  const yearsInput = document.getElementById("yearsInput");
  const compoundingSelect = document.getElementById("compoundingSelect");
  const timingSelect = document.getElementById("timingSelect");

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
  attachLiveFormatting(principalInput);
  attachLiveFormatting(monthlyContributionInput);

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
      // Parse inputs using toNumber() (from /scripts/main.js)
      const principal = toNumber(principalInput ? principalInput.value : "");
      const monthlyContribution = toNumber(
        monthlyContributionInput ? monthlyContributionInput.value : ""
      );
      const annualRatePercent = toNumber(rateInput ? rateInput.value : "");
      const years = toNumber(yearsInput ? yearsInput.value : "");

      // Basic existence guard
      if (
        !principalInput ||
        !monthlyContributionInput ||
        !rateInput ||
        !yearsInput ||
        !compoundingSelect ||
        !timingSelect
      ) {
        return;
      }

      // Validation
      if (!validateNonNegative(principal, "starting amount")) return;
      if (!validateNonNegative(monthlyContribution, "monthly contribution"))
        return;
      if (!validatePositive(annualRatePercent, "annual interest rate")) return;
      if (!validatePositive(years, "time period (years)")) return;

      if (principal === 0 && monthlyContribution === 0) {
        setResultError(
          "Enter a starting amount or a monthly contribution (or both)."
        );
        return;
      }

      const n = toNumber(compoundingSelect.value);
      if (!Number.isFinite(n) || n <= 0) {
        setResultError("Select a valid compounding frequency.");
        return;
      }

      const timing = timingSelect.value === "begin" ? "begin" : "end";

      // Calculation
      const r = annualRatePercent / 100;

      // Convert nominal rate (compounded n times/year) into an effective monthly rate
      // so we can handle monthly contributions consistently.
      const monthlyRate = Math.pow(1 + r / n, n / 12) - 1;

      const monthsExact = years * 12;
      const fullMonths = Math.floor(monthsExact + 1e-9);
      const remainder = monthsExact - fullMonths;

      let balance = principal;
      let totalContributionAmount = principal;
      let contributionsCount = 0;

      for (let i = 0; i < fullMonths; i++) {
        if (monthlyContribution > 0 && timing === "begin") {
          balance += monthlyContribution;
          totalContributionAmount += monthlyContribution;
          contributionsCount += 1;
        }

        balance = balance * (1 + monthlyRate);

        if (monthlyContribution > 0 && timing === "end") {
          balance += monthlyContribution;
          totalContributionAmount += monthlyContribution;
          contributionsCount += 1;
        }
      }

      if (remainder > 0) {
        balance = balance * Math.pow(1 + monthlyRate, remainder);
      }

      const totalInterestEarned = balance - totalContributionAmount;

      const effectiveAnnualRate = Math.pow(1 + r / n, n) - 1;

      // Small snapshots: 1 year, halfway, final (all based on the monthly-rate model)
      function simulateMonths(monthCount) {
        const full = Math.max(0, Math.floor(monthCount + 1e-9));
        const rem = monthCount - full;

        let b = principal;

        for (let i = 0; i < full; i++) {
          if (monthlyContribution > 0 && timing === "begin") {
            b += monthlyContribution;
          }
          b = b * (1 + monthlyRate);
          if (monthlyContribution > 0 && timing === "end") {
            b += monthlyContribution;
          }
        }

        if (rem > 0) {
          b = b * Math.pow(1 + monthlyRate, rem);
        }

        return b;
      }

      const snapshot1y = simulateMonths(Math.min(12, monthsExact));
      const snapshotHalf = simulateMonths(monthsExact / 2);

      // Build output HTML
      const endingStr = formatNumberTwoDecimals(balance);
      const contribStr = formatNumberTwoDecimals(totalContributionAmount);
      const interestStr = formatNumberTwoDecimals(totalInterestEarned);

      const earPct = (effectiveAnnualRate * 100).toFixed(2);
      const monthlyPct = (monthlyRate * 100).toFixed(4);

      const snap1Str = formatNumberTwoDecimals(snapshot1y);
      const snapHalfStr = formatNumberTwoDecimals(snapshotHalf);

      const resultHtml = `
        <p><strong>Ending balance:</strong> ${endingStr}</p>
        <p><strong>Total contributed:</strong> ${contribStr}</p>
        <p><strong>Total interest earned:</strong> ${interestStr}</p>
        <hr>
        <p><strong>Effective annual rate (EAR):</strong> ${earPct}%</p>
        <p><strong>Approx monthly growth rate:</strong> ${monthlyPct}%</p>
        <hr>
        <p><strong>Quick snapshots:</strong></p>
        <ul>
          <li>After ~1 year: ${snap1Str}</li>
          <li>Halfway point: ${snapHalfStr}</li>
          <li>End of period: ${endingStr}</li>
        </ul>
        <p><strong>Notes:</strong> Contributions counted: ${contributionsCount} month(s). Partial years compound as a fraction, without adding extra partial-month contributions.</p>
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
      const message =
        "Compound Interest Calculator (General Version) - check this calculator: " +
        pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
