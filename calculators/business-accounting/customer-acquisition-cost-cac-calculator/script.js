document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const periodSelect = document.getElementById("periodSelect");
  const modeSelect = document.getElementById("modeSelect");

  const totalSpend = document.getElementById("totalSpend");

  const adSpend = document.getElementById("adSpend");
  const salesSalaries = document.getElementById("salesSalaries");
  const agencyFees = document.getElementById("agencyFees");
  const softwareTools = document.getElementById("softwareTools");
  const otherCosts = document.getElementById("otherCosts");

  const newCustomers = document.getElementById("newCustomers");

  const revenuePerMonth = document.getElementById("revenuePerMonth");
  const grossMarginPercent = document.getElementById("grossMarginPercent");
  const lifetimeMonths = document.getElementById("lifetimeMonths");

  // Optional: mode selector + grouped input blocks
  const modeBlockTotal = document.getElementById("modeBlockTotal");
  const modeBlockItemized = document.getElementById("modeBlockItemized");

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
  attachLiveFormatting(totalSpend);
  attachLiveFormatting(adSpend);
  attachLiveFormatting(salesSalaries);
  attachLiveFormatting(agencyFees);
  attachLiveFormatting(softwareTools);
  attachLiveFormatting(otherCosts);
  attachLiveFormatting(newCustomers);
  attachLiveFormatting(revenuePerMonth);
  attachLiveFormatting(grossMarginPercent);
  attachLiveFormatting(lifetimeMonths);

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
    if (modeBlockTotal) modeBlockTotal.classList.add("hidden");
    if (modeBlockItemized) modeBlockItemized.classList.add("hidden");

    if (mode === "itemized") {
      if (modeBlockItemized) modeBlockItemized.classList.remove("hidden");
    } else {
      if (modeBlockTotal) modeBlockTotal.classList.remove("hidden");
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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = modeSelect ? modeSelect.value : "total";
      const period = periodSelect ? periodSelect.value : "period";

      // Parse inputs using toNumber() (from /scripts/main.js)
      const customers = toNumber(newCustomers ? newCustomers.value : "");

      const totalSpendValue = toNumber(totalSpend ? totalSpend.value : "");

      const adSpendValue = toNumber(adSpend ? adSpend.value : "");
      const salesSalariesValue = toNumber(salesSalaries ? salesSalaries.value : "");
      const agencyFeesValue = toNumber(agencyFees ? agencyFees.value : "");
      const softwareToolsValue = toNumber(softwareTools ? softwareTools.value : "");
      const otherCostsValue = toNumber(otherCosts ? otherCosts.value : "");

      const revPerMonth = toNumber(revenuePerMonth ? revenuePerMonth.value : "");
      const marginPctRaw = toNumber(grossMarginPercent ? grossMarginPercent.value : "");
      const lifetime = toNumber(lifetimeMonths ? lifetimeMonths.value : "");

      // Input existence guard
      if (!newCustomers) return;

      // Validation
      if (!validatePositive(customers, "number of new customers")) return;

      let totalCost = 0;
      let costDetails = [];

      if (mode === "itemized") {
        if (!validateNonNegative(adSpendValue, "paid ads spend")) return;
        if (!validateNonNegative(salesSalariesValue, "sales and marketing salaries")) return;
        if (!validateNonNegative(agencyFeesValue, "agency / freelancer fees")) return;
        if (!validateNonNegative(softwareToolsValue, "software and tools")) return;
        if (!validateNonNegative(otherCostsValue, "other acquisition costs")) return;

        totalCost =
          adSpendValue +
          salesSalariesValue +
          agencyFeesValue +
          softwareToolsValue +
          otherCostsValue;

        costDetails = [
          { label: "Paid ads", value: adSpendValue },
          { label: "Salaries (allocated)", value: salesSalariesValue },
          { label: "Agency / freelancers", value: agencyFeesValue },
          { label: "Software / tools", value: softwareToolsValue },
          { label: "Other", value: otherCostsValue }
        ];
      } else {
        if (!totalSpend) return;
        if (!validateNonNegative(totalSpendValue, "total spend")) return;

        totalCost = totalSpendValue;
      }

      if (!Number.isFinite(totalCost) || totalCost <= 0) {
        setResultError("Enter a total acquisition spend greater than 0.");
        return;
      }

      // Calculation logic
      const cac = totalCost / customers;

      // Optional LTV logic (only if enough inputs provided)
      const hasLtvInputs =
        Number.isFinite(revPerMonth) &&
        revPerMonth > 0 &&
        Number.isFinite(marginPctRaw) &&
        marginPctRaw > 0 &&
        Number.isFinite(lifetime) &&
        lifetime > 0;

      let ltvGrossProfit = null;
      let ltvToCac = null;
      let paybackMonths = null;

      if (hasLtvInputs) {
        if (marginPctRaw > 100) {
          setResultError("Gross margin % should be between 0 and 100.");
          return;
        }

        const margin = marginPctRaw / 100;
        ltvGrossProfit = revPerMonth * margin * lifetime;

        if (cac > 0) {
          ltvToCac = ltvGrossProfit / cac;
        }

        const grossProfitPerMonth = revPerMonth * margin;
        if (grossProfitPerMonth > 0) {
          paybackMonths = cac / grossProfitPerMonth;
        }
      }

      const periodLabel =
        period === "month"
          ? "month"
          : period === "quarter"
          ? "quarter"
          : period === "year"
          ? "year"
          : "period";

      // Build output HTML
      let resultHtml = `
        <p><strong>CAC:</strong> ${formatNumberTwoDecimals(cac)} per new customer</p>
        <p><strong>Total acquisition spend:</strong> ${formatNumberTwoDecimals(totalCost)} per ${periodLabel}</p>
        <p><strong>New customers:</strong> ${formatInputWithCommas(String(Math.round(customers)))}</p>
      `;

      if (mode === "itemized") {
        const nonZeroLines = costDetails.filter((x) => Number.isFinite(x.value) && x.value > 0);
        if (nonZeroLines.length > 0) {
          const linesHtml = nonZeroLines
            .map((x) => `<li>${x.label}: ${formatNumberTwoDecimals(x.value)}</li>`)
            .join("");
          resultHtml += `
            <p><strong>Included cost lines:</strong></p>
            <ul>${linesHtml}</ul>
          `;
        } else {
          resultHtml += `
            <p><strong>Note:</strong> All itemised cost fields are 0. Add at least one cost line for a realistic CAC.</p>
          `;
        }
      }

      if (hasLtvInputs) {
        resultHtml += `
          <p><strong>Estimated gross-profit LTV:</strong> ${formatNumberTwoDecimals(ltvGrossProfit)}</p>
        `;

        if (Number.isFinite(ltvToCac) && ltvToCac > 0) {
          resultHtml += `<p><strong>LTV:CAC ratio:</strong> ${formatNumberTwoDecimals(ltvToCac)} : 1</p>`;
        }

        if (Number.isFinite(paybackMonths) && paybackMonths > 0) {
          resultHtml += `<p><strong>Estimated payback time:</strong> ${formatNumberTwoDecimals(paybackMonths)} months (gross-profit basis)</p>`;
        }

        resultHtml += `
          <p><strong>LTV inputs used:</strong> revenue/customer/month = ${formatNumberTwoDecimals(revPerMonth)}, gross margin = ${formatNumberTwoDecimals(marginPctRaw)}%, lifetime = ${formatNumberTwoDecimals(lifetime)} months</p>
        `;
      } else {
        resultHtml += `
          <p><strong>Optional insight:</strong> Add revenue per customer per month, gross margin %, and customer lifetime to estimate LTV and LTV:CAC.</p>
        `;
      }

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Customer Acquisition Cost (CAC) Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
