document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const creditLimitInput = document.getElementById("creditLimitInput");
  const initialDrawInput = document.getElementById("initialDrawInput");
  const monthlyDrawInput = document.getElementById("monthlyDrawInput");
  const monthlyPaymentInput = document.getElementById("monthlyPaymentInput");
  const aprInput = document.getElementById("aprInput");
  const monthsInput = document.getElementById("monthsInput");
  const annualFeeInput = document.getElementById("annualFeeInput");
  const drawFeePercentInput = document.getElementById("drawFeePercentInput");

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
  attachLiveFormatting(creditLimitInput);
  attachLiveFormatting(initialDrawInput);
  attachLiveFormatting(monthlyDrawInput);
  attachLiveFormatting(monthlyPaymentInput);
  attachLiveFormatting(monthsInput);
  attachLiveFormatting(annualFeeInput);
  attachLiveFormatting(aprInput);
  attachLiveFormatting(drawFeePercentInput);

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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse inputs using toNumber() (from /scripts/main.js)
      const creditLimit = toNumber(creditLimitInput ? creditLimitInput.value : "");
      const initialDraw = toNumber(initialDrawInput ? initialDrawInput.value : "");
      const monthlyDraw = toNumber(monthlyDrawInput ? monthlyDrawInput.value : "");
      const monthlyPayment = toNumber(monthlyPaymentInput ? monthlyPaymentInput.value : "");
      const aprPercent = toNumber(aprInput ? aprInput.value : "");
      const monthsRaw = toNumber(monthsInput ? monthsInput.value : "");
      const annualFee = toNumber(annualFeeInput ? annualFeeInput.value : "");
      const drawFeePercent = toNumber(drawFeePercentInput ? drawFeePercentInput.value : "");

      // Basic existence guard
      if (
        !initialDrawInput ||
        !monthlyPaymentInput ||
        !aprInput ||
        !monthsInput
      ) {
        return;
      }

      // Validation
      if (!validateNonNegative(initialDraw, "initial draw amount")) return;
      if (!validateNonNegative(monthlyDraw, "additional monthly draw")) return;
      if (!validateNonNegative(monthlyPayment, "monthly payment")) return;
      if (!validatePositive(aprPercent, "APR")) return;
      if (!validatePositive(monthsRaw, "time period (months)")) return;
      if (!validateNonNegative(annualFee, "annual fee")) return;
      if (!validateNonNegative(drawFeePercent, "draw fee percentage")) return;

      const months = Math.floor(monthsRaw);
      if (months < 1) {
        setResultError("Enter a valid time period (months) of 1 or more.");
        return;
      }

      if (initialDraw <= 0 && monthlyDraw <= 0) {
        setResultError("Enter an initial draw amount or an additional monthly draw amount greater than 0.");
        return;
      }

      if (Number.isFinite(creditLimit) && creditLimit > 0) {
        if (initialDraw > creditLimit) {
          setResultError("Your initial draw exceeds the credit limit you entered.");
          return;
        }
        if (monthlyDraw > creditLimit) {
          setResultError("Your monthly draw exceeds the credit limit you entered.");
          return;
        }
      }

      // Calculation logic (monthly simulation)
      const apr = aprPercent / 100;
      const monthlyRate = apr / 12;

      let balance = 0;
      let totalInterest = 0;
      let totalFees = 0;
      let totalPaid = 0;

      let sumBalances = 0;

      const monthlyAnnualFee = annualFee > 0 ? annualFee / 12 : 0;
      const drawFeeRate = drawFeePercent > 0 ? drawFeePercent / 100 : 0;

      const rows = [];
      const tableMonthsToShow = Math.min(months, 12);

      for (let m = 1; m <= months; m++) {
        const startingBalance = balance;

        // Draws at start of month
        const drawThisMonth = (m === 1 ? initialDraw : 0) + (monthlyDraw > 0 ? monthlyDraw : 0);

        // Credit limit check (soft warning: cap draws to limit if provided)
        if (Number.isFinite(creditLimit) && creditLimit > 0) {
          if (startingBalance + drawThisMonth > creditLimit) {
            setResultError("Your balance plus planned draws would exceed the credit limit in month " + m + ".");
            return;
          }
        }

        // Draw fee on draws (assumed added to balance)
        const drawFee = drawThisMonth > 0 ? drawThisMonth * drawFeeRate : 0;

        balance = balance + drawThisMonth + drawFee;

        // Annual fee (assumed added to balance monthly)
        const feeThisMonth = monthlyAnnualFee;
        balance = balance + feeThisMonth;

        const feesAdded = drawFee + feeThisMonth;
        totalFees += feesAdded;

        // Interest accrues on current balance (monthly approximation)
        const interest = balance * monthlyRate;
        totalInterest += interest;
        balance = balance + interest;

        // Payment at end of month
        const payment = monthlyPayment;
        totalPaid += payment;

        balance = balance - payment;
        if (balance < 0) balance = 0;

        sumBalances += balance;

        // Store first 12 months for display
        if (m <= tableMonthsToShow) {
          rows.push({
            month: m,
            start: startingBalance,
            draw: drawThisMonth,
            fees: feesAdded,
            interest: interest,
            payment: payment,
            end: balance
          });
        }
      }

      const avgBalance = months > 0 ? sumBalances / months : 0;
      const totalCost = totalInterest + totalFees;

      const paymentCoversInterestTest = (initialDraw + monthlyDraw) > 0
        ? (monthlyPayment >= ((initialDraw + monthlyDraw) * monthlyRate))
        : (monthlyPayment >= (avgBalance * monthlyRate));

      const effectiveCostRate = (avgBalance > 0) ? (totalCost / avgBalance) : 0;

      const warningLines = [];
      if (monthlyPayment === 0) {
        warningLines.push("With a monthly payment of 0, your balance will grow because interest and fees are added.");
      } else {
        // A more direct check: last month’s interest can still be lower/higher, so give a practical warning
        if (monthlyPayment < (avgBalance * monthlyRate)) {
          warningLines.push("Your payment looks too low to consistently cover interest. Your balance may not fall much, or can grow.");
        }
      }

      // Build output HTML
      let tableHtml = "";
      if (rows.length > 0) {
        const header = `
          <div class="result-table" role="region" aria-label="Monthly cost breakdown (first ${rows.length} months)">
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Start</th>
                  <th>Draws</th>
                  <th>Fees</th>
                  <th>Interest</th>
                  <th>Payment</th>
                  <th>End</th>
                </tr>
              </thead>
              <tbody>
        `;

        const body = rows.map(function (r) {
          return `
            <tr>
              <td>${r.month}</td>
              <td>${formatNumberTwoDecimals(r.start)}</td>
              <td>${formatNumberTwoDecimals(r.draw)}</td>
              <td>${formatNumberTwoDecimals(r.fees)}</td>
              <td>${formatNumberTwoDecimals(r.interest)}</td>
              <td>${formatNumberTwoDecimals(r.payment)}</td>
              <td>${formatNumberTwoDecimals(r.end)}</td>
            </tr>
          `;
        }).join("");

        const footer = `
              </tbody>
            </table>
          </div>
        `;

        tableHtml = header + body + footer;

        if (months > 12) {
          tableHtml += `<div class="result-note">Table shows the first 12 months only. Totals include the full ${months}-month period.</div>`;
        }
      }

      const warningsHtml = warningLines.length
        ? `<ul>${warningLines.map(function (w) { return `<li>${w}</li>`; }).join("")}</ul>`
        : "";

      const resultHtml = `
        <p><strong>Total interest (estimated):</strong> ${formatNumberTwoDecimals(totalInterest)}</p>
        <p><strong>Total fees (estimated):</strong> ${formatNumberTwoDecimals(totalFees)}</p>
        <p><strong>Total cost (interest + fees):</strong> ${formatNumberTwoDecimals(totalCost)}</p>
        <p><strong>Ending balance after ${months} months:</strong> ${formatNumberTwoDecimals(balance)}</p>
        <p><strong>Average ending balance (rough):</strong> ${formatNumberTwoDecimals(avgBalance)}</p>
        <p><strong>Effective cost vs average balance:</strong> ${(effectiveCostRate * 100).toFixed(2)}%</p>
        ${warningsHtml}
        ${tableHtml}
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
      const message = "Line of Credit Cost Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
