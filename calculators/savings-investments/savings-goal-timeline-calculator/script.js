document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const currentSavings = document.getElementById("currentSavings");
  const savingsGoal = document.getElementById("savingsGoal");
  const monthlyContribution = document.getElementById("monthlyContribution");
  const annualInterestRate = document.getElementById("annualInterestRate");
  const oneTimeBoost = document.getElementById("oneTimeBoost");

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
  attachLiveFormatting(currentSavings);
  attachLiveFormatting(savingsGoal);
  attachLiveFormatting(monthlyContribution);
  attachLiveFormatting(oneTimeBoost);

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

  function addMonthsToDate(date, monthsToAdd) {
    const d = new Date(date.getTime());
    const day = d.getDate();
    d.setMonth(d.getMonth() + monthsToAdd);

    // If month rollover changed the day, clamp to last day of previous month.
    if (d.getDate() < day) {
      d.setDate(0);
    }
    return d;
  }

  function formatMonthYear(date) {
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    return monthNames[date.getMonth()] + " " + date.getFullYear();
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!savingsGoal || !monthlyContribution || !currentSavings || !annualInterestRate || !oneTimeBoost) {
        setResultError("This calculator is missing required fields on the page.");
        return;
      }

      const start = toNumber(currentSavings.value);
      const goal = toNumber(savingsGoal.value);
      const monthly = toNumber(monthlyContribution.value);
      const apr = toNumber(annualInterestRate.value);
      const boost = toNumber(oneTimeBoost.value);

      // Validation
      if (!validateNonNegative(start, "current savings")) return;
      if (!validatePositive(goal, "savings goal")) return;
      if (!validateNonNegative(monthly, "monthly contribution")) return;
      if (!validateNonNegative(boost, "one-time boost")) return;

      if (!Number.isFinite(apr) || apr < 0 || apr > 100) {
        setResultError("Enter a valid annual interest rate between 0 and 100.");
        return;
      }

      let balance = start + boost;

      if (balance >= goal) {
        const html = `
          <p><strong>Status:</strong> Goal already reached.</p>
          <p><strong>Current balance used:</strong> ${formatNumberTwoDecimals(balance)}</p>
          <p><strong>Goal:</strong> ${formatNumberTwoDecimals(goal)}</p>
          <p><strong>Time to goal:</strong> 0 months</p>
        `;
        setResultSuccess(html);
        return;
      }

      if (monthly <= 0 && apr <= 0) {
        setResultError("With 0 monthly contribution and 0% interest, you will not reach the goal.");
        return;
      }

      const monthlyRate = apr > 0 ? (apr / 100) / 12 : 0;

      // Month-by-month simulation
      const maxMonths = 1200; // 100 years cap to avoid infinite loops
      let months = 0;

      let totalContributions = 0;
      let interestEarned = 0;

      // If interest alone is used, this still works because monthly can be 0.
      while (months < maxMonths && balance < goal) {
        const interestThisMonth = balance * monthlyRate;
        balance += interestThisMonth;
        interestEarned += interestThisMonth;

        balance += monthly;
        totalContributions += monthly;

        months += 1;

        // If rate is 0 and monthly is 0, would have returned earlier.
        // If monthly is tiny and goal huge, cap will protect.
      }

      if (balance < goal) {
        setResultError("With these inputs, the goal is not reached within 100 years. Increase your monthly contribution or adjust assumptions.");
        return;
      }

      const years = Math.floor(months / 12);
      const remMonths = months % 12;

      const now = new Date();
      const targetDate = addMonthsToDate(now, months);
      const targetLabel = formatMonthYear(targetDate);

      const totalDeposits = (start + boost) + totalContributions;
      const endingBalance = balance;

      const gapWithoutInterest = goal - (start + boost);
      const monthsNoInterest = monthly > 0 ? Math.ceil(Math.max(0, gapWithoutInterest) / monthly) : null;

      let compareLine = "";
      if (monthsNoInterest !== null) {
        const diff = monthsNoInterest - months;
        if (diff > 0) {
          compareLine = `<p><strong>Interest impact:</strong> About ${diff} month(s) faster than saving with 0% interest (same contributions).</p>`;
        } else if (diff < 0) {
          compareLine = `<p><strong>Interest impact:</strong> About ${Math.abs(diff)} month(s) slower than 0% interest (unusual, double-check inputs).</p>`;
        } else {
          compareLine = `<p><strong>Interest impact:</strong> No meaningful change versus 0% interest under these inputs.</p>`;
        }
      } else {
        compareLine = `<p><strong>Interest impact:</strong> Timeline is driven only by interest because monthly contribution is 0.</p>`;
      }

      const timeParts = [];
      if (years > 0) timeParts.push(years + " year(s)");
      timeParts.push(remMonths + " month(s)");
      const timeStr = timeParts.join(" ");

      const resultHtml = `
        <p><strong>Estimated time to goal:</strong> ${timeStr} (${months} month(s))</p>
        <p><strong>Estimated goal date:</strong> ${targetLabel}</p>
        <p><strong>Starting savings used:</strong> ${formatNumberTwoDecimals(start)}</p>
        <p><strong>One-time boost used:</strong> ${formatNumberTwoDecimals(boost)}</p>
        <p><strong>Monthly contribution:</strong> ${formatNumberTwoDecimals(monthly)}</p>
        <p><strong>Annual interest rate:</strong> ${formatNumberTwoDecimals(apr)}%</p>
        <hr>
        <p><strong>Projected ending balance at goal month:</strong> ${formatNumberTwoDecimals(endingBalance)}</p>
        <p><strong>Total deposits (starting + boost + contributions):</strong> ${formatNumberTwoDecimals(totalDeposits)}</p>
        <p><strong>Estimated interest earned:</strong> ${formatNumberTwoDecimals(interestEarned)}</p>
        ${compareLine}
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
      const message = "Savings Goal Timeline Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
