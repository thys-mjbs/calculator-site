document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const compareMonthsInput = document.getElementById("compareMonths");

  const priceAInput = document.getElementById("priceA");
  const cycleMonthsAInput = document.getElementById("cycleMonthsA");
  const upfrontFeeAInput = document.getElementById("upfrontFeeA");
  const discountPctAInput = document.getElementById("discountPctA");
  const discountCyclesAInput = document.getElementById("discountCyclesA");

  const priceBInput = document.getElementById("priceB");
  const cycleMonthsBInput = document.getElementById("cycleMonthsB");
  const upfrontFeeBInput = document.getElementById("upfrontFeeB");
  const discountPctBInput = document.getElementById("discountPctB");
  const discountCyclesBInput = document.getElementById("discountCyclesB");

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
  attachLiveFormatting(compareMonthsInput);

  attachLiveFormatting(priceAInput);
  attachLiveFormatting(cycleMonthsAInput);
  attachLiveFormatting(upfrontFeeAInput);
  attachLiveFormatting(discountPctAInput);
  attachLiveFormatting(discountCyclesAInput);

  attachLiveFormatting(priceBInput);
  attachLiveFormatting(cycleMonthsBInput);
  attachLiveFormatting(upfrontFeeBInput);
  attachLiveFormatting(discountPctBInput);
  attachLiveFormatting(discountCyclesBInput);

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

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(Math.max(value, min), max);
  }

  function cyclesNeeded(months, cycleMonths) {
    return Math.ceil(months / cycleMonths);
  }

  function cyclePriceWithDiscount(basePrice, cycleIndex, discountPct, discountCycles) {
    const pct = clamp(discountPct, 0, 100);
    const dc = Math.max(0, Math.floor(discountCycles));
    if (dc > 0 && cycleIndex <= dc && pct > 0) {
      return basePrice * (1 - pct / 100);
    }
    return basePrice;
  }

  function totalCostOverMonths(months, basePrice, cycleMonths, upfrontFee, discountPct, discountCycles) {
    const fee = Math.max(0, upfrontFee);
    const cycles = cyclesNeeded(months, cycleMonths);
    let total = fee;

    for (let i = 1; i <= cycles; i++) {
      total += cyclePriceWithDiscount(basePrice, i, discountPct, discountCycles);
    }
    return total;
  }

  function cumulativeCostByMonth(months, basePrice, cycleMonths, upfrontFee, discountPct, discountCycles) {
    const fee = Math.max(0, upfrontFee);
    const arr = [];
    for (let m = 1; m <= months; m++) {
      const startedCycles = Math.ceil(m / cycleMonths);
      let total = fee;
      for (let i = 1; i <= startedCycles; i++) {
        total += cyclePriceWithDiscount(basePrice, i, discountPct, discountCycles);
      }
      arr.push(total);
    }
    return arr;
  }

  function findBreakEvenMonth(months, cumA, cumB) {
    if (!Array.isArray(cumA) || !Array.isArray(cumB) || cumA.length !== months || cumB.length !== months) {
      return null;
    }
    for (let m = 1; m <= months; m++) {
      const a = cumA[m - 1];
      const b = cumB[m - 1];
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue;

      if (a === b) return m;

      if (m > 1) {
        const prevA = cumA[m - 2];
        const prevB = cumB[m - 2];

        const prevDiff = prevA - prevB;
        const diff = a - b;

        if (prevDiff === 0) return m - 1;
        if ((prevDiff > 0 && diff < 0) || (prevDiff < 0 && diff > 0)) {
          return m;
        }
      }
    }
    return null;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse inputs using toNumber() (from /scripts/main.js)
      const compareMonths = toNumber(compareMonthsInput ? compareMonthsInput.value : "");

      const priceA = toNumber(priceAInput ? priceAInput.value : "");
      const cycleMonthsA = toNumber(cycleMonthsAInput ? cycleMonthsAInput.value : "");
      const upfrontFeeA = toNumber(upfrontFeeAInput ? upfrontFeeAInput.value : "");
      const discountPctA = toNumber(discountPctAInput ? discountPctAInput.value : "");
      const discountCyclesA = toNumber(discountCyclesAInput ? discountCyclesAInput.value : "");

      const priceB = toNumber(priceBInput ? priceBInput.value : "");
      const cycleMonthsB = toNumber(cycleMonthsBInput ? cycleMonthsBInput.value : "");
      const upfrontFeeB = toNumber(upfrontFeeBInput ? upfrontFeeBInput.value : "");
      const discountPctB = toNumber(discountPctBInput ? discountPctBInput.value : "");
      const discountCyclesB = toNumber(discountCyclesBInput ? discountCyclesBInput.value : "");

      // Validation
      const monthsInt = Math.floor(compareMonths);
      if (!validatePositive(monthsInt, "comparison period (months)")) return;
      if (monthsInt > 600) {
        setResultError("Enter a comparison period of 600 months or less.");
        return;
      }

      if (!validatePositive(priceA, "Plan A price")) return;
      if (!validatePositive(cycleMonthsA, "Plan A billing cycle length (months)")) return;

      if (!validatePositive(priceB, "Plan B price")) return;
      if (!validatePositive(cycleMonthsB, "Plan B billing cycle length (months)")) return;

      if (!validateNonNegative(upfrontFeeA, "Plan A one-time fee")) return;
      if (!validateNonNegative(upfrontFeeB, "Plan B one-time fee")) return;

      if (!validateNonNegative(discountPctA, "Plan A discount (%)")) return;
      if (!validateNonNegative(discountPctB, "Plan B discount (%)")) return;

      if (discountPctA > 100 || discountPctB > 100) {
        setResultError("Discount percentage must be 100 or less.");
        return;
      }

      if (!validateNonNegative(discountCyclesA, "Plan A discount cycles")) return;
      if (!validateNonNegative(discountCyclesB, "Plan B discount cycles")) return;

      const cycleAInt = Math.floor(cycleMonthsA);
      const cycleBInt = Math.floor(cycleMonthsB);
      if (cycleAInt <= 0 || cycleBInt <= 0) {
        setResultError("Billing cycle length must be at least 1 month.");
        return;
      }

      // Calculation logic
      const totalA = totalCostOverMonths(
        monthsInt,
        priceA,
        cycleAInt,
        upfrontFeeA || 0,
        discountPctA || 0,
        discountCyclesA || 0
      );

      const totalB = totalCostOverMonths(
        monthsInt,
        priceB,
        cycleBInt,
        upfrontFeeB || 0,
        discountPctB || 0,
        discountCyclesB || 0
      );

      const avgA = totalA / monthsInt;
      const avgB = totalB / monthsInt;

      const cheaperPlan = totalA < totalB ? "Plan A" : totalB < totalA ? "Plan B" : "Tie";
      const savings = Math.abs(totalA - totalB);

      const cumA = cumulativeCostByMonth(monthsInt, priceA, cycleAInt, upfrontFeeA || 0, discountPctA || 0, discountCyclesA || 0);
      const cumB = cumulativeCostByMonth(monthsInt, priceB, cycleBInt, upfrontFeeB || 0, discountPctB || 0, discountCyclesB || 0);
      const breakEven = findBreakEvenMonth(monthsInt, cumA, cumB);

      // Build output HTML
      const totalAFormatted = formatNumberTwoDecimals(totalA);
      const totalBFormatted = formatNumberTwoDecimals(totalB);
      const avgAFormatted = formatNumberTwoDecimals(avgA);
      const avgBFormatted = formatNumberTwoDecimals(avgB);
      const savingsFormatted = formatNumberTwoDecimals(savings);

      let verdictLine = "";
      if (cheaperPlan === "Tie") {
        verdictLine = "<p><strong>Result:</strong> Both plans cost the same over " + monthsInt + " months.</p>";
      } else {
        verdictLine =
          "<p><strong>Cheaper over " +
          monthsInt +
          " months:</strong> " +
          cheaperPlan +
          " (saves " +
          savingsFormatted +
          " compared to the other plan).</p>";
      }

      let breakEvenLine = "<p><strong>Break-even month:</strong> Not detected within this comparison period.</p>";
      if (breakEven !== null) {
        breakEvenLine = "<p><strong>Break-even month:</strong> Around month " + breakEven + " the running totals cross or match.</p>";
      }

      const resultHtml =
        verdictLine +
        "<p><strong>Plan A total:</strong> " +
        totalAFormatted +
        " (avg " +
        avgAFormatted +
        " per month)</p>" +
        "<p><strong>Plan B total:</strong> " +
        totalBFormatted +
        " (avg " +
        avgBFormatted +
        " per month)</p>" +
        breakEvenLine +
        "<p class=\"result-note\"><strong>Note:</strong> Totals include full billing cycles that start within the period, plus any one-time fee.</p>";

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
      const message = "Subscription Comparison Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
