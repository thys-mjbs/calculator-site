document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const monthlyRevenueInput = document.getElementById("monthlyRevenue");
  const grossMarginPercentInput = document.getElementById("grossMarginPercent");
  const monthlyChurnPercentInput = document.getElementById("monthlyChurnPercent");
  const lifespanMonthsInput = document.getElementById("lifespanMonths");
  const annualDiscountPercentInput = document.getElementById("annualDiscountPercent");
  const cacInput = document.getElementById("cac");

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
  attachLiveFormatting(monthlyRevenueInput);
  attachLiveFormatting(grossMarginPercentInput);
  attachLiveFormatting(monthlyChurnPercentInput);
  attachLiveFormatting(lifespanMonthsInput);
  attachLiveFormatting(annualDiscountPercentInput);
  attachLiveFormatting(cacInput);

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

  function validatePercent(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      setResultError("Enter a valid " + fieldLabel + " between 0 and 100.");
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
      const monthlyRevenue = toNumber(monthlyRevenueInput ? monthlyRevenueInput.value : "");
      const grossMarginPercentRaw = toNumber(grossMarginPercentInput ? grossMarginPercentInput.value : "");
      const monthlyChurnPercentRaw = toNumber(monthlyChurnPercentInput ? monthlyChurnPercentInput.value : "");
      const lifespanMonthsRaw = toNumber(lifespanMonthsInput ? lifespanMonthsInput.value : "");
      const annualDiscountPercentRaw = toNumber(annualDiscountPercentInput ? annualDiscountPercentInput.value : "");
      const cacRaw = toNumber(cacInput ? cacInput.value : "");

      // Input existence guard
      if (!monthlyRevenueInput || !resultDiv) return;

      // Required validation
      if (!validatePositive(monthlyRevenue, "average monthly revenue per customer")) return;

      // Optional inputs with defaults
      const grossMarginPercent = Number.isFinite(grossMarginPercentRaw) && grossMarginPercentRaw > 0
        ? grossMarginPercentRaw
        : 60;

      if (!validatePercent(grossMarginPercent, "gross margin percent")) return;

      const hasChurn = Number.isFinite(monthlyChurnPercentRaw) && monthlyChurnPercentRaw > 0;
      const churnPercent = hasChurn ? monthlyChurnPercentRaw : 0;

      if (hasChurn && !validatePercent(churnPercent, "monthly churn percent")) return;

      const hasLifespan = Number.isFinite(lifespanMonthsRaw) && lifespanMonthsRaw > 0;
      const hasDiscount = Number.isFinite(annualDiscountPercentRaw) && annualDiscountPercentRaw > 0;

      if (hasDiscount && !validatePercent(annualDiscountPercentRaw, "annual discount rate percent")) return;

      const hasCac = Number.isFinite(cacRaw) && cacRaw > 0;
      if (Number.isFinite(cacRaw) && cacRaw < 0) {
        setResultError("Enter a valid CAC (0 or higher).");
        return;
      }

      // Determine lifespan months
      let lifespanMonthsUsed = 24;
      let lifespanSource = "default 24 months";

      if (hasChurn) {
        const churnRate = churnPercent / 100;
        lifespanMonthsUsed = 1 / churnRate;
        lifespanSource = "estimated from churn";
      } else if (hasLifespan) {
        lifespanMonthsUsed = lifespanMonthsRaw;
        lifespanSource = "your lifespan input";
      }

      // Cap lifespan to keep outputs reasonable
      if (!Number.isFinite(lifespanMonthsUsed) || lifespanMonthsUsed <= 0) {
        setResultError("Enter a realistic churn or lifespan so the customer lifetime can be estimated.");
        return;
      }
      if (lifespanMonthsUsed > 600) lifespanMonthsUsed = 600;

      const lifespanMonthsRounded = Math.max(1, Math.round(lifespanMonthsUsed));

      // Calculation logic
      const grossMarginRate = grossMarginPercent / 100;
      const grossProfitPerMonth = monthlyRevenue * grossMarginRate;

      const simpleLtv = grossProfitPerMonth * lifespanMonthsUsed;

      let discountedLtv = simpleLtv;
      let monthlyDiscountRate = 0;

      if (hasDiscount) {
        const annualRate = annualDiscountPercentRaw / 100;
        monthlyDiscountRate = Math.pow(1 + annualRate, 1 / 12) - 1;

        let pv = 0;
        for (let t = 1; t <= lifespanMonthsRounded; t++) {
          pv += grossProfitPerMonth / Math.pow(1 + monthlyDiscountRate, t);
        }
        discountedLtv = pv;
      }

      // Secondary insights
      const paybackMonths = hasCac && grossProfitPerMonth > 0 ? (cacRaw / grossProfitPerMonth) : null;
      const ltvToCac = hasCac && cacRaw > 0 ? (discountedLtv / cacRaw) : null;
      const netDiscountedAfterCac = hasCac ? (discountedLtv - cacRaw) : null;

      const ltvPerDollarRevenue = grossMarginRate; // gross profit per $1 revenue

      // Build output HTML
      const resultHtmlParts = [];

      resultHtmlParts.push(
        `<p><strong>Simple LTV (undiscounted):</strong> ${formatNumberTwoDecimals(simpleLtv)}</p>`
      );

      if (hasDiscount) {
        resultHtmlParts.push(
          `<p><strong>Discounted LTV (present value):</strong> ${formatNumberTwoDecimals(discountedLtv)}</p>`
        );
      } else {
        resultHtmlParts.push(
          `<p><strong>Discounted LTV:</strong> ${formatNumberTwoDecimals(discountedLtv)} (discount rate not applied)</p>`
        );
      }

      resultHtmlParts.push(
        `<p><strong>Gross profit per month:</strong> ${formatNumberTwoDecimals(grossProfitPerMonth)}</p>`
      );

      resultHtmlParts.push(
        `<p><strong>Customer lifetime used:</strong> ${formatNumberTwoDecimals(lifespanMonthsUsed)} months (${lifespanSource})</p>`
      );

      resultHtmlParts.push(
        `<p><strong>Gross margin used:</strong> ${formatNumberTwoDecimals(grossMarginPercent)}%</p>`
      );

      if (hasChurn) {
        resultHtmlParts.push(
          `<p><strong>Churn used:</strong> ${formatNumberTwoDecimals(churnPercent)}% per month</p>`
        );
      }

      if (hasDiscount) {
        resultHtmlParts.push(
          `<p><strong>Discount rate used:</strong> ${formatNumberTwoDecimals(annualDiscountPercentRaw)}% per year (${formatNumberTwoDecimals(monthlyDiscountRate * 100)}% per month)</p>`
        );
      }

      resultHtmlParts.push(
        `<p><strong>Quick insight:</strong> Every 1.00 of monthly revenue contributes about ${formatNumberTwoDecimals(ltvPerDollarRevenue)} of gross profit before churn and discounting.</p>`
      );

      if (hasCac) {
        resultHtmlParts.push(
          `<p><strong>CAC:</strong> ${formatNumberTwoDecimals(cacRaw)}</p>`
        );

        if (ltvToCac !== null && Number.isFinite(ltvToCac)) {
          resultHtmlParts.push(
            `<p><strong>LTV:CAC (using discounted LTV):</strong> ${formatNumberTwoDecimals(ltvToCac)}x</p>`
          );
        }

        if (netDiscountedAfterCac !== null && Number.isFinite(netDiscountedAfterCac)) {
          resultHtmlParts.push(
            `<p><strong>Net value after CAC (discounted):</strong> ${formatNumberTwoDecimals(netDiscountedAfterCac)}</p>`
          );
        }

        if (paybackMonths !== null && Number.isFinite(paybackMonths)) {
          resultHtmlParts.push(
            `<p><strong>Estimated payback time:</strong> ${formatNumberTwoDecimals(paybackMonths)} months (CAC divided by gross profit per month)</p>`
          );
        }
      } else {
        resultHtmlParts.push(
          `<p><strong>Tip:</strong> Add CAC to see LTV:CAC and payback time.</p>`
        );
      }

      const resultHtml = resultHtmlParts.join("");

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
      const message = "Customer Lifetime Value (LTV) Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
