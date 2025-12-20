/* script.js */
document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const lumpSumAmountInput = document.getElementById("lumpSumAmount");
  const recurringAmountInput = document.getElementById("recurringAmount");
  const frequencySelect = document.getElementById("frequency");
  const yearsInput = document.getElementById("years");
  const annualReturnInput = document.getElementById("annualReturn");
  const timingSelect = document.getElementById("timing");
  const annualIncreaseInput = document.getElementById("annualIncrease");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(lumpSumAmountInput);
  attachLiveFormatting(recurringAmountInput);
  attachLiveFormatting(yearsInput);
  attachLiveFormatting(annualReturnInput);
  attachLiveFormatting(annualIncreaseInput);

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

  function getPeriodsPerYear(freq) {
    if (freq === "weekly") return 52;
    if (freq === "annual") return 1;
    return 12; // monthly default
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function simulateRecurringFV(params) {
    const periodsPerYear = params.periodsPerYear;
    const years = params.years;
    const annualReturn = params.annualReturn;
    const startPayment = params.startPayment;
    const timing = params.timing; // "begin" | "end"
    const annualIncrease = params.annualIncrease;

    const N = Math.round(years * periodsPerYear);
    const r = annualReturn / 100;
    const i = periodsPerYear > 0 ? r / periodsPerYear : 0;

    const annualInc = annualIncrease / 100;
    const gPerPeriod = periodsPerYear > 0 ? Math.pow(1 + annualInc, 1 / periodsPerYear) - 1 : 0;

    let balance = 0;
    let totalContrib = 0;
    let payment = startPayment;

    for (let p = 1; p <= N; p++) {
      if (timing === "begin") {
        if (payment > 0) {
          balance += payment;
          totalContrib += payment;
        }
      }

      if (i !== 0) {
        balance *= (1 + i);
      }

      if (timing === "end") {
        if (payment > 0) {
          balance += payment;
          totalContrib += payment;
        }
      }

      if (gPerPeriod !== 0) {
        payment *= (1 + gPerPeriod);
      }
    }

    return {
      fv: balance,
      totalContrib: totalContrib
    };
  }

  function computeLumpSumFV(lumpSum, years, annualReturn, periodsPerYear) {
    const r = annualReturn / 100;
    const n = periodsPerYear;
    if (lumpSum <= 0) return 0;
    if (years <= 0) return lumpSum;
    if (r === 0) return lumpSum;
    return lumpSum * Math.pow(1 + (r / n), n * years);
  }

  function solveEquivalentRecurringPayment(targetFV, paramsBase) {
    if (!Number.isFinite(targetFV) || targetFV <= 0) return 0;

    const annualIncrease = paramsBase.annualIncrease;
    const timing = paramsBase.timing;
    const periodsPerYear = paramsBase.periodsPerYear;
    const years = paramsBase.years;
    const annualReturn = paramsBase.annualReturn;

    // If there's no time or no periods, just return 0 to avoid nonsense.
    if (years <= 0 || periodsPerYear <= 0) return 0;

    // Bracket solution with expanding upper bound
    let low = 0;
    let high = 1;

    const maxHigh = 1e9;
    const maxIterations = 80;

    function fvForPayment(pmt) {
      const sim = simulateRecurringFV({
        periodsPerYear: periodsPerYear,
        years: years,
        annualReturn: annualReturn,
        startPayment: pmt,
        timing: timing,
        annualIncrease: annualIncrease
      });
      return sim.fv;
    }

    let fvHigh = fvForPayment(high);
    let safety = 0;
    while (fvHigh < targetFV && high < maxHigh && safety < 60) {
      high *= 2;
      fvHigh = fvForPayment(high);
      safety++;
    }

    if (fvHigh < targetFV) return high; // best effort fallback

    // Bisection
    for (let k = 0; k < maxIterations; k++) {
      const mid = (low + high) / 2;
      const fvMid = fvForPayment(mid);

      if (!Number.isFinite(fvMid)) {
        high = mid;
        continue;
      }

      if (fvMid >= targetFV) {
        high = mid;
      } else {
        low = mid;
      }
    }

    return (low + high) / 2;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const lumpSum = toNumber(lumpSumAmountInput ? lumpSumAmountInput.value : "");
      const recurring = toNumber(recurringAmountInput ? recurringAmountInput.value : "");
      const years = toNumber(yearsInput ? yearsInput.value : "");
      const annualReturn = toNumber(annualReturnInput ? annualReturnInput.value : "");
      const annualIncrease = toNumber(annualIncreaseInput ? annualIncreaseInput.value : "");
      const frequency = frequencySelect ? frequencySelect.value : "monthly";
      const timing = timingSelect ? timingSelect.value : "end";

      // Existence guard
      if (
        !lumpSumAmountInput ||
        !recurringAmountInput ||
        !yearsInput ||
        !annualReturnInput ||
        !frequencySelect ||
        !timingSelect ||
        !annualIncreaseInput
      ) {
        return;
      }

      clearResult();

      // Validation
      if (!validatePositive(years, "investment duration")) return;

      if (!Number.isFinite(annualReturn)) {
        setResultError("Enter a valid expected annual return (percentage).");
        return;
      }

      // Reasonable bounds (not strict, but stops nonsense)
      const yearsClamped = clamp(years, 0.01, 100);
      const annualReturnClamped = clamp(annualReturn, -99, 200);
      const annualIncreaseClamped = clamp(annualIncrease, 0, 100);

      if (!validateNonNegative(lumpSum, "one-time investment amount")) return;
      if (!validateNonNegative(recurring, "recurring contribution amount")) return;

      if (lumpSum <= 0 && recurring <= 0) {
        setResultError("Enter at least a one-time amount or a recurring amount to compare.");
        return;
      }

      const periodsPerYear = getPeriodsPerYear(frequency);

      // Calculation logic
      const fvLumpSum = computeLumpSumFV(lumpSum, yearsClamped, annualReturnClamped, periodsPerYear);

      const recurringSim = simulateRecurringFV({
        periodsPerYear: periodsPerYear,
        years: yearsClamped,
        annualReturn: annualReturnClamped,
        startPayment: recurring,
        timing: timing,
        annualIncrease: annualIncreaseClamped
      });

      const fvRecurring = recurringSim.fv;
      const totalRecurringContrib = recurringSim.totalContrib;

      const totalLumpSumContrib = lumpSum;
      const growthLumpSum = fvLumpSum - totalLumpSumContrib;
      const growthRecurring = fvRecurring - totalRecurringContrib;

      const diff = fvLumpSum - fvRecurring;
      const absDiff = Math.abs(diff);

      const equivalentPayment = solveEquivalentRecurringPayment(fvLumpSum, {
        periodsPerYear: periodsPerYear,
        years: yearsClamped,
        annualReturn: annualReturnClamped,
        timing: timing,
        annualIncrease: annualIncreaseClamped
      });

      const freqLabel = frequency === "weekly" ? "per week" : (frequency === "annual" ? "per year" : "per month");
      const timingLabel = timing === "begin" ? "Beginning of period" : "End of period";

      // Build output HTML
      const winner =
        (fvLumpSum > fvRecurring)
          ? "One-time investment ends higher under these assumptions."
          : (fvRecurring > fvLumpSum)
            ? "Recurring contributions end higher under these assumptions."
            : "Both approaches end at the same value under these assumptions.";

      const diffLine =
        (diff > 0)
          ? "One-time ends higher by " + formatNumberTwoDecimals(absDiff) + "."
          : (diff < 0)
            ? "Recurring ends higher by " + formatNumberTwoDecimals(absDiff) + "."
            : "There is no difference in ending value.";

      const resultHtml =
        `<p><strong>Result:</strong> ${winner}</p>
         <ul class="result-kpis">
           <li><strong>Comparison:</strong> ${diffLine}</li>
           <li><strong>Equivalent recurring amount to match the one-time ending value:</strong> ${formatNumberTwoDecimals(equivalentPayment)} ${freqLabel}</li>
           <li><strong>Assumptions used:</strong> ${formatNumberTwoDecimals(annualReturnClamped)}% annual return, ${formatNumberTwoDecimals(yearsClamped)} years, ${timingLabel}, ${formatNumberTwoDecimals(annualIncreaseClamped)}% annual contribution increase</li>
         </ul>

         <div class="result-table-wrap" role="region" aria-label="Comparison table" tabindex="0">
           <table class="result-table">
             <thead>
               <tr>
                 <th>Strategy</th>
                 <th>Total contributed</th>
                 <th>Ending value</th>
                 <th>Investment growth</th>
               </tr>
             </thead>
             <tbody>
               <tr>
                 <td>One-time</td>
                 <td>${formatNumberTwoDecimals(totalLumpSumContrib)}</td>
                 <td>${formatNumberTwoDecimals(fvLumpSum)}</td>
                 <td>${formatNumberTwoDecimals(growthLumpSum)}</td>
               </tr>
               <tr>
                 <td>Recurring</td>
                 <td>${formatNumberTwoDecimals(totalRecurringContrib)}</td>
                 <td>${formatNumberTwoDecimals(fvRecurring)}</td>
                 <td>${formatNumberTwoDecimals(growthRecurring)}</td>
               </tr>
             </tbody>
           </table>
         </div>

         <p class="result-note">
           If the one-time amount is available today, it typically has more time to compound. Recurring contributions can be easier to sustain and may be more realistic if you do not have a lump sum.
         </p>`;

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
      const message = "One-Time vs Recurring Investment Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
