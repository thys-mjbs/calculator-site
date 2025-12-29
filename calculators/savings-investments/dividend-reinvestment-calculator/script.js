document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const startingInvestmentInput = document.getElementById("startingInvestment");
  const sharePriceInput = document.getElementById("sharePrice");
  const dividendYieldInput = document.getElementById("dividendYield");
  const yearsInput = document.getElementById("years");

  const toggleAdvancedButton = document.getElementById("toggleAdvanced");
  const advancedSection = document.getElementById("advancedSection");

  const monthlyContributionInput = document.getElementById("monthlyContribution");
  const priceGrowthInput = document.getElementById("priceGrowth");
  const dividendGrowthInput = document.getElementById("dividendGrowth");
  const dividendTaxInput = document.getElementById("dividendTax");
  const reinvestFeeInput = document.getElementById("reinvestFee");
  const payoutFrequencySelect = document.getElementById("payoutFrequency");

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
  attachLiveFormatting(startingInvestmentInput);
  attachLiveFormatting(sharePriceInput);
  attachLiveFormatting(dividendYieldInput);
  attachLiveFormatting(yearsInput);
  attachLiveFormatting(monthlyContributionInput);
  attachLiveFormatting(priceGrowthInput);
  attachLiveFormatting(dividendGrowthInput);
  attachLiveFormatting(dividendTaxInput);
  attachLiveFormatting(reinvestFeeInput);

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

  function clampPercent(value) {
    if (!Number.isFinite(value)) return 0;
    if (value < 0) return 0;
    if (value > 100) return 100;
    return value;
  }

  function getPayoutMonths(frequencyValue) {
    if (frequencyValue === "monthly") return 1;
    if (frequencyValue === "quarterly") return 3;
    if (frequencyValue === "semiannual") return 6;
    return 12; // annual
  }

  function safeMonthlyRateFromAnnualPercent(annualPercent) {
    const r = annualPercent / 100;
    if (!Number.isFinite(r)) return 0;
    if (r <= -0.999999) return -1;
    return Math.pow(1 + r, 1 / 12) - 1;
  }

  // ------------------------------------------------------------
  // ADVANCED TOGGLE (UI ONLY)
  // ------------------------------------------------------------
  if (toggleAdvancedButton && advancedSection) {
    toggleAdvancedButton.addEventListener("click", function () {
      const isHidden = advancedSection.classList.contains("hidden");
      if (isHidden) {
        advancedSection.classList.remove("hidden");
        advancedSection.setAttribute("aria-hidden", "false");
        toggleAdvancedButton.setAttribute("aria-expanded", "true");
        toggleAdvancedButton.textContent = "Hide advanced options";
      } else {
        advancedSection.classList.add("hidden");
        advancedSection.setAttribute("aria-hidden", "true");
        toggleAdvancedButton.setAttribute("aria-expanded", "false");
        toggleAdvancedButton.textContent = "Show advanced options";
      }
      clearResult();
    });
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse required inputs
      const startingInvestment = toNumber(startingInvestmentInput ? startingInvestmentInput.value : "");
      const sharePriceStart = toNumber(sharePriceInput ? sharePriceInput.value : "");
      const dividendYieldAnnualPct = toNumber(dividendYieldInput ? dividendYieldInput.value : "");
      const years = toNumber(yearsInput ? yearsInput.value : "");

      // Validation (required)
      if (!validatePositive(startingInvestment, "starting investment amount")) return;
      if (!validatePositive(sharePriceStart, "current share price")) return;
      if (!validatePositive(dividendYieldAnnualPct, "annual dividend yield")) return;
      if (!validatePositive(years, "time horizon (years)")) return;

      // Parse advanced inputs (optional, defaults)
      const monthlyContribution = toNumber(monthlyContributionInput ? monthlyContributionInput.value : "");
      const priceGrowthAnnualPct = toNumber(priceGrowthInput ? priceGrowthInput.value : "");
      const dividendGrowthAnnualPct = toNumber(dividendGrowthInput ? dividendGrowthInput.value : "");
      const dividendTaxPctRaw = toNumber(dividendTaxInput ? dividendTaxInput.value : "");
      const reinvestFee = toNumber(reinvestFeeInput ? reinvestFeeInput.value : "");
      const payoutFreq = payoutFrequencySelect ? payoutFrequencySelect.value : "quarterly";

      const monthlyContributionSafe = Number.isFinite(monthlyContribution) && monthlyContribution > 0 ? monthlyContribution : 0;

      const priceGrowthMonthly = safeMonthlyRateFromAnnualPercent(Number.isFinite(priceGrowthAnnualPct) ? priceGrowthAnnualPct : 0);
      const dividendGrowthMonthly = safeMonthlyRateFromAnnualPercent(Number.isFinite(dividendGrowthAnnualPct) ? dividendGrowthAnnualPct : 0);

      const dividendTaxPct = clampPercent(Number.isFinite(dividendTaxPctRaw) ? dividendTaxPctRaw : 0);
      const reinvestFeeSafe = Number.isFinite(reinvestFee) && reinvestFee > 0 ? reinvestFee : 0;

      // Guard unrealistic negative rates
      if (priceGrowthMonthly <= -1) {
        setResultError("Share price growth is too low to model. Enter a higher (less negative) value.");
        return;
      }
      if (dividendGrowthMonthly <= -1) {
        setResultError("Dividend growth is too low to model. Enter a higher (less negative) value.");
        return;
      }

      const months = Math.round(years * 12);
      if (!Number.isFinite(months) || months < 1) {
        setResultError("Enter a time horizon that is at least 0.1 years.");
        return;
      }

      const payoutMonths = getPayoutMonths(payoutFreq);

      // Core model variables
      let sharePrice = sharePriceStart;

      // Starting shares from initial investment
      let shares = startingInvestment / sharePriceStart;

      // Use yield to estimate an initial annual dividend-per-share (DPS)
      // annualDPS starts as: price * yield
      let annualDividendPerShare = sharePriceStart * (dividendYieldAnnualPct / 100);

      // Tracking totals
      let totalContributions = startingInvestment;
      let totalDividendsGross = 0;
      let totalDividendsNet = 0;
      let totalFees = 0;

      // Month-by-month simulation
      for (let m = 1; m <= months; m++) {
        // 1) Add contribution at start of month (buys shares at current price)
        if (monthlyContributionSafe > 0) {
          const newShares = monthlyContributionSafe / sharePrice;
          shares += newShares;
          totalContributions += monthlyContributionSafe;
        }

        // 2) Price growth for the month
        sharePrice = sharePrice * (1 + priceGrowthMonthly);

        // 3) Dividend-per-share growth for the month
        annualDividendPerShare = annualDividendPerShare * (1 + dividendGrowthMonthly);

        // 4) Dividend payout if this is a payout month
        const isPayoutMonth = (m % payoutMonths === 0);
        if (isPayoutMonth) {
          const monthlyDps = annualDividendPerShare / 12;
          const grossDividend = shares * monthlyDps * payoutMonths;

          totalDividendsGross += grossDividend;

          const taxAmount = grossDividend * (dividendTaxPct / 100);
          let netDividend = grossDividend - taxAmount;

          // Apply reinvestment fee per dividend payment (flat)
          if (reinvestFeeSafe > 0) {
            const feeApplied = Math.min(reinvestFeeSafe, Math.max(0, netDividend));
            netDividend = netDividend - feeApplied;
            totalFees += feeApplied;
          }

          if (netDividend > 0) {
            const dividendShares = netDividend / sharePrice;
            shares += dividendShares;
          }

          totalDividendsNet += Math.max(0, netDividend);
        }
      }

      // Ending values
      const endingValue = shares * sharePrice;

      // Baseline comparison: same contributions, no dividends reinvested (dividends ignored)
      // This isolates "dividend reinvestment effect" as a practical secondary insight.
      // We model only contributions + price growth.
      let sharePriceBase = sharePriceStart;
      let sharesBase = startingInvestment / sharePriceStart;

      for (let m = 1; m <= months; m++) {
        if (monthlyContributionSafe > 0) {
          sharesBase += monthlyContributionSafe / sharePriceBase;
        }
        sharePriceBase = sharePriceBase * (1 + priceGrowthMonthly);
      }

      const endingValueBase = sharesBase * sharePriceBase;
      const liftFromReinvest = endingValue - endingValueBase;

      // Approx growth rate (CAGR) based on total contributions timing is complex.
      // Provide a simple end-to-start CAGR estimate using starting investment only.
      const cagrApprox = Math.pow(endingValue / startingInvestment, 1 / years) - 1;

      function fmtMoney(n) {
        return formatNumberTwoDecimals(n);
      }

      function fmtPct(n) {
        return formatNumberTwoDecimals(n);
      }

      const resultHtml =
        `<p><strong>Estimated ending value:</strong> ${fmtMoney(endingValue)}</p>` +
        `<p><strong>Ending shares (approx):</strong> ${fmtMoney(shares)}</p>` +
        `<p><strong>Ending share price (modeled):</strong> ${fmtMoney(sharePrice)}</p>` +
        `<hr>` +
        `<p><strong>Total contributions:</strong> ${fmtMoney(totalContributions)}</p>` +
        `<p><strong>Total dividends generated (gross):</strong> ${fmtMoney(totalDividendsGross)}</p>` +
        `<p><strong>Total reinvested dividends (after tax/fees):</strong> ${fmtMoney(totalDividendsNet)}</p>` +
        `<p><strong>Total reinvestment fees modeled:</strong> ${fmtMoney(totalFees)}</p>` +
        `<hr>` +
        `<p><strong>Estimated lift from reinvesting dividends:</strong> ${fmtMoney(liftFromReinvest)} (vs contributions + price growth only)</p>` +
        `<p><strong>Approx annual growth rate (simple):</strong> ${fmtPct(cagrApprox * 100)}%</p>` +
        `<p><em>Note:</em> This is an estimate based on steady rates and scheduled payouts. Real markets and dividends vary.</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Dividend Reinvestment Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
