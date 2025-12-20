document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const currentBalanceInput = document.getElementById("currentBalance");
  const currentAprInput = document.getElementById("currentApr");
  const currentMonthlyPaymentInput = document.getElementById("currentMonthlyPayment");
  const consolidationAprInput = document.getElementById("consolidationApr");
  const consolidationTermYearsInput = document.getElementById("consolidationTermYears");
  const originationFeePercentInput = document.getElementById("originationFeePercent");
  const upfrontFeesInput = document.getElementById("upfrontFees");
  const rollFeesSelect = document.getElementById("rollFees");
  const extraMonthlyPaymentInput = document.getElementById("extraMonthlyPayment");

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
  attachLiveFormatting(currentBalanceInput);
  attachLiveFormatting(currentMonthlyPaymentInput);
  attachLiveFormatting(upfrontFeesInput);
  attachLiveFormatting(extraMonthlyPaymentInput);

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

  function validateApr(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0 || value > 200) {
      setResultError("Enter a valid " + fieldLabel + " between 0 and 200.");
      return false;
    }
    return true;
  }

  function validateYears(value, fieldLabel) {
    if (!Number.isFinite(value) || value <= 0 || value > 50) {
      setResultError("Enter a valid " + fieldLabel + " between 1 and 50 years.");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 6) CALC HELPERS (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  function monthlyRateFromApr(aprPercent) {
    return (aprPercent / 100) / 12;
  }

  function paymentForLoan(principal, aprPercent, months) {
    const r = monthlyRateFromApr(aprPercent);
    if (months <= 0) return NaN;
    if (r === 0) return principal / months;
    const denom = 1 - Math.pow(1 + r, -months);
    if (denom === 0) return NaN;
    return (principal * r) / denom;
  }

  function payoffForPayment(principal, aprPercent, monthlyPayment) {
    const r = monthlyRateFromApr(aprPercent);

    if (principal <= 0 || !Number.isFinite(principal)) return null;
    if (!Number.isFinite(monthlyPayment) || monthlyPayment <= 0) return null;

    if (r === 0) {
      const months = Math.ceil(principal / monthlyPayment);
      const totalPaid = months * monthlyPayment;
      const interest = Math.max(0, totalPaid - principal);
      return { months, interest, totalPaid };
    }

    // If payment does not cover monthly interest, debt will not amortize.
    const monthlyInterestOnly = principal * r;
    if (monthlyPayment <= monthlyInterestOnly) {
      return { months: Infinity, interest: Infinity, totalPaid: Infinity };
    }

    const months = Math.log(monthlyPayment / (monthlyPayment - principal * r)) / Math.log(1 + r);
    const monthsRoundedUp = Math.ceil(months);
    const totalPaid = monthsRoundedUp * monthlyPayment;
    const interest = Math.max(0, totalPaid - principal);
    return { months: monthsRoundedUp, interest, totalPaid };
  }

  function formatMonthsToYearsMonths(totalMonths) {
    if (!Number.isFinite(totalMonths) || totalMonths <= 0) return "—";
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    if (years === 0) return months + " months";
    if (months === 0) return years + " years";
    return years + " years " + months + " months";
  }

  // ------------------------------------------------------------
  // 7) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Read mode (not used)
      // Parse inputs using toNumber() (from /scripts/main.js)
      const currentBalance = toNumber(currentBalanceInput ? currentBalanceInput.value : "");
      const currentApr = toNumber(currentAprInput ? currentAprInput.value : "");
      const currentMonthlyPayment = toNumber(currentMonthlyPaymentInput ? currentMonthlyPaymentInput.value : "");

      const consolidationApr = toNumber(consolidationAprInput ? consolidationAprInput.value : "");
      const consolidationTermYears = toNumber(consolidationTermYearsInput ? consolidationTermYearsInput.value : "");

      const originationFeePercent = toNumber(originationFeePercentInput ? originationFeePercentInput.value : "");
      const upfrontFees = toNumber(upfrontFeesInput ? upfrontFeesInput.value : "");
      const extraMonthlyPayment = toNumber(extraMonthlyPaymentInput ? extraMonthlyPaymentInput.value : "");

      const feeHandling = rollFeesSelect ? rollFeesSelect.value : "roll";

      // Basic existence guard
      if (
        !currentBalanceInput ||
        !currentAprInput ||
        !consolidationAprInput ||
        !consolidationTermYearsInput ||
        !rollFeesSelect
      ) {
        setResultError("This calculator is missing required fields on the page.");
        return;
      }

      // Validation (required fields)
      if (!validatePositive(currentBalance, "current total balance")) return;
      if (!validateApr(currentApr, "current average APR")) return;

      if (!validateApr(consolidationApr, "consolidation loan APR")) return;
      if (!validateYears(consolidationTermYears, "consolidation term")) return;

      // Optional validations (only if provided)
      if (Number.isFinite(currentMonthlyPayment) && currentMonthlyPayment < 0) {
        setResultError("Enter a valid current monthly payment (0 or higher), or leave it blank.");
        return;
      }

      const feePercentSafe = Number.isFinite(originationFeePercent) ? originationFeePercent : 0;
      const upfrontFeesSafe = Number.isFinite(upfrontFees) ? upfrontFees : 0;
      const extraMonthlyPaymentSafe = Number.isFinite(extraMonthlyPayment) ? extraMonthlyPayment : 0;

      if (!validateNonNegative(feePercentSafe, "origination fee percent")) return;
      if (!validateNonNegative(upfrontFeesSafe, "other upfront fees")) return;
      if (!validateNonNegative(extraMonthlyPaymentSafe, "extra monthly payment")) return;

      if (feePercentSafe > 30) {
        setResultError("Origination fee percent looks unusually high. Enter a realistic value (typically 0 to 10).");
        return;
      }

      // Calculation logic
      const termMonths = Math.round(consolidationTermYears * 12);
      if (!Number.isFinite(termMonths) || termMonths <= 0) {
        setResultError("Enter a valid consolidation term in years.");
        return;
      }

      const originationFeeAmount = currentBalance * (feePercentSafe / 100);
      const totalFees = originationFeeAmount + upfrontFeesSafe;

      const newPrincipalRolled = currentBalance + totalFees;
      const newPrincipalUnrolled = currentBalance;

      const principalUsed = feeHandling === "pay" ? newPrincipalUnrolled : newPrincipalRolled;

      const newPaymentBase = paymentForLoan(principalUsed, consolidationApr, termMonths);
      if (!Number.isFinite(newPaymentBase) || newPaymentBase <= 0) {
        setResultError("Unable to calculate the consolidation payment with these inputs.");
        return;
      }

      const newPaymentWithExtra = newPaymentBase + extraMonthlyPaymentSafe;

      // Consolidation totals (base term)
      const totalPaidBase = newPaymentBase * termMonths;
      const interestBase = Math.max(0, totalPaidBase - principalUsed);

      // Total cost should include fees if paid upfront
      const totalCostBase = feeHandling === "pay" ? (interestBase + principalUsed + totalFees) : (interestBase + principalUsed);

      // Accelerated payoff if extra payment > 0
      let accelerated = null;
      if (extraMonthlyPaymentSafe > 0) {
        accelerated = payoffForPayment(principalUsed, consolidationApr, newPaymentWithExtra);
      }

      // Current payoff estimate (only if monthly payment provided and > 0)
      let currentEstimate = null;
      const hasCurrentPayment = Number.isFinite(currentMonthlyPayment) && currentMonthlyPayment > 0;
      if (hasCurrentPayment) {
        currentEstimate = payoffForPayment(currentBalance, currentApr, currentMonthlyPayment);
        if (currentEstimate && currentEstimate.months === Infinity) {
          setResultError("Your current monthly payment may be too low to cover interest at the entered APR. Increase it or adjust the APR.");
          return;
        }
      }

      // Break-even on fees (only meaningful if current monthly payment given and there are fees and there is monthly savings)
      let breakEvenMonths = null;
      let monthlySavings = null;
      if (hasCurrentPayment && totalFees > 0) {
        monthlySavings = currentMonthlyPayment - newPaymentBase;
        if (monthlySavings > 0) {
          breakEvenMonths = Math.ceil(totalFees / monthlySavings);
        }
      }

      // Build output HTML
      const money = (n) => formatNumberTwoDecimals(n);
      const pct = (n) => (Number.isFinite(n) ? money(n) : "—");

      const feeHandlingLabel = feeHandling === "pay" ? "Paid upfront (loan amount stays the same)" : "Rolled into the new loan (loan amount increases)";

      let comparisonRowsHtml = "";

      if (hasCurrentPayment && currentEstimate) {
        const currentTotalPaid = currentEstimate.totalPaid;
        const currentInterest = currentEstimate.interest;

        const monthsDiff = currentEstimate.months - termMonths;

        const estimatedSavingsTotalCost = (currentInterest + currentBalance) - totalCostBase;

        comparisonRowsHtml = `
          <div class="result-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Comparison</th>
                  <th>Current (estimate)</th>
                  <th>Consolidation (base term)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Monthly payment</td>
                  <td>${money(currentMonthlyPayment)}</td>
                  <td>${money(newPaymentBase)}</td>
                </tr>
                <tr>
                  <td>Payoff time</td>
                  <td>${formatMonthsToYearsMonths(currentEstimate.months)}</td>
                  <td>${formatMonthsToYearsMonths(termMonths)}</td>
                </tr>
                <tr>
                  <td>Total interest</td>
                  <td>${money(currentInterest)}</td>
                  <td>${money(interestBase)}</td>
                </tr>
                <tr>
                  <td>Total cost (principal + interest${totalFees > 0 ? " + fees" : ""})</td>
                  <td>${money(currentInterest + currentBalance)}</td>
                  <td>${money(totalCostBase)}</td>
                </tr>
                <tr>
                  <td>Estimated difference (current minus consolidation)</td>
                  <td colspan="2">${estimatedSavingsTotalCost >= 0 ? "You could save about " + money(estimatedSavingsTotalCost) : "You could pay about " + money(Math.abs(estimatedSavingsTotalCost)) + " more"}</td>
                </tr>
                <tr>
                  <td>Time difference</td>
                  <td colspan="2">${monthsDiff > 0 ? "Consolidation could be about " + formatMonthsToYearsMonths(monthsDiff) + " faster" : monthsDiff < 0 ? "Consolidation could be about " + formatMonthsToYearsMonths(Math.abs(monthsDiff)) + " slower" : "About the same payoff time"}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style="margin-top:10px;">
            Note: The “current” side is an estimate using a single blended APR and a single monthly payment. Real debts can behave differently.
          </p>
        `;
      } else {
        comparisonRowsHtml = `
          <p>
            Add your current total monthly payment to estimate your current payoff time and compare it to the consolidation loan.
            If you do not know it, you can still use the results below to evaluate the consolidation offer on its own.
          </p>
        `;
      }

      let breakEvenHtml = "";
      if (hasCurrentPayment && totalFees > 0) {
        if (monthlySavings > 0 && Number.isFinite(breakEvenMonths)) {
          breakEvenHtml = `<p><strong>Fee break-even:</strong> If your payment drops by ${money(monthlySavings)} per month, you recover fees in about ${formatMonthsToYearsMonths(breakEvenMonths)}.</p>`;
        } else if (monthlySavings !== null && monthlySavings <= 0) {
          breakEvenHtml = `<p><strong>Fee break-even:</strong> No break-even based on monthly payment because the consolidation payment is not lower than your current payment.</p>`;
        }
      }

      let acceleratedHtml = "";
      if (accelerated && accelerated.months !== Infinity && Number.isFinite(accelerated.months)) {
        const acceleratedInterest = accelerated.interest;
        const acceleratedTotalPaid = accelerated.totalPaid;
        const acceleratedTotalCost = feeHandling === "pay" ? (acceleratedInterest + principalUsed + totalFees) : (acceleratedInterest + principalUsed);

        acceleratedHtml = `
          <div class="result-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>With extra payments</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Monthly payment (base + extra)</td>
                  <td>${money(newPaymentWithExtra)}</td>
                </tr>
                <tr>
                  <td>Estimated payoff time</td>
                  <td>${formatMonthsToYearsMonths(accelerated.months)}</td>
                </tr>
                <tr>
                  <td>Estimated total interest</td>
                  <td>${money(acceleratedInterest)}</td>
                </tr>
                <tr>
                  <td>Estimated total cost (includes fees when applicable)</td>
                  <td>${money(acceleratedTotalCost)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        `;
      } else if (extraMonthlyPaymentSafe > 0) {
        acceleratedHtml = `<p><strong>With extra payments:</strong> The extra payment entered may be too low to amortise the loan at this APR. Increase it or remove the extra payment.</p>`;
      }

      const resultHtml = `
        <p><strong>Consolidation summary</strong></p>
        <ul>
          <li><strong>Fee handling:</strong> ${feeHandlingLabel}</li>
          <li><strong>Current balance:</strong> ${money(currentBalance)}</li>
          <li><strong>Current average APR:</strong> ${pct(currentApr)}%</li>
          <li><strong>Consolidation APR:</strong> ${pct(consolidationApr)}%</li>
          <li><strong>Term:</strong> ${consolidationTermYears} years (${termMonths} months)</li>
        </ul>

        <div class="result-table-wrap">
          <table>
            <thead>
              <tr>
                <th>New loan details</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Origination fee</td>
                <td>${money(originationFeeAmount)} (${pct(feePercentSafe)}%)</td>
              </tr>
              <tr>
                <td>Other upfront fees</td>
                <td>${money(upfrontFeesSafe)}</td>
              </tr>
              <tr>
                <td>Total fees</td>
                <td>${money(totalFees)}</td>
              </tr>
              <tr>
                <td>New loan principal used for payment</td>
                <td>${money(principalUsed)}</td>
              </tr>
              <tr>
                <td>Estimated monthly payment (base)</td>
                <td>${money(newPaymentBase)}</td>
              </tr>
              <tr>
                <td>Estimated total interest (base term)</td>
                <td>${money(interestBase)}</td>
              </tr>
              <tr>
                <td>Estimated total cost (includes fees when applicable)</td>
                <td>${money(totalCostBase)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        ${breakEvenHtml}

        <p><strong>Comparison view</strong></p>
        ${comparisonRowsHtml}

        ${acceleratedHtml}
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
      const message = "Debt Consolidation Impact Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
