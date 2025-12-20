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
  const contributionAmountInput = document.getElementById("contributionAmount");
  const contributionFrequencySelect = document.getElementById("contributionFrequency");
  const yearsInput = document.getElementById("years");
  const annualReturnInput = document.getElementById("annualReturn");
  const annualFeesInput = document.getElementById("annualFees");
  const annualContributionIncreaseInput = document.getElementById("annualContributionIncrease");
  const inflationRateInput = document.getElementById("inflationRate");
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

  // Add every input that should live-format with commas
  attachLiveFormatting(startingBalanceInput);
  attachLiveFormatting(contributionAmountInput);
  attachLiveFormatting(yearsInput);
  attachLiveFormatting(annualReturnInput);
  attachLiveFormatting(annualFeesInput);
  attachLiveFormatting(annualContributionIncreaseInput);
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

  function validateRate(value, fieldLabel) {
    if (!Number.isFinite(value)) {
      setResultError("Enter a valid " + fieldLabel + ".");
      return false;
    }
    if (value <= -100) {
      setResultError(fieldLabel + " must be greater than -100%.");
      return false;
    }
    if (value > 1000) {
      setResultError(fieldLabel + " looks unrealistically high. Enter a smaller percentage.");
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

      if (
        !startingBalanceInput ||
        !contributionAmountInput ||
        !contributionFrequencySelect ||
        !yearsInput ||
        !annualReturnInput ||
        !compoundingSelect
      ) {
        return;
      }

      const startingBalance = toNumber(startingBalanceInput.value);
      const contributionAmount = toNumber(contributionAmountInput.value);
      const years = toNumber(yearsInput.value);
      const annualReturnPct = toNumber(annualReturnInput.value);

      const annualFeesPct = annualFeesInput ? toNumber(annualFeesInput.value) : 0;
      const annualIncreasePct = annualContributionIncreaseInput ? toNumber(annualContributionIncreaseInput.value) : 0;
      const inflationPct = inflationRateInput ? toNumber(inflationRateInput.value) : 0;

      const contributionFrequency = (contributionFrequencySelect.value || "monthly").toLowerCase();
      const compoundingPerYear = parseInt(compoundingSelect.value || "12", 10);

      if (!validateNonNegative(startingBalance, "starting balance")) return;
      if (!validateNonNegative(contributionAmount, "contribution amount")) return;
      if (!validatePositive(years, "years to project")) return;
      if (!validateRate(annualReturnPct, "expected annual return")) return;

      if (Number.isFinite(annualFeesPct) && annualFeesPct < 0) {
        setResultError("Annual fees must be 0% or higher.");
        return;
      }
      if (Number.isFinite(annualFeesPct) && annualFeesPct > 20) {
        setResultError("Annual fees above 20% are unusual. Enter a smaller value.");
        return;
      }

      if (Number.isFinite(annualIncreasePct) && annualIncreasePct < 0) {
        setResultError("Annual contribution increase must be 0% or higher.");
        return;
      }
      if (Number.isFinite(annualIncreasePct) && annualIncreasePct > 100) {
        setResultError("Annual contribution increase above 100% is unrealistic for most users.");
        return;
      }

      if (inflationRateInput && inflationRateInput.value.trim() !== "") {
        if (!validateRate(inflationPct, "inflation rate")) return;
        if (inflationPct < 0) {
          setResultError("Inflation rate must be 0% or higher.");
          return;
        }
        if (inflationPct > 30) {
          setResultError("Inflation above 30% is extreme. Enter a smaller value.");
          return;
        }
      }

      if (!Number.isFinite(compoundingPerYear) || compoundingPerYear <= 0) {
        setResultError("Select a valid compounding option.");
        return;
      }

      if (startingBalance === 0 && contributionAmount === 0) {
        setResultError("Enter a starting balance, a contribution amount, or both.");
        return;
      }

      // ------------------------------------------------------------
      // CALCULATION
      // ------------------------------------------------------------
      const r = annualReturnPct / 100;
      const f = (Number.isFinite(annualFeesPct) ? annualFeesPct : 0) / 100;

      // Net annual return after fees (simple multiplicative drag)
      const netAnnual = (1 + r) * (1 - f) - 1;

      // Convert to monthly rate (used for the monthly simulation)
      const monthlyRate = Math.pow(1 + netAnnual, 1 / 12) - 1;

      const totalMonths = Math.round(years * 12);
      let balance = startingBalance;

      let totalContributed = 0;

      // Track contribution plan
      let currentContribution = contributionAmount;

      // For compounding frequency differences: apply interest at the chosen compounding interval,
      // while still simulating contributions monthly for usability.
      const compoundEveryMonths =
        compoundingPerYear >= 12 ? 1 :
        compoundingPerYear === 4 ? 3 :
        compoundingPerYear === 1 ? 12 :
        1;

      // Effective rate per compounding step (based on net annual)
      const stepRate = Math.pow(1 + netAnnual, compoundEveryMonths / 12) - 1;

      for (let m = 1; m <= totalMonths; m++) {
        // Add contribution
        if (contributionFrequency === "annual") {
          // Add once per year at month 12, 24, ...
          if (m % 12 === 0) {
            balance += currentContribution;
            totalContributed += currentContribution;
          }
        } else {
          // Monthly (default)
          balance += currentContribution;
          totalContributed += currentContribution;
        }

        // Apply interest at compounding step boundaries
        if (m % compoundEveryMonths === 0) {
          balance *= (1 + stepRate);
        }

        // Increase contribution once per year (after completing the year)
        if (m % 12 === 0 && Number.isFinite(annualIncreasePct) && annualIncreasePct > 0) {
          currentContribution *= (1 + annualIncreasePct / 100);
        }
      }

      const finalBalance = balance;
      const totalGrowth = finalBalance - startingBalance - totalContributed;

      // Inflation-adjusted final value (today's money)
      let inflationAdjusted = null;
      if (inflationRateInput && inflationRateInput.value.trim() !== "" && Number.isFinite(inflationPct) && inflationPct >= 0) {
        const infl = inflationPct / 100;
        inflationAdjusted = finalBalance / Math.pow(1 + infl, years);
      }

      // Secondary insight: 4% rule monthly income estimate (simple planning heuristic)
      const annualIncomeAt4Pct = finalBalance * 0.04;
      const monthlyIncomeAt4Pct = annualIncomeAt4Pct / 12;

      // ------------------------------------------------------------
      // RESULT HTML
      // ------------------------------------------------------------
      const finalBalanceFmt = formatNumberTwoDecimals(finalBalance);
      const totalContributedFmt = formatNumberTwoDecimals(totalContributed);
      const totalGrowthFmt = formatNumberTwoDecimals(totalGrowth);
      const monthlyIncomeFmt = formatNumberTwoDecimals(monthlyIncomeAt4Pct);

      let inflationLine = "";
      if (inflationAdjusted !== null) {
        inflationLine = `<p><strong>Inflation-adjusted value (today’s money):</strong> ${formatNumberTwoDecimals(inflationAdjusted)}</p>`;
      } else {
        inflationLine = `<p><strong>Inflation-adjusted value:</strong> Not calculated (leave inflation blank if you only want nominal results).</p>`;
      }

      const feeNote = (Number.isFinite(annualFeesPct) && annualFeesPct > 0)
        ? `Return is reduced by fees (${formatNumberTwoDecimals(annualFeesPct)}%).`
        : `Fees assumed to be 0%.`;

      const contribNote = (Number.isFinite(annualIncreasePct) && annualIncreasePct > 0)
        ? `Contributions increase by ${formatNumberTwoDecimals(annualIncreasePct)}% per year.`
        : `Contributions assumed constant over time.`;

      const resultHtml = `
        <p><strong>Projected final balance:</strong> ${finalBalanceFmt}</p>
        <p><strong>Total contributed:</strong> ${totalContributedFmt}</p>
        <p><strong>Total growth (earnings):</strong> ${totalGrowthFmt}</p>
        ${inflationLine}
        <p><strong>Estimated monthly income (4% rule):</strong> ${monthlyIncomeFmt}</p>
        <p><em>${feeNote} ${contribNote}</em></p>
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
      const message = "Wealth Projection Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
