document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const initialGross = document.getElementById("initialGross");
  const annualGross = document.getElementById("annualGross");
  const yearsInput = document.getElementById("years");
  const annualReturn = document.getElementById("annualReturn");
  const taxNow = document.getElementById("taxNow");
  const taxWithdraw = document.getElementById("taxWithdraw");

  // Advanced (optional)
  const dividendYield = document.getElementById("dividendYield");
  const dividendTaxRate = document.getElementById("dividendTaxRate");
  const capGainsTaxRate = document.getElementById("capGainsTaxRate");
  const expenseRatio = document.getElementById("expenseRatio");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(initialGross);
  attachLiveFormatting(annualGross);
  attachLiveFormatting(yearsInput);
  attachLiveFormatting(annualReturn);
  attachLiveFormatting(taxNow);
  attachLiveFormatting(taxWithdraw);
  attachLiveFormatting(dividendYield);
  attachLiveFormatting(dividendTaxRate);
  attachLiveFormatting(capGainsTaxRate);
  attachLiveFormatting(expenseRatio);

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

  function validatePercent(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      setResultError("Enter a valid " + fieldLabel + " between 0 and 100.");
      return false;
    }
    return true;
  }

  function clampToRange(value, min, max) {
    if (!Number.isFinite(value)) return value;
    return Math.min(max, Math.max(min, value));
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      const initialGrossVal = toNumber(initialGross ? initialGross.value : "");
      const annualGrossVal = toNumber(annualGross ? annualGross.value : "");
      const yearsValRaw = toNumber(yearsInput ? yearsInput.value : "");
      const annualReturnPct = toNumber(annualReturn ? annualReturn.value : "");
      const taxNowPct = toNumber(taxNow ? taxNow.value : "");
      const taxWithdrawPct = toNumber(taxWithdraw ? taxWithdraw.value : "");

      const dividendYieldPctRaw = toNumber(dividendYield ? dividendYield.value : "");
      const dividendTaxPctRaw = toNumber(dividendTaxRate ? dividendTaxRate.value : "");
      const capGainsPctRaw = toNumber(capGainsTaxRate ? capGainsTaxRate.value : "");
      const expensePctRaw = toNumber(expenseRatio ? expenseRatio.value : "");

      if (!initialGross || !annualGross || !yearsInput || !annualReturn || !taxNow || !taxWithdraw) return;

      if (!validateNonNegative(initialGrossVal, "initial lump sum")) return;
      if (!validateNonNegative(annualGrossVal, "annual contribution")) return;

      if (!Number.isFinite(yearsValRaw) || yearsValRaw <= 0) {
        setResultError("Enter a valid time horizon in years greater than 0.");
        return;
      }
      const yearsVal = Math.floor(yearsValRaw);
      if (yearsVal !== yearsValRaw) {
        // Accept, but keep it realistic and deterministic
      }

      if (!validatePercent(annualReturnPct, "expected annual return")) return;
      if (!validatePercent(taxNowPct, "current marginal income tax rate")) return;
      if (!validatePercent(taxWithdrawPct, "tax rate at withdrawal")) return;

      const dividendYieldPct = Number.isFinite(dividendYieldPctRaw) ? dividendYieldPctRaw : 2;
      const dividendTaxPct = Number.isFinite(dividendTaxPctRaw) ? dividendTaxPctRaw : taxNowPct;
      const capGainsPct = Number.isFinite(capGainsPctRaw) ? capGainsPctRaw : 15;
      const expensePct = Number.isFinite(expensePctRaw) ? expensePctRaw : 0;

      if (!validatePercent(dividendYieldPct, "dividend yield")) return;
      if (!validatePercent(dividendTaxPct, "dividend tax rate")) return;
      if (!validatePercent(capGainsPct, "capital gains tax rate")) return;
      if (!validatePercent(expensePct, "annual fee / expense ratio")) return;

      const taxNowRate = taxNowPct / 100;
      const taxWithdrawRate = taxWithdrawPct / 100;
      const totalReturnRate = (annualReturnPct - expensePct) / 100;

      if (totalReturnRate < 0) {
        setResultError("Annual fee / expense ratio is higher than the expected return. Use a lower fee or higher return.");
        return;
      }

      const divYieldRate = (dividendYieldPct / 100);
      const divTaxRate = (dividendTaxPct / 100);
      const capGainsRate = (capGainsPct / 100);

      // Split total return into dividends + price growth.
      // If dividend yield exceeds total return, treat price growth as 0 and keep dividends at total return.
      const effectiveDivYieldRate = Math.min(divYieldRate, totalReturnRate);
      const priceGrowthRate = Math.max(0, totalReturnRate - effectiveDivYieldRate);

      // Same gross dollars available for both paths.
      const afterTaxInitial = initialGrossVal * (1 - taxNowRate);
      const afterTaxAnnual = annualGrossVal * (1 - taxNowRate);

      // ------------------------------------------------------------
      // Tax-deferred simulation
      // ------------------------------------------------------------
      let tdBalance = initialGrossVal;
      for (let y = 1; y <= yearsVal; y++) {
        tdBalance = tdBalance * (1 + totalReturnRate);
        tdBalance = tdBalance + annualGrossVal;
      }
      const tdTaxAtEnd = tdBalance * taxWithdrawRate;
      const tdAfterTaxEnd = tdBalance - tdTaxAtEnd;

      // ------------------------------------------------------------
      // Taxable simulation (annual dividend tax, end capital gains tax)
      // ------------------------------------------------------------
      let txBalance = afterTaxInitial;
      let txBasis = afterTaxInitial;
      let totalDividendTaxes = 0;

      for (let y = 1; y <= yearsVal; y++) {
        const dividends = txBalance * effectiveDivYieldRate;
        const divTax = dividends * clampToRange(divTaxRate, 0, 1);
        const reinvestedDividends = dividends - divTax;

        totalDividendTaxes += divTax;

        const priceGrowth = txBalance * priceGrowthRate;

        txBalance = txBalance + priceGrowth + reinvestedDividends;

        // Reinvested dividends increase cost basis (they were taxed already)
        txBasis = txBasis + reinvestedDividends;

        // End-of-year contribution
        txBalance = txBalance + afterTaxAnnual;
        txBasis = txBasis + afterTaxAnnual;
      }

      const taxableGain = Math.max(0, txBalance - txBasis);
      const capGainsTax = taxableGain * clampToRange(capGainsRate, 0, 1);
      const txAfterTaxEnd = txBalance - capGainsTax;

      const difference = tdAfterTaxEnd - txAfterTaxEnd;

      const grossContribTotal = initialGrossVal + (annualGrossVal * yearsVal);
      const taxableContribTotal = afterTaxInitial + (afterTaxAnnual * yearsVal);
      const taxPaidUpfrontForTaxable = Math.max(0, grossContribTotal - taxableContribTotal);

      const winner = (difference > 0) ? "Tax-deferred account" : (difference < 0) ? "Taxable account" : "Tie (roughly equal)";

      const resultHtml = `
        <p><strong>Winner (based on your inputs):</strong> ${winner}</p>

        <p><strong>Tax-deferred after-tax ending value:</strong> ${formatNumberTwoDecimals(tdAfterTaxEnd)}</p>
        <p><strong>Taxable after-tax ending value:</strong> ${formatNumberTwoDecimals(txAfterTaxEnd)}</p>

        <p><strong>Difference (tax-deferred minus taxable):</strong> ${formatNumberTwoDecimals(difference)}</p>

        <hr>

        <p><strong>Tax-deferred tax at withdrawal (estimated):</strong> ${formatNumberTwoDecimals(tdTaxAtEnd)}</p>
        <p><strong>Taxable dividend taxes paid over time (estimated):</strong> ${formatNumberTwoDecimals(totalDividendTaxes)}</p>
        <p><strong>Taxable capital gains tax at the end (estimated):</strong> ${formatNumberTwoDecimals(capGainsTax)}</p>

        <hr>

        <p><strong>Assumptions used:</strong> Contributions are added at the end of each year. Dividend yield is ${dividendYieldPct}% (capped to total return), dividend tax rate is ${dividendTaxPct}%, capital gains tax rate is ${capGainsPct}%, and annual fee is ${expensePct}%.</p>
        <p><strong>Contribution framing:</strong> You entered gross contributions. The taxable path invests after paying your current tax rate (${taxNowPct}%), so taxable contributions are smaller than tax-deferred contributions.</p>
        <p><strong>Upfront tax paid in taxable path (on contributions):</strong> ${formatNumberTwoDecimals(taxPaidUpfrontForTaxable)}</p>
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
      const message = "Tax-Deferred vs Taxable Investment Comparison - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
