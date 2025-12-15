document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const targetAmountInput = document.getElementById("targetAmount");
  const yearsInput = document.getElementById("years");
  const startingAmountInput = document.getElementById("startingAmount");
  const monthlyContributionInput = document.getElementById("monthlyContribution");
  const annualFeePercentInput = document.getElementById("annualFeePercent");
  const annualInflationPercentInput = document.getElementById("annualInflationPercent");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Money-like fields
  attachLiveFormatting(targetAmountInput);
  attachLiveFormatting(startingAmountInput);
  attachLiveFormatting(monthlyContributionInput);

  // Percent fields (still comma-format safe; users may paste large values)
  attachLiveFormatting(annualFeePercentInput);
  attachLiveFormatting(annualInflationPercentInput);

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

  function validateReasonablePercent(value, fieldLabel, max) {
    if (!Number.isFinite(value) || value < 0 || value > max) {
      setResultError("Enter a valid " + fieldLabel + " between 0 and " + max + "%.");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // Helpers: FV given annual net rate (compounded monthly)
  // ------------------------------------------------------------
  function futureValueMonthly(pv, pmt, years, annualNetRate) {
    const n = Math.max(0, Math.round(years * 12 * 1000000) / 1000000);
    const months = Math.round(n * 1000000) / 1000000;

    const totalMonths = Math.round(months);
    if (totalMonths <= 0) return pv;

    const rMonthly = Math.pow(1 + annualNetRate, 1 / 12) - 1;

    if (!Number.isFinite(rMonthly)) return NaN;

    if (Math.abs(rMonthly) < 1e-12) {
      return pv + pmt * totalMonths;
    }

    const growth = Math.pow(1 + rMonthly, totalMonths);
    const fvPv = pv * growth;
    const fvPmt = pmt * ((growth - 1) / rMonthly);
    return fvPv + fvPmt;
  }

  function solveRequiredAnnualNetRate(pv, pmt, years, target) {
    // Monotonic in rate for typical ranges where (1+r)>0
    // We use bisection on annual net rate.
    let low = -0.9999;
    let high = 5.0;

    const fvLow = futureValueMonthly(pv, pmt, years, low);
    if (!Number.isFinite(fvLow)) return null;

    // If even near-total loss meets target (rare), required rate is <= low
    if (fvLow >= target) return low;

    let fvHigh = futureValueMonthly(pv, pmt, years, high);
    let expandCount = 0;
    while (Number.isFinite(fvHigh) && fvHigh < target && expandCount < 30) {
      high *= 2;
      fvHigh = futureValueMonthly(pv, pmt, years, high);
      expandCount += 1;
    }

    if (!Number.isFinite(fvHigh) || fvHigh < target) {
      return null;
    }

    for (let i = 0; i < 80; i++) {
      const mid = (low + high) / 2;
      const fvMid = futureValueMonthly(pv, pmt, years, mid);
      if (!Number.isFinite(fvMid)) {
        high = mid;
        continue;
      }
      if (fvMid >= target) {
        high = mid;
      } else {
        low = mid;
      }
    }

    return high;
  }

  function percentStringFromRate(rate) {
    const pct = rate * 100;
    return formatNumberTwoDecimals(pct) + "%";
  }

  function moneyString(value) {
    return formatNumberTwoDecimals(value);
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      const target = toNumber(targetAmountInput ? targetAmountInput.value : "");
      const years = toNumber(yearsInput ? yearsInput.value : "");
      const pvRaw = toNumber(startingAmountInput ? startingAmountInput.value : "");
      const pmtRaw = toNumber(monthlyContributionInput ? monthlyContributionInput.value : "");
      const feePct = toNumber(annualFeePercentInput ? annualFeePercentInput.value : "");
      const inflPct = toNumber(annualInflationPercentInput ? annualInflationPercentInput.value : "");

      const pv = Number.isFinite(pvRaw) ? pvRaw : 0;
      const pmt = Number.isFinite(pmtRaw) ? pmtRaw : 0;

      if (!validatePositive(target, "target amount")) return;
      if (!validatePositive(years, "time horizon (years)")) return;

      if (!validateNonNegative(pv, "starting amount")) return;
      if (!validateNonNegative(pmt, "monthly contribution")) return;

      const feePercent = Number.isFinite(feePct) ? feePct : 0;
      const inflPercent = Number.isFinite(inflPct) ? inflPct : 0;

      if (!validateReasonablePercent(feePercent, "annual fees", 50)) return;
      if (!validateReasonablePercent(inflPercent, "annual inflation", 50)) return;

      if (pv <= 0 && pmt <= 0) {
        setResultError("Enter a starting amount and/or a monthly contribution to fund the goal.");
        return;
      }

      const feeRate = feePercent / 100;
      const inflRate = inflPercent / 100;

      const netRequired = solveRequiredAnnualNetRate(pv, pmt, years, target);

      if (netRequired === null) {
        setResultError("This goal requires an extremely high return with the inputs provided. Increase contributions, extend the time horizon, reduce the target, or lower fees.");
        return;
      }

      // Gross required (approx): (1+gross)*(1-fee) - 1 = net  => gross = (1+net)/(1-fee) - 1
      let grossRequired = null;
      if (feeRate > 0 && feeRate < 1) {
        grossRequired = (1 + netRequired) / (1 - feeRate) - 1;
      }

      // Real return (Fisher relationship): (1+real) = (1+nominal)/(1+inflation)
      let realRequired = null;
      if (inflRate > -1) {
        realRequired = (1 + netRequired) / (1 + inflRate) - 1;
      }

      const totalMonths = Math.round(years * 12);
      const totalContrib = pv + pmt * totalMonths;

      const fvAtNet = futureValueMonthly(pv, pmt, years, netRequired);
      const growthNeeded = fvAtNet - totalContrib;

      const fvAtZero = futureValueMonthly(pv, pmt, years, 0);
      const shortfallAtZero = target - fvAtZero;

      const netPlus1 = netRequired + 0.01;
      const netMinus1 = netRequired - 0.01;

      const fvPlus1 = futureValueMonthly(pv, pmt, years, netPlus1);
      const fvMinus1 = futureValueMonthly(pv, pmt, years, Math.max(-0.9999, netMinus1));

      let targetToday = null;
      if (inflRate > 0) {
        targetToday = target / Math.pow(1 + inflRate, years);
      }

      const resultHtml = `
        <p><strong>Required net return (after fees):</strong> ${percentStringFromRate(netRequired)} per year</p>
        ${grossRequired !== null ? `<p><strong>Estimated gross return (before fees):</strong> ${percentStringFromRate(grossRequired)} per year</p>` : `<p><strong>Estimated gross return (before fees):</strong> Not calculated (fees not provided)</p>`}
        ${realRequired !== null ? `<p><strong>Estimated real return (after inflation):</strong> ${percentStringFromRate(realRequired)} per year</p>` : ``}
        ${targetToday !== null ? `<p><strong>Target in today’s money (inflation-adjusted):</strong> ${moneyString(targetToday)}</p>` : ``}
        <hr>
        <p><strong>Total contributed over ${totalMonths} months:</strong> ${moneyString(totalContrib)}</p>
        <p><strong>Required growth from returns:</strong> ${moneyString(growthNeeded)}</p>
        <p><strong>If return were 0%:</strong> you would reach ${moneyString(fvAtZero)} ${shortfallAtZero > 0 ? `and fall short by ${moneyString(shortfallAtZero)}` : `and exceed your target by ${moneyString(Math.abs(shortfallAtZero))}`}</p>
        <hr>
        <p><strong>Sensitivity check:</strong></p>
        <p>At ${percentStringFromRate(Math.max(-0.9999, netMinus1))} net return: ~${moneyString(fvMinus1)}</p>
        <p>At ${percentStringFromRate(netPlus1)} net return: ~${moneyString(fvPlus1)}</p>
        <p style="margin-top:10px;">Use this as a planning benchmark. If the required return feels too high, the fastest fix is usually higher contributions or more time, not chasing performance.</p>
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
      const message = "Investment Return Required Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
