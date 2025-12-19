document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const grossMonthlyIncome = document.getElementById("grossMonthlyIncome");
  const totalMonthlyDebt = document.getElementById("totalMonthlyDebt");
  const monthlyHousingPayment = document.getElementById("monthlyHousingPayment");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(grossMonthlyIncome);
  attachLiveFormatting(totalMonthlyDebt);
  attachLiveFormatting(monthlyHousingPayment);

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

  function classifyDti(dtiPct) {
    if (!Number.isFinite(dtiPct)) return { label: "Unknown", note: "" };
    if (dtiPct < 20) return { label: "Very low", note: "Strong affordability in most lending contexts." };
    if (dtiPct < 30) return { label: "Low", note: "Generally healthy debt load for many borrowers." };
    if (dtiPct < 36) return { label: "Moderate", note: "Often acceptable, depending on lender and credit profile." };
    if (dtiPct < 43) return { label: "High", note: "Approval may be harder; reducing payments can help." };
    return { label: "Very high", note: "Often considered risky; approval may be difficult without strong compensating factors." };
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!grossMonthlyIncome || !totalMonthlyDebt || !monthlyHousingPayment) return;

      const income = toNumber(grossMonthlyIncome.value);
      const debt = toNumber(totalMonthlyDebt.value);
      const housing = toNumber(monthlyHousingPayment.value);

      if (!validatePositive(income, "gross monthly income")) return;
      if (!validateNonNegative(debt, "total monthly debt payments")) return;

      const backEndDti = (debt / income) * 100;

      let frontEndDti = null;
      if (Number.isFinite(housing) && housing > 0) {
        frontEndDti = (housing / income) * 100;
      }

      const remainingAfterDebt = income - debt;

      const backEndClass = classifyDti(backEndDti);
      const frontEndClass = frontEndDti === null ? null : classifyDti(frontEndDti);

      const backEndDtiDisplay = formatNumberTwoDecimals(backEndDti) + "%";
      const frontEndDtiDisplay = frontEndDti === null ? "Not provided" : (formatNumberTwoDecimals(frontEndDti) + "%");

      const remainingDisplay = formatNumberTwoDecimals(remainingAfterDebt);

      let guidance;
      if (backEndDti < 30) guidance = "Your total DTI is relatively low. Adding new debt may be easier, but pricing and approval still depend on your credit profile.";
      else if (backEndDti < 43) guidance = "Your total DTI is in a range where approvals can go either way depending on the lender, product, and your credit history.";
      else guidance = "Your total DTI is high. Many lenders may decline or offer worse terms unless you reduce payments, increase income, or borrow less.";

      const resultHtml = `
        <p><strong>Back-end DTI (all debt):</strong> ${backEndDtiDisplay}</p>
        <p><strong>Back-end DTI level:</strong> ${backEndClass.label}</p>
        <p>${backEndClass.note}</p>
        <hr>
        <p><strong>Front-end DTI (housing only):</strong> ${frontEndDtiDisplay}</p>
        <p><strong>Monthly income after debt payments:</strong> ${remainingDisplay}</p>
        <hr>
        <p><strong>What this means:</strong> ${guidance}</p>
        <p><strong>Quick lever check:</strong> To lower DTI, reduce monthly debt payments, increase gross income, or avoid adding new monthly repayments.</p>
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
      const message = "Debt-to-Income Ratio Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
