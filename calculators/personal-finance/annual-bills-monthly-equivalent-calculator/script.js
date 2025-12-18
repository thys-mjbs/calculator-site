document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const modeSelect = document.getElementById("modeSelect");
  const modeQuickBlock = document.getElementById("modeQuickBlock");
  const modeDetailedBlock = document.getElementById("modeDetailedBlock");

  const annualTotalInput = document.getElementById("annualTotalInput");
  const payFrequencySelect = document.getElementById("payFrequencySelect");

  const billName1 = document.getElementById("billName1");
  const billAmount1 = document.getElementById("billAmount1");
  const billFreq1 = document.getElementById("billFreq1");

  const billName2 = document.getElementById("billName2");
  const billAmount2 = document.getElementById("billAmount2");
  const billFreq2 = document.getElementById("billFreq2");

  const billName3 = document.getElementById("billName3");
  const billAmount3 = document.getElementById("billAmount3");
  const billFreq3 = document.getElementById("billFreq3");

  const billName4 = document.getElementById("billName4");
  const billAmount4 = document.getElementById("billAmount4");
  const billFreq4 = document.getElementById("billFreq4");

  const billName5 = document.getElementById("billName5");
  const billAmount5 = document.getElementById("billAmount5");
  const billFreq5 = document.getElementById("billFreq5");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(annualTotalInput);
  attachLiveFormatting(billAmount1);
  attachLiveFormatting(billAmount2);
  attachLiveFormatting(billAmount3);
  attachLiveFormatting(billAmount4);
  attachLiveFormatting(billAmount5);

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
  // 4) MODE HANDLING
  // ------------------------------------------------------------
  function showMode(mode) {
    if (modeQuickBlock) modeQuickBlock.classList.add("hidden");
    if (modeDetailedBlock) modeDetailedBlock.classList.add("hidden");

    if (mode === "detailed") {
      if (modeDetailedBlock) modeDetailedBlock.classList.remove("hidden");
    } else {
      if (modeQuickBlock) modeQuickBlock.classList.remove("hidden");
    }

    clearResult();
  }

  if (modeSelect) {
    showMode(modeSelect.value);
    modeSelect.addEventListener("change", function () {
      showMode(modeSelect.value);
    });
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

  // ------------------------------------------------------------
  // Helpers for this calculator
  // ------------------------------------------------------------
  function getPayPeriodsPerYear(payFrequency) {
    if (payFrequency === "weekly") return 52;
    if (payFrequency === "biweekly") return 26;
    if (payFrequency === "semimonthly") return 24;
    return 12; // monthly default
  }

  function monthlyEquivalent(amount, frequency) {
    if (!Number.isFinite(amount) || amount <= 0) return 0;

    if (frequency === "monthly") return amount;
    if (frequency === "quarterly") return (amount * 4) / 12;
    if (frequency === "semiannual") return (amount * 2) / 12;
    if (frequency === "weekly") return (amount * 52) / 12;
    if (frequency === "biweekly") return (amount * 26) / 12;

    // annual default
    return amount / 12;
  }

  function buildDetailedBills() {
    const rows = [
      { nameEl: billName1, amtEl: billAmount1, freqEl: billFreq1, idx: 1 },
      { nameEl: billName2, amtEl: billAmount2, freqEl: billFreq2, idx: 2 },
      { nameEl: billName3, amtEl: billAmount3, freqEl: billFreq3, idx: 3 },
      { nameEl: billName4, amtEl: billAmount4, freqEl: billFreq4, idx: 4 },
      { nameEl: billName5, amtEl: billAmount5, freqEl: billFreq5, idx: 5 }
    ];

    const breakdown = [];
    let monthlyTotal = 0;

    rows.forEach(function (row) {
      const amt = toNumber(row.amtEl ? row.amtEl.value : "");
      const freq = row.freqEl ? row.freqEl.value : "annual";

      if (!Number.isFinite(amt) || amt <= 0) return;

      const m = monthlyEquivalent(amt, freq);
      monthlyTotal += m;

      const rawName = row.nameEl ? String(row.nameEl.value || "").trim() : "";
      const displayName = rawName.length > 0 ? rawName : "Bill " + row.idx;

      breakdown.push({
        name: displayName,
        monthly: m,
        frequency: freq,
        amount: amt
      });
    });

    return { monthlyTotal: monthlyTotal, breakdown: breakdown };
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = modeSelect ? modeSelect.value : "quick";
      const payFrequency = payFrequencySelect ? payFrequencySelect.value : "monthly";
      const payPeriods = getPayPeriodsPerYear(payFrequency);

      let monthlyTotal = 0;
      let annualTotal = 0;
      let breakdown = [];

      if (mode === "detailed") {
        const detailed = buildDetailedBills();
        monthlyTotal = detailed.monthlyTotal;
        breakdown = detailed.breakdown;

        if (!validatePositive(monthlyTotal, "total monthly equivalent")) return;

        annualTotal = monthlyTotal * 12;
      } else {
        const annual = toNumber(annualTotalInput ? annualTotalInput.value : "");
        if (!validatePositive(annual, "total annual bills")) return;

        annualTotal = annual;
        monthlyTotal = annualTotal / 12;
      }

      // Secondary conversions
      const weeklyEquivalent = (annualTotal / 52);
      const dailyEquivalent = (annualTotal / 365);
      const perPaycheck = annualTotal / payPeriods;

      // Build output HTML
      let breakdownHtml = "";
      if (mode === "detailed") {
        if (breakdown.length === 0) {
          breakdownHtml = "<p><strong>Bill breakdown:</strong> No bill rows were filled in. Add at least one bill amount to use detailed mode.</p>";
        } else {
          const items = breakdown
            .sort(function (a, b) { return b.monthly - a.monthly; })
            .map(function (b) {
              return "<li><strong>" + escapeHtml(b.name) + ":</strong> " + formatNumberTwoDecimals(b.monthly) + " per month (from " + formatNumberTwoDecimals(b.amount) + " " + formatFreqLabel(b.frequency) + ")</li>";
            })
            .join("");

          breakdownHtml =
            "<p><strong>Bill breakdown (monthly equivalents):</strong></p>" +
            "<ul>" + items + "</ul>";
        }
      }

      const resultHtml =
        "<p><strong>Monthly equivalent:</strong> " + formatNumberTwoDecimals(monthlyTotal) + "</p>" +
        "<p><strong>Annual total:</strong> " + formatNumberTwoDecimals(annualTotal) + "</p>" +
        "<p><strong>Weekly equivalent:</strong> " + formatNumberTwoDecimals(weeklyEquivalent) + "</p>" +
        "<p><strong>Daily equivalent:</strong> " + formatNumberTwoDecimals(dailyEquivalent) + "</p>" +
        "<p><strong>Suggested set-aside per paycheck:</strong> " + formatNumberTwoDecimals(perPaycheck) + " (" + escapeHtml(formatPayLabel(payFrequency)) + ")</p>" +
        breakdownHtml +
        "<p class=\"note\">Tip: Put this set-aside into a separate bills fund so irregular bills stop disrupting your monthly spending.</p>";

      setResultSuccess(resultHtml);
    });
  }

  function formatFreqLabel(freq) {
    if (freq === "monthly") return "monthly";
    if (freq === "quarterly") return "quarterly";
    if (freq === "semiannual") return "every 6 months";
    if (freq === "weekly") return "weekly";
    if (freq === "biweekly") return "every 2 weeks";
    return "annual";
  }

  function formatPayLabel(freq) {
    if (freq === "weekly") return "weekly pay";
    if (freq === "biweekly") return "biweekly pay";
    if (freq === "semimonthly") return "twice-monthly pay";
    return "monthly pay";
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Annual Bills Monthly Equivalent Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
