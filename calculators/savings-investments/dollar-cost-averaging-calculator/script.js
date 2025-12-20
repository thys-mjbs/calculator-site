document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const initialLumpSum = document.getElementById("initialLumpSum");
  const contributionAmount = document.getElementById("contributionAmount");
  const contributionFrequency = document.getElementById("contributionFrequency");
  const timeHorizonYears = document.getElementById("timeHorizonYears");
  const annualReturnPct = document.getElementById("annualReturnPct");
  const annualFeePct = document.getElementById("annualFeePct");
  const inflationPct = document.getElementById("inflationPct");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(initialLumpSum);
  attachLiveFormatting(contributionAmount);
  attachLiveFormatting(timeHorizonYears);
  attachLiveFormatting(annualReturnPct);
  attachLiveFormatting(annualFeePct);
  attachLiveFormatting(inflationPct);

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

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return value;
    return Math.min(Math.max(value, min), max);
  }

  function freqToPeriodsPerYear(freq) {
    if (freq === "weekly") return 52;
    if (freq === "biweekly") return 26;
    if (freq === "monthly") return 12;
    if (freq === "quarterly") return 4;
    if (freq === "yearly") return 1;
    return 12;
  }

  function formatMoney(n) {
    return formatNumberTwoDecimals(n);
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const lump = toNumber(initialLumpSum ? initialLumpSum.value : "");
      const contrib = toNumber(contributionAmount ? contributionAmount.value : "");
      const years = toNumber(timeHorizonYears ? timeHorizonYears.value : "");
      const freq = contributionFrequency ? contributionFrequency.value : "monthly";

      let annualReturn = toNumber(annualReturnPct ? annualReturnPct.value : "");
      let annualFee = toNumber(annualFeePct ? annualFeePct.value : "");
      let inflation = toNumber(inflationPct ? inflationPct.value : "");

      // Defaults for optional fields
      if (!Number.isFinite(annualReturn)) annualReturn = 7;
      if (!Number.isFinite(annualFee)) annualFee = 0;
      if (!Number.isFinite(inflation)) inflation = 0;

      // Basic existence guard
      if (!contributionAmount || !timeHorizonYears || !contributionFrequency) return;

      // Validation
      if (!validatePositive(contrib, "contribution amount")) return;
      if (!validatePositive(years, "time horizon (years)")) return;
      if (!validateNonNegative(lump, "initial lump sum")) return;
      if (!validateNonNegative(annualFee, "annual fee %")) return;
      if (!validateNonNegative(inflation, "inflation %")) return;

      // Reasonable bounds (avoid nonsense without being hostile)
      annualReturn = clamp(annualReturn, -50, 50);
      annualFee = clamp(annualFee, 0, 10);
      inflation = clamp(inflation, 0, 20);

      const periodsPerYear = freqToPeriodsPerYear(freq);
      const totalPeriods = Math.max(1, Math.round(years * periodsPerYear));

      // Net annual return approximation (fees reduce expected return)
      const netAnnualReturnPct = annualReturn - annualFee;
      const netAnnualRate = netAnnualReturnPct / 100;

      // Periodic rate
      const periodicRate = Math.pow(1 + netAnnualRate, 1 / periodsPerYear) - 1;

      // DCA simulation (contributions at end of each period)
      let balanceDca = 0;
      if (Number.isFinite(lump) && lump > 0) balanceDca = lump;

      let contributedTotal = (Number.isFinite(lump) ? lump : 0);
      const yearlyRows = [];

      for (let p = 1; p <= totalPeriods; p++) {
        // grow existing
        balanceDca = balanceDca * (1 + periodicRate);

        // add contribution
        balanceDca = balanceDca + contrib;
        contributedTotal += contrib;

        // snapshot at year boundaries (or final)
        const isYearEnd = (p % periodsPerYear === 0);
        const isFinal = (p === totalPeriods);
        if (isYearEnd || isFinal) {
          const yearIndex = Math.ceil(p / periodsPerYear);
          const growth = balanceDca - contributedTotal;
          yearlyRows.push({
            year: yearIndex,
            contributed: contributedTotal,
            balance: balanceDca,
            growth: growth
          });
        }
      }

      const endingDca = balanceDca;
      const growthDca = endingDca - contributedTotal;

      // Lump sum comparison: invest the same total contributions at start
      // Use the same compounding frequency and net return
      const lumpStart = contributedTotal;
      const endingLump = lumpStart * Math.pow(1 + periodicRate, totalPeriods);
      const growthLump = endingLump - lumpStart;

      const diff = endingLump - endingDca;

      // Inflation-adjusted ending values (optional)
      const inflationRate = inflation / 100;
      const discountFactor = Math.pow(1 + inflationRate, years);
      const endingDcaReal = discountFactor > 0 ? (endingDca / discountFactor) : endingDca;
      const endingLumpReal = discountFactor > 0 ? (endingLump / discountFactor) : endingLump;

      // Build output HTML
      const freqLabelMap = {
        weekly: "Weekly",
        biweekly: "Every 2 weeks",
        monthly: "Monthly",
        quarterly: "Quarterly",
        yearly: "Yearly"
      };
      const freqLabel = freqLabelMap[freq] || "Monthly";

      const assumptions = [];
      assumptions.push("Return default used: " + (annualReturnPct && annualReturnPct.value.trim() ? annualReturn.toFixed(2) + "%" : "7.00%"));
      assumptions.push("Fee default used: " + (annualFeePct && annualFeePct.value.trim() ? annualFee.toFixed(2) + "%" : "0.00%"));
      assumptions.push("Inflation default used: " + (inflationPct && inflationPct.value.trim() ? inflation.toFixed(2) + "%" : "0.00%"));

      const trendNote =
        diff > 0
          ? "With steady positive returns, investing earlier usually wins. Your lump-sum comparison ends higher by " + formatMoney(diff) + "."
          : diff < 0
          ? "In this steady-return model, your DCA schedule ends higher by " + formatMoney(Math.abs(diff)) + "."
          : "In this steady-return model, both approaches end at the same value.";

      let tableHtml = "";
      if (yearlyRows.length > 0) {
        const lastRows = yearlyRows.slice(Math.max(0, yearlyRows.length - 6)); // show last up to 6 snapshots
        const rowsHtml = lastRows
          .map(function (r) {
            return (
              "<tr>" +
              "<td>Year " + r.year + "</td>" +
              "<td>" + formatMoney(r.contributed) + "</td>" +
              "<td>" + formatMoney(r.balance) + "</td>" +
              "<td>" + formatMoney(r.growth) + "</td>" +
              "</tr>"
            );
          })
          .join("");

        tableHtml =
          '<div class="table-wrap">' +
          '<table class="result-table" aria-label="Balance snapshots table">' +
          "<thead><tr><th>Snapshot</th><th>Contributed</th><th>Balance</th><th>Growth</th></tr></thead>" +
          "<tbody>" + rowsHtml + "</tbody>" +
          "</table>" +
          "</div>";
      }

      const resultHtml =
        '<div class="result-grid">' +
          '<div class="result-row"><span class="label">Schedule</span><span class="value">' + freqLabel + " for " + years + " years</span></div>" +
          '<div class="result-row"><span class="label">Net return used</span><span class="value">' + netAnnualReturnPct.toFixed(2) + "% / year</span></div>" +
          '<div class="result-row"><span class="label">Total contributed</span><span class="value">' + formatMoney(contributedTotal) + "</span></div>" +
          '<div class="result-row"><span class="label">DCA ending value</span><span class="value">' + formatMoney(endingDca) + "</span></div>" +
          '<div class="result-row"><span class="label">DCA growth</span><span class="value">' + formatMoney(growthDca) + "</span></div>" +
          '<div class="result-row"><span class="label">Lump-sum ending value</span><span class="value">' + formatMoney(endingLump) + "</span></div>" +
          '<div class="result-row"><span class="label">Difference</span><span class="value">' + formatMoney(diff) + "</span></div>" +
        "</div>" +
        '<div class="result-note">' +
          "<strong>What this means:</strong> " + trendNote +
          "<br><br><strong>Inflation-adjusted (today’s money):</strong> DCA ≈ " + formatMoney(endingDcaReal) + ", Lump sum ≈ " + formatMoney(endingLumpReal) + "." +
          "<br><br><strong>Assumptions used:</strong> " + assumptions.join(" | ") +
        "</div>" +
        tableHtml;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Dollar-Cost Averaging Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
