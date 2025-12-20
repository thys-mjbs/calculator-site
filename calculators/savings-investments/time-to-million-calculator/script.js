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
  const annualReturnInput = document.getElementById("annualReturn");
  const targetAmountInput = document.getElementById("targetAmount");
  const contributionGrowthInput = document.getElementById("contributionGrowth");
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

  attachLiveFormatting(startingBalanceInput);
  attachLiveFormatting(monthlyContributionInput);
  attachLiveFormatting(targetAmountInput);
  attachLiveFormatting(annualReturnInput);
  attachLiveFormatting(contributionGrowthInput);
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

  function validateFinite(value, fieldLabel) {
    if (!Number.isFinite(value)) {
      setResultError("Enter a valid " + fieldLabel + ".");
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
      const startingBalance = toNumber(startingBalanceInput ? startingBalanceInput.value : "");
      const monthlyContribution = toNumber(monthlyContributionInput ? monthlyContributionInput.value : "");
      const annualReturnPct = toNumber(annualReturnInput ? annualReturnInput.value : "");
      const targetAmountRaw = toNumber(targetAmountInput ? targetAmountInput.value : "");
      const contributionGrowthPctRaw = toNumber(contributionGrowthInput ? contributionGrowthInput.value : "");
      const inflationPctRaw = toNumber(inflationRateInput ? inflationRateInput.value : "");

      // Basic existence guard
      if (
        !startingBalanceInput ||
        !monthlyContributionInput ||
        !annualReturnInput ||
        !targetAmountInput ||
        !contributionGrowthInput ||
        !inflationRateInput
      ) {
        return;
      }

      // Defaults for optional fields
      const targetAmount = Number.isFinite(targetAmountRaw) && targetAmountRaw > 0 ? targetAmountRaw : 1000000;
      const contributionGrowthPct = Number.isFinite(contributionGrowthPctRaw) ? contributionGrowthPctRaw : 0;
      const inflationPct = Number.isFinite(inflationPctRaw) ? inflationPctRaw : 0;

      // Validation
      if (!validateNonNegative(startingBalance, "current balance")) return;
      if (!validateNonNegative(monthlyContribution, "monthly contribution")) return;
      if (!validateFinite(annualReturnPct, "expected annual return")) return;
      if (!validateNonNegative(targetAmount, "target amount")) return;

      if (!validateFinite(contributionGrowthPct, "contribution growth rate")) return;
      if (!validateFinite(inflationPct, "inflation rate")) return;

      // Guard against obviously impossible cases
      if (targetAmount <= 0) {
        setResultError("Enter a target amount greater than 0.");
        return;
      }

      if (startingBalance >= targetAmount) {
        const htmlNow = `<p><strong>Already reached:</strong> Your current balance is at or above your target.</p>
        <p><strong>Current balance:</strong> $${formatNumberTwoDecimals(startingBalance)}</p>
        <p><strong>Target:</strong> $${formatNumberTwoDecimals(targetAmount)}</p>`;
        setResultSuccess(htmlNow);
        return;
      }

      // If no contributions and non-positive return, cannot grow
      if (monthlyContribution === 0 && annualReturnPct <= 0) {
        setResultError("With $0 monthly contribution and a return of 0% or less, the target cannot be reached.");
        return;
      }

      // Calculation logic (monthly simulation)
      const maxMonths = 1200; // 100 years cap
      const annualReturn = annualReturnPct / 100;
      const monthlyRate = Math.pow(1 + annualReturn, 1 / 12) - 1;

      const inflationAnnual = inflationPct / 100;
      const inflationMonthly = Math.pow(1 + inflationAnnual, 1 / 12) - 1;

      let month = 0;
      let balance = startingBalance;
      let totalContributed = 0;

      let monthlyContribCurrent = monthlyContribution;

      let reachedNominalMonth = null;
      let reachedRealMonth = null;

      // Run until we have both results or we hit cap
      while (month < maxMonths) {
        month += 1;

        // Apply growth on existing balance
        balance = balance * (1 + monthlyRate);

        // Add monthly contribution
        if (monthlyContribCurrent > 0) {
          balance += monthlyContribCurrent;
          totalContributed += monthlyContribCurrent;
        }

        // Check nominal target (fixed)
        if (reachedNominalMonth === null && balance >= targetAmount) {
          reachedNominalMonth = month;
        }

        // Check inflation-adjusted target (target in today's money grows over time)
        if (reachedRealMonth === null && inflationPct > 0) {
          const inflatedTarget = targetAmount * Math.pow(1 + inflationMonthly, month);
          if (balance >= inflatedTarget) {
            reachedRealMonth = month;
          }
        }

        // Apply contribution growth once per year (after each 12 months)
        if (contributionGrowthPct !== 0 && month % 12 === 0) {
          monthlyContribCurrent = monthlyContribCurrent * (1 + contributionGrowthPct / 100);
        }

        if (reachedNominalMonth !== null && (inflationPct <= 0 || reachedRealMonth !== null)) {
          break;
        }
      }

      if (reachedNominalMonth === null && inflationPct <= 0) {
        setResultError("The target was not reached within 100 years using these inputs. Increase contributions, return, or reduce the target.");
        return;
      }

      if (reachedNominalMonth === null && inflationPct > 0 && reachedRealMonth === null) {
        setResultError("Neither the nominal nor inflation-adjusted target was reached within 100 years. Increase contributions, return, or reduce the target.");
        return;
      }

      // Helper to convert months -> years + months text
      function formatDuration(totalMonths) {
        const years = Math.floor(totalMonths / 12);
        const months = totalMonths % 12;
        if (years === 0) return months + " months";
        if (months === 0) return years + (years === 1 ? " year" : " years");
        return years + (years === 1 ? " year" : " years") + " " + months + (months === 1 ? " month" : " months");
      }

      // Projected dates
      function addMonthsToNow(m) {
        const d = new Date();
        const out = new Date(d.getTime());
        out.setMonth(out.getMonth() + m);
        return out;
      }

      function formatMonthYear(dateObj) {
        const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        const m = months[dateObj.getMonth()];
        const y = dateObj.getFullYear();
        return m + " " + y;
      }

      // Re-run a short simulation to capture end-state details at the nominal reach month
      function simulateToMonth(targetMonth, useInflationTarget) {
        let b = startingBalance;
        let contrib = monthlyContribution;
        let contributed = 0;

        for (let m = 1; m <= targetMonth; m += 1) {
          b = b * (1 + monthlyRate);

          if (contrib > 0) {
            b += contrib;
            contributed += contrib;
          }

          if (contributionGrowthPct !== 0 && m % 12 === 0) {
            contrib = contrib * (1 + contributionGrowthPct / 100);
          }
        }

        let targetAtEnd = targetAmount;
        if (useInflationTarget && inflationPct > 0) {
          targetAtEnd = targetAmount * Math.pow(1 + inflationMonthly, targetMonth);
        }

        return {
          endBalance: b,
          totalContributed: contributed,
          totalGrowth: b - startingBalance - contributed,
          targetAtEnd: targetAtEnd
        };
      }

      const nominalDetails = reachedNominalMonth !== null ? simulateToMonth(reachedNominalMonth, false) : null;
      const realDetails = (inflationPct > 0 && reachedRealMonth !== null) ? simulateToMonth(reachedRealMonth, true) : null;

      // Secondary insight: balances at 5 and 10 years (if within cap)
      function balanceAtMonths(mths) {
        let b = startingBalance;
        let contrib = monthlyContribution;

        for (let m = 1; m <= mths; m += 1) {
          b = b * (1 + monthlyRate);
          if (contrib > 0) b += contrib;
          if (contributionGrowthPct !== 0 && m % 12 === 0) {
            contrib = contrib * (1 + contributionGrowthPct / 100);
          }
        }
        return b;
      }

      const bal5y = balanceAtMonths(60);
      const bal10y = balanceAtMonths(120);

      // Build output HTML
      let resultHtml = "";

      if (reachedNominalMonth !== null) {
        const dateNominal = addMonthsToNow(reachedNominalMonth);
        resultHtml += `<p><strong>Nominal target reached in:</strong> ${formatDuration(reachedNominalMonth)} (around ${formatMonthYear(dateNominal)})</p>`;
        resultHtml += `<p><strong>Target:</strong> $${formatNumberTwoDecimals(targetAmount)}</p>`;
        resultHtml += `<p><strong>Total contributed:</strong> $${formatNumberTwoDecimals(nominalDetails.totalContributed)}</p>`;
        resultHtml += `<p><strong>Estimated investment growth:</strong> $${formatNumberTwoDecimals(nominalDetails.totalGrowth)}</p>`;
      }

      if (inflationPct > 0) {
        if (reachedRealMonth !== null) {
          const dateReal = addMonthsToNow(reachedRealMonth);
          resultHtml += `<hr>`;
          resultHtml += `<p><strong>Inflation-adjusted target reached in:</strong> ${formatDuration(reachedRealMonth)} (around ${formatMonthYear(dateReal)})</p>`;
          resultHtml += `<p><strong>Inflation-adjusted target at that time:</strong> $${formatNumberTwoDecimals(realDetails.targetAtEnd)}</p>`;
          resultHtml += `<p><strong>Total contributed:</strong> $${formatNumberTwoDecimals(realDetails.totalContributed)}</p>`;
          resultHtml += `<p><strong>Estimated investment growth:</strong> $${formatNumberTwoDecimals(realDetails.totalGrowth)}</p>`;
        } else {
          resultHtml += `<hr>`;
          resultHtml += `<p><strong>Inflation-adjusted result:</strong> Not reached within 100 years at ${inflationPct}% inflation. The nominal target may be reached, but purchasing power equivalent to your target is harder to reach.</p>`;
        }
      }

      resultHtml += `<hr>`;
      resultHtml += `<p><strong>Milestones (same assumptions):</strong></p>`;
      resultHtml += `<p>Estimated balance after 5 years: $${formatNumberTwoDecimals(bal5y)}</p>`;
      resultHtml += `<p>Estimated balance after 10 years: $${formatNumberTwoDecimals(bal10y)}</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Time-to-Million Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
