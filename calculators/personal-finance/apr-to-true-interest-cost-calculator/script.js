document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const loanAmountInput = document.getElementById("loanAmount");
  const aprInput = document.getElementById("apr");
  const termMonthsInput = document.getElementById("termMonths");
  const originationFeeInput = document.getElementById("originationFee");
  const feeTreatmentSelect = document.getElementById("feeTreatment");

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
  attachLiveFormatting(loanAmountInput);
  attachLiveFormatting(originationFeeInput);

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

  function formatMoney(value) {
    return formatNumberTwoDecimals(value);
  }

  function formatPercent(value) {
    return formatNumberTwoDecimals(value) + "%";
  }

  function computePayment(principal, aprPercent, months) {
    const n = months;
    const apr = aprPercent / 100;

    if (n <= 0) return NaN;

    if (apr === 0) {
      return principal / n;
    }

    const r = apr / 12; // monthly nominal rate
    const denom = 1 - Math.pow(1 + r, -n);
    if (denom <= 0) return NaN;
    return (principal * r) / denom;
  }

  function computeImpliedMonthlyIRR(netProceeds, payment, months) {
    // Cash flows from borrower perspective:
    // t0: +netProceeds
    // t1..tn: -payment
    function npv(rate) {
      let total = netProceeds;
      for (let t = 1; t <= months; t++) {
        total += -payment / Math.pow(1 + rate, t);
      }
      return total;
    }

    // If payment is zero or netProceeds not positive, no meaningful IRR.
    if (!Number.isFinite(netProceeds) || netProceeds <= 0) return NaN;
    if (!Number.isFinite(payment) || payment <= 0) return NaN;

    // Find an upper bound where NPV becomes negative (monotonic decreasing in rate)
    let low = 0;
    let high = 0.5; // 50% per month initial guess
    let npvHigh = npv(high);
    let guard = 0;

    while (npvHigh > 0 && guard < 50) {
      high = high * 1.6;
      if (high > 10) break; // 1000% per month cap
      npvHigh = npv(high);
      guard++;
    }

    if (npvHigh > 0) return NaN;

    // Binary search for rate where NPV ~ 0
    for (let i = 0; i < 80; i++) {
      const mid = (low + high) / 2;
      const npvMid = npv(mid);
      if (npvMid > 0) {
        low = mid;
      } else {
        high = mid;
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
      const loanAmount = toNumber(loanAmountInput ? loanAmountInput.value : "");
      const apr = toNumber(aprInput ? aprInput.value : "");
      const termMonthsRaw = toNumber(
        termMonthsInput ? termMonthsInput.value : ""
      );
      const originationFee = toNumber(
        originationFeeInput ? originationFeeInput.value : ""
      );
      const feeTreatment = feeTreatmentSelect ? feeTreatmentSelect.value : "deducted";

      // Basic existence guard
      if (
        !loanAmountInput ||
        !aprInput ||
        !termMonthsInput ||
        !originationFeeInput ||
        !feeTreatmentSelect ||
        !resultDiv
      ) {
        return;
      }

      // Validation
      if (!validatePositive(loanAmount, "loan amount")) return;

      if (!Number.isFinite(apr) || apr < 0) {
        setResultError("Enter a valid APR of 0 or higher.");
        return;
      }

      if (!Number.isFinite(termMonthsRaw) || termMonthsRaw <= 0) {
        setResultError("Enter a valid term in months greater than 0.");
        return;
      }

      const termMonths = Math.round(termMonthsRaw);
      if (termMonths !== termMonthsRaw) {
        // Allow non-integers but normalize quietly
      }

      if (!validateNonNegative(originationFee, "upfront fee")) return;

      // Determine principal used for payment and net proceeds received
      let principalForPayment = loanAmount;
      let netProceeds = loanAmount;

      if (originationFee > 0) {
        if (feeTreatment === "financed") {
          principalForPayment = loanAmount + originationFee;
          netProceeds = loanAmount;
        } else {
          // "deducted" or "upfront"
          principalForPayment = loanAmount;
          netProceeds = loanAmount - originationFee;
        }
      }

      if (!Number.isFinite(netProceeds) || netProceeds <= 0) {
        setResultError(
          "Your fee is too large relative to the loan amount. Reduce the fee or increase the loan amount."
        );
        return;
      }

      // Calculation logic
      const monthlyPayment = computePayment(principalForPayment, apr, termMonths);
      if (!Number.isFinite(monthlyPayment) || monthlyPayment <= 0) {
        setResultError("Unable to calculate a valid monthly payment from these inputs.");
        return;
      }

      const totalOfPayments = monthlyPayment * termMonths;

      // Total cost comparison (simple, practical)
      // Total repaid includes payments; add fee only if it is paid upfront or deducted (it is still a cost).
      // For financed fees, the fee is inside principalForPayment and repaid through payments, so do not add it again.
      const totalCostToBorrower =
        feeTreatment === "financed" ? totalOfPayments : totalOfPayments + originationFee;

      const totalInterestPaid = totalOfPayments - principalForPayment;

      // True cost rate via implied IRR on cash flows
      const impliedMonthly = computeImpliedMonthlyIRR(netProceeds, monthlyPayment, termMonths);
      if (!Number.isFinite(impliedMonthly) || impliedMonthly < 0) {
        setResultError(
          "Unable to compute a true annual cost from these inputs. Check that the fee and term are realistic."
        );
        return;
      }

      const effectiveAnnual = Math.pow(1 + impliedMonthly, 12) - 1;

      // Supporting figures
      const costAboveProceeds = totalCostToBorrower - netProceeds;

      let feeNote = "";
      if (originationFee <= 0) {
        feeNote = "No upfront fee included.";
      } else if (feeTreatment === "financed") {
        feeNote =
          "Fee is financed: your payment is calculated on a higher balance, and you repay the fee over time.";
      } else if (feeTreatment === "upfront") {
        feeNote =
          "Fee is paid upfront: you need cash to pay the fee at the start, which increases your true cost.";
      } else {
        feeNote =
          "Fee is deducted from proceeds: you receive less cash upfront, which increases your true cost.";
      }

      // Build output HTML
      const resultHtml = `
        <p><strong>True annual cost (effective APR):</strong> ${formatPercent(effectiveAnnual * 100)}</p>
        <p><strong>Monthly payment:</strong> ${formatMoney(monthlyPayment)}</p>
        <p><strong>Net amount you effectively receive:</strong> ${formatMoney(netProceeds)}</p>
        <p><strong>Total paid over ${termMonths} months:</strong> ${formatMoney(totalCostToBorrower)}</p>
        <p><strong>Total interest (on financed balance):</strong> ${formatMoney(totalInterestPaid)}</p>
        <p><strong>Total cost above what you received:</strong> ${formatMoney(costAboveProceeds)}</p>
        <p>${feeNote}</p>
      `;

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
      const message =
        "APR to True Interest Cost Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
