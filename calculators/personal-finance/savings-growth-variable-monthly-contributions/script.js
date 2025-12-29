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
  const annualContributionChangeInput = document.getElementById("annualContributionChange");
  const annualInterestRateInput = document.getElementById("annualInterestRate");
  const yearsInput = document.getElementById("years");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (Not used in this calculator)

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
  attachLiveFormatting(annualContributionChangeInput);
  attachLiveFormatting(annualInterestRateInput);
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
      const monthlyContributionBase = toNumber(monthlyContributionInput ? monthlyContributionInput.value : "");
      const annualContributionChangePct = toNumber(
        annualContributionChangeInput ? annualContributionChangeInput.value : ""
      );
      const annualInterestRatePct = toNumber(annualInterestRateInput ? annualInterestRateInput.value : "");
      const years = toNumber(yearsInput ? yearsInput.value : "");

      // Basic existence guard
      if (
        !startingBalanceInput ||
        !monthlyContributionInput ||
        !annualContributionChangeInput ||
        !annualInterestRateInput ||
        !yearsInput
      ) {
        return;
      }

      // Validation
      if (!validateNonNegative(startingBalance, "starting balance")) return;
      if (!validateNonNegative(monthlyContributionBase, "monthly contribution")) return;
      if (!validateFinite(annualContributionChangePct, "annual contribution change")) return;
      if (!validateNonNegative(annualInterestRatePct, "annual interest rate")) return;
      if (!validatePositive(years, "time horizon (years)")) return;

      if (years > 100) {
        setResultError("Enter a time horizon of 100 years or less.");
        return;
      }

      if (annualContributionChangePct <= -100) {
        setResultError("Annual contribution change must be greater than -100% so contributions never go negative.");
        return;
      }

      if (annualContributionChangePct > 200) {
        setResultError("Annual contribution change above 200% is unusually high. Enter a more realistic percentage.");
        return;
      }

      // Calculation logic (monthly compounding, contributions added end-of-month, step-up once per year)
      const totalMonths = Math.round(years * 12);
      if (totalMonths <= 0) {
        setResultError("Enter a time horizon that is at least 1 month.");
        return;
      }

      const monthlyRate = (annualInterestRatePct / 100) / 12;
      let balance = startingBalance;
      let totalContributions = 0;

      const yearlyBalances = [];
      const yearlyContributions = [];

      for (let m = 1; m <= totalMonths; m++) {
        const yearIndex = Math.floor((m - 1) / 12); // 0-based
        const growthFactor = Math.pow(1 + (annualContributionChangePct / 100), yearIndex);
        const monthContribution = monthlyContributionBase * growthFactor;

        if (!Number.isFinite(monthContribution) || monthContribution < 0) {
          setResultError("Your contribution settings produce an invalid monthly contribution. Check the change rate.");
          return;
        }

        // Interest first
        if (monthlyRate > 0) {
          balance = balance * (1 + monthlyRate);
        }

        // Contribution at end of month
        balance = balance + monthContribution;
        totalContributions += monthContribution;

        // Year-end snapshots
        if (m % 12 === 0 || m === totalMonths) {
          const yearNum = Math.ceil(m / 12);
          yearlyBalances.push({ year: yearNum, balance: balance });
        }
      }

      const endingBalance = balance;
      const interestEarned = endingBalance - startingBalance - totalContributions;

      // Supporting figures
      const finalYearIndex = Math.floor((totalMonths - 1) / 12);
      const firstYearMonthly = monthlyContributionBase;
      const lastYearMonthly = monthlyContributionBase * Math.pow(1 + (annualContributionChangePct / 100), finalYearIndex);

      const safeInterestEarned = Number.isFinite(interestEarned) ? interestEarned : 0;

      // Build a small projection table (up to 5 rows)
      const totalYearsRounded = Math.max(1, Math.ceil(totalMonths / 12));
      const rows = [];

      function pushYearRow(targetYear) {
        const found = yearlyBalances.find((y) => y.year === targetYear);
        if (!found) return;
        rows.push(found);
      }

      if (totalYearsRounded <= 5) {
        for (let y = 1; y <= totalYearsRounded; y++) pushYearRow(y);
      } else {
        const mid = Math.max(2, Math.round(totalYearsRounded / 2));
        pushYearRow(1);
        pushYearRow(mid);
        pushYearRow(totalYearsRounded);
      }

      const tableRowsHtml = rows
        .map((r) => {
          return `<tr><td>Year ${r.year}</td><td>${formatNumberTwoDecimals(r.balance)}</td></tr>`;
        })
        .join("");

      const resultHtml = `
        <p><strong>Projected ending balance:</strong> ${formatNumberTwoDecimals(endingBalance)}</p>
        <p><strong>Total contributions:</strong> ${formatNumberTwoDecimals(totalContributions)}</p>
        <p><strong>Estimated interest earned:</strong> ${formatNumberTwoDecimals(safeInterestEarned)}</p>
        <table class="result-table" aria-label="Savings projection summary by year">
          <tr>
            <th>Milestone</th>
            <th>Projected balance</th>
          </tr>
          ${tableRowsHtml}
        </table>
        <p><strong>Monthly contribution (year 1):</strong> ${formatNumberTwoDecimals(firstYearMonthly)}</p>
        <p><strong>Monthly contribution (final year):</strong> ${formatNumberTwoDecimals(lastYearMonthly)}</p>
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
      const message = "Savings Growth (Variable Monthly Contributions) - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
