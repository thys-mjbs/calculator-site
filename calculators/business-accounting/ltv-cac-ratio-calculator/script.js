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

  const ltvValue = document.getElementById("ltvValue");
  const cacValue = document.getElementById("cacValue");

  const arpaMonthly = document.getElementById("arpaMonthly");
  const grossMarginPercent = document.getElementById("grossMarginPercent");
  const lifespanMonths = document.getElementById("lifespanMonths");
  const monthlyChurnPercent = document.getElementById("monthlyChurnPercent");

  const acquisitionSpend = document.getElementById("acquisitionSpend");
  const newCustomers = document.getElementById("newCustomers");

  const modeBlockDirect = document.getElementById("modeBlockDirect");
  const modeBlockEstimate = document.getElementById("modeBlockEstimate");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Attach formatting where it makes sense
  attachLiveFormatting(ltvValue);
  attachLiveFormatting(cacValue);
  attachLiveFormatting(arpaMonthly);
  attachLiveFormatting(grossMarginPercent);
  attachLiveFormatting(lifespanMonths);
  attachLiveFormatting(monthlyChurnPercent);
  attachLiveFormatting(acquisitionSpend);
  attachLiveFormatting(newCustomers);

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
    if (modeBlockDirect) modeBlockDirect.classList.add("hidden");
    if (modeBlockEstimate) modeBlockEstimate.classList.add("hidden");

    if (mode === "estimate") {
      if (modeBlockEstimate) modeBlockEstimate.classList.remove("hidden");
    } else {
      if (modeBlockDirect) modeBlockDirect.classList.remove("hidden");
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

  function clampPercent(p) {
    if (!Number.isFinite(p)) return NaN;
    if (p < 0) return NaN;
    if (p > 100) return NaN;
    return p;
  }

  function interpretRatio(ratio) {
    if (!Number.isFinite(ratio) || ratio <= 0) return "Not interpretable";

    if (ratio < 1) return "High risk: you are likely losing money on acquisition.";
    if (ratio < 3) return "Weak to borderline: you may be profitable, but scaling can be fragile.";
    if (ratio < 5) return "Healthy: acquisition spend is usually justified by customer value.";
    return "Very strong: value far exceeds acquisition cost (confirm assumptions and consider growth capacity).";
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = modeSelect ? modeSelect.value : "direct";

      // Parse inputs using toNumber() (from /scripts/main.js)
      let ltv = NaN;
      let cac = NaN;

      let arpa = NaN;
      let gmPct = NaN;
      let lifeMonths = NaN;
      let churnPct = NaN;

      let spend = NaN;
      let customers = NaN;

      if (mode === "estimate") {
        arpa = toNumber(arpaMonthly ? arpaMonthly.value : "");
        gmPct = toNumber(grossMarginPercent ? grossMarginPercent.value : "");
        lifeMonths = toNumber(lifespanMonths ? lifespanMonths.value : "");
        churnPct = toNumber(monthlyChurnPercent ? monthlyChurnPercent.value : "");

        spend = toNumber(acquisitionSpend ? acquisitionSpend.value : "");
        customers = toNumber(newCustomers ? newCustomers.value : "");
      } else {
        ltv = toNumber(ltvValue ? ltvValue.value : "");
        cac = toNumber(cacValue ? cacValue.value : "");
      }

      // Validation
      if (mode === "estimate") {
        if (!validatePositive(arpa, "average revenue per customer per month (ARPA)")) return;

        // Defaults for optional fields
        if (!Number.isFinite(gmPct) || gmPct === 0) gmPct = 70;
        gmPct = clampPercent(gmPct);
        if (!Number.isFinite(gmPct)) {
          setResultError("Enter a valid gross margin (%) between 0 and 100, or leave it blank.");
          return;
        }

        const gm = gmPct / 100;

        // Lifespan logic
        let usedLifespanMonths = NaN;
        let lifespanSource = "";

        if (Number.isFinite(lifeMonths) && lifeMonths > 0) {
          usedLifespanMonths = lifeMonths;
          lifespanSource = "lifespan input";
        } else if (Number.isFinite(churnPct) && churnPct > 0) {
          churnPct = clampPercent(churnPct);
          if (!Number.isFinite(churnPct) || churnPct === 0) {
            setResultError("Enter a valid monthly churn (%) between 0 and 100, or leave it blank.");
            return;
          }
          const churn = churnPct / 100;
          usedLifespanMonths = 1 / churn;
          lifespanSource = "churn estimate";
        } else {
          usedLifespanMonths = 24;
          lifespanSource = "default assumption";
        }

        if (!Number.isFinite(usedLifespanMonths) || usedLifespanMonths <= 0) {
          setResultError("Enter a valid lifespan or churn to estimate customer lifetime.");
          return;
        }

        if (!validatePositive(spend, "acquisition spend")) return;
        if (!validatePositive(customers, "new customers acquired")) return;

        // Calculation logic
        cac = spend / customers;
        ltv = arpa * gm * usedLifespanMonths;

        if (!Number.isFinite(cac) || cac <= 0) {
          setResultError("CAC could not be calculated. Check spend and new customer count.");
          return;
        }

        if (!Number.isFinite(ltv) || ltv <= 0) {
          setResultError("LTV could not be calculated. Check your ARPA, margin, and lifespan assumptions.");
          return;
        }

        const ratio = ltv / cac;

        // Secondary insights
        const targetRatio = 3;
        const maxCacAtTarget = ltv / targetRatio;

        const monthlyGrossProfitPerCustomer = arpa * gm;
        const paybackMonths =
          Number.isFinite(monthlyGrossProfitPerCustomer) && monthlyGrossProfitPerCustomer > 0
            ? cac / monthlyGrossProfitPerCustomer
            : NaN;

        const ratioText = formatNumberTwoDecimals(ratio);
        const ltvText = formatNumberTwoDecimals(ltv);
        const cacText = formatNumberTwoDecimals(cac);
        const maxCacText = formatNumberTwoDecimals(maxCacAtTarget);

        const paybackText = Number.isFinite(paybackMonths) ? formatNumberTwoDecimals(paybackMonths) : "N/A";

        const interpretation = interpretRatio(ratio);

        const resultHtml =
          `<p><strong>LTV:CAC ratio:</strong> ${ratioText}:1</p>` +
          `<p><strong>Interpretation:</strong> ${interpretation}</p>` +
          `<p><strong>Values used:</strong></p>` +
          `<ul>` +
          `<li>Estimated LTV: ${ltvText}</li>` +
          `<li>Calculated CAC: ${cacText}</li>` +
          `<li>Lifespan basis: ${lifespanSource}</li>` +
          `</ul>` +
          `<p><strong>Secondary insights:</strong></p>` +
          `<ul>` +
          `<li>Estimated payback period: ${paybackText} months (CAC ÷ monthly gross profit)</li>` +
          `<li>Max CAC for a ${targetRatio}:1 target: ${maxCacText}</li>` +
          `</ul>`;

        setResultSuccess(resultHtml);
        return;
      }

      // Direct mode validation
      if (!validatePositive(ltv, "LTV")) return;
      if (!validatePositive(cac, "CAC")) return;

      const ratio = ltv / cac;

      if (!Number.isFinite(ratio) || ratio <= 0) {
        setResultError("Could not calculate the ratio. Check your inputs.");
        return;
      }

      const targetRatio = 3;
      const maxCacAtTarget = ltv / targetRatio;

      const ratioText = formatNumberTwoDecimals(ratio);
      const ltvText = formatNumberTwoDecimals(ltv);
      const cacText = formatNumberTwoDecimals(cac);
      const maxCacText = formatNumberTwoDecimals(maxCacAtTarget);

      const interpretation = interpretRatio(ratio);

      const resultHtml =
        `<p><strong>LTV:CAC ratio:</strong> ${ratioText}:1</p>` +
        `<p><strong>Interpretation:</strong> ${interpretation}</p>` +
        `<p><strong>Values used:</strong></p>` +
        `<ul>` +
        `<li>LTV: ${ltvText}</li>` +
        `<li>CAC: ${cacText}</li>` +
        `</ul>` +
        `<p><strong>Secondary insight:</strong></p>` +
        `<ul>` +
        `<li>Max CAC for a ${targetRatio}:1 target: ${maxCacText}</li>` +
        `</ul>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "LTV:CAC Ratio Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
