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
  const modeQuick = document.getElementById("modeQuick");
  const modeDetailed = document.getElementById("modeDetailed");

  // Quick mode
  const totalA = document.getElementById("totalA");
  const totalB = document.getElementById("totalB");
  const incomeA = document.getElementById("incomeA");
  const incomeB = document.getElementById("incomeB");

  // Detailed mode
  const rentA = document.getElementById("rentA");
  const rentB = document.getElementById("rentB");
  const utilitiesA = document.getElementById("utilitiesA");
  const utilitiesB = document.getElementById("utilitiesB");
  const groceriesA = document.getElementById("groceriesA");
  const groceriesB = document.getElementById("groceriesB");
  const transportA = document.getElementById("transportA");
  const transportB = document.getElementById("transportB");
  const healthA = document.getElementById("healthA");
  const healthB = document.getElementById("healthB");
  const childcareA = document.getElementById("childcareA");
  const childcareB = document.getElementById("childcareB");
  const otherA = document.getElementById("otherA");
  const otherB = document.getElementById("otherB");
  const incomeA2 = document.getElementById("incomeA2");
  const incomeB2 = document.getElementById("incomeB2");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  [
    totalA, totalB, incomeA, incomeB,
    rentA, rentB, utilitiesA, utilitiesB, groceriesA, groceriesB,
    transportA, transportB, healthA, healthB, childcareA, childcareB,
    otherA, otherB, incomeA2, incomeB2
  ].forEach(attachLiveFormatting);

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
    if (modeQuick) modeQuick.classList.add("hidden");
    if (modeDetailed) modeDetailed.classList.add("hidden");

    if (mode === "detailed") {
      if (modeDetailed) modeDetailed.classList.remove("hidden");
    } else {
      if (modeQuick) modeQuick.classList.remove("hidden");
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

  function ratioPct(cost, income) {
    if (!Number.isFinite(income) || income <= 0) return null;
    return (cost / income) * 100;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = modeSelect ? modeSelect.value : "quick";

      if (mode === "detailed") {
        const valsA = {
          Housing: toNumber(rentA ? rentA.value : ""),
          Utilities: toNumber(utilitiesA ? utilitiesA.value : ""),
          Groceries: toNumber(groceriesA ? groceriesA.value : ""),
          Transport: toNumber(transportA ? transportA.value : ""),
          Healthcare: toNumber(healthA ? healthA.value : ""),
          Childcare: toNumber(childcareA ? childcareA.value : ""),
          Other: toNumber(otherA ? otherA.value : "")
        };

        const valsB = {
          Housing: toNumber(rentB ? rentB.value : ""),
          Utilities: toNumber(utilitiesB ? utilitiesB.value : ""),
          Groceries: toNumber(groceriesB ? groceriesB.value : ""),
          Transport: toNumber(transportB ? transportB.value : ""),
          Healthcare: toNumber(healthB ? healthB.value : ""),
          Childcare: toNumber(childcareB ? childcareB.value : ""),
          Other: toNumber(otherB ? otherB.value : "")
        };

        // Validate: all numeric and non-negative
        for (const [k, v] of Object.entries(valsA)) {
          if (!validateNonNegative(v, "Location A " + k + " cost")) return;
        }
        for (const [k, v] of Object.entries(valsB)) {
          if (!validateNonNegative(v, "Location B " + k + " cost")) return;
        }

        const totalCostA = Object.values(valsA).reduce((a, b) => a + b, 0);
        const totalCostB = Object.values(valsB).reduce((a, b) => a + b, 0);

        if (totalCostA <= 0) {
          setResultError("Enter at least one monthly cost for Location A in Detailed mode.");
          return;
        }
        if (totalCostB <= 0) {
          setResultError("Enter at least one monthly cost for Location B in Detailed mode.");
          return;
        }

        const diffMonthly = totalCostB - totalCostA;
        const diffAnnual = diffMonthly * 12;
        const pctDiff = (diffMonthly / totalCostA) * 100;
        const indexA = 100;
        const indexB = (totalCostB / totalCostA) * 100;

        const incA = toNumber(incomeA2 ? incomeA2.value : "");
        const incB = toNumber(incomeB2 ? incomeB2.value : "");
        if (!validateNonNegative(incA, "Location A income")) return;
        if (!validateNonNegative(incB, "Location B income")) return;

        const affA = ratioPct(totalCostA, incA);
        const affB = ratioPct(totalCostB, incB);

        // Build category table rows (only show non-zero on either side to keep it readable)
        const keys = Object.keys(valsA);
        const rows = keys
          .filter((k) => (valsA[k] || 0) !== 0 || (valsB[k] || 0) !== 0)
          .map((k) => {
            const a = valsA[k] || 0;
            const b = valsB[k] || 0;
            const d = b - a;
            const dTxt = (d >= 0 ? "+" : "−") + formatNumberTwoDecimals(Math.abs(d));
            return `<tr>
              <td>${k}</td>
              <td>${formatNumberTwoDecimals(a)}</td>
              <td>${formatNumberTwoDecimals(b)}</td>
              <td>${dTxt}</td>
            </tr>`;
          })
          .join("");

        const direction = diffMonthly > 0 ? "more expensive" : diffMonthly < 0 ? "cheaper" : "the same cost";
        const diffAbsMonthly = formatNumberTwoDecimals(Math.abs(diffMonthly));
        const diffAbsAnnual = formatNumberTwoDecimals(Math.abs(diffAnnual));
        const pctTxt = (diffMonthly >= 0 ? "+" : "−") + formatNumberTwoDecimals(Math.abs(pctDiff));

        let affordabilityHtml = "";
        if (affA !== null || affB !== null) {
          const aLine = affA !== null ? `${formatNumberTwoDecimals(affA)}% of income` : "Income not provided";
          const bLine = affB !== null ? `${formatNumberTwoDecimals(affB)}% of income` : "Income not provided";
          affordabilityHtml = `<p><strong>Affordability (optional):</strong> A uses ${aLine}. B uses ${bLine}.</p>`;
        }

        const resultHtml = `
          <p><strong>Monthly totals:</strong> Location A = ${formatNumberTwoDecimals(totalCostA)} | Location B = ${formatNumberTwoDecimals(totalCostB)}</p>
          <p><strong>Difference:</strong> Location B is ${direction} by ${diffAbsMonthly} per month (${diffAbsAnnual} per year).</p>
          <p><strong>Relative index:</strong> A = ${formatNumberTwoDecimals(indexA)} | B = ${formatNumberTwoDecimals(indexB)} (B vs A: ${pctTxt}%).</p>
          ${affordabilityHtml}
          <table aria-label="Cost breakdown comparison table">
            <thead>
              <tr>
                <th>Category</th>
                <th>A (monthly)</th>
                <th>B (monthly)</th>
                <th>B − A</th>
              </tr>
            </thead>
            <tbody>
              ${rows || `<tr><td colspan="4">No category values entered.</td></tr>`}
            </tbody>
          </table>
          <p><strong>Tip:</strong> If you are missing a category, leave it blank for now, then come back and refine the inputs when you have real quotes or bills.</p>
        `;

        setResultSuccess(resultHtml);
        return;
      }

      // Quick mode
      const aTotal = toNumber(totalA ? totalA.value : "");
      const bTotal = toNumber(totalB ? totalB.value : "");
      if (!validatePositive(aTotal, "Location A total monthly cost")) return;
      if (!validatePositive(bTotal, "Location B total monthly cost")) return;

      const diffMonthly = bTotal - aTotal;
      const diffAnnual = diffMonthly * 12;
      const pctDiff = (diffMonthly / aTotal) * 100;
      const indexA = 100;
      const indexB = (bTotal / aTotal) * 100;

      const incA = toNumber(incomeA ? incomeA.value : "");
      const incB = toNumber(incomeB ? incomeB.value : "");
      if (!validateNonNegative(incA, "Location A income")) return;
      if (!validateNonNegative(incB, "Location B income")) return;

      const affA = ratioPct(aTotal, incA);
      const affB = ratioPct(bTotal, incB);

      const direction = diffMonthly > 0 ? "more expensive" : diffMonthly < 0 ? "cheaper" : "the same cost";
      const diffAbsMonthly = formatNumberTwoDecimals(Math.abs(diffMonthly));
      const diffAbsAnnual = formatNumberTwoDecimals(Math.abs(diffAnnual));
      const pctTxt = (diffMonthly >= 0 ? "+" : "−") + formatNumberTwoDecimals(Math.abs(pctDiff));

      let affordabilityHtml = "";
      if (affA !== null || affB !== null) {
        const aLine = affA !== null ? `${formatNumberTwoDecimals(affA)}% of income` : "Income not provided";
        const bLine = affB !== null ? `${formatNumberTwoDecimals(affB)}% of income` : "Income not provided";
        affordabilityHtml = `<p><strong>Affordability (optional):</strong> A uses ${aLine}. B uses ${bLine}.</p>`;
      }

      const resultHtml = `
        <p><strong>Monthly totals:</strong> Location A = ${formatNumberTwoDecimals(aTotal)} | Location B = ${formatNumberTwoDecimals(bTotal)}</p>
        <p><strong>Difference:</strong> Location B is ${direction} by ${diffAbsMonthly} per month (${diffAbsAnnual} per year).</p>
        <p><strong>Relative index:</strong> A = ${formatNumberTwoDecimals(indexA)} | B = ${formatNumberTwoDecimals(indexB)} (B vs A: ${pctTxt}%).</p>
        ${affordabilityHtml}
        <p><strong>Next step:</strong> If you want to see what is causing the difference, switch to Detailed categories and enter a few key items like housing, groceries, and transport.</p>
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
      const message = "Cost-of-Living Comparison Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
