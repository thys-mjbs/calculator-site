document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS
  // ------------------------------------------------------------
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  const cashOnHandInput = document.getElementById("cashOnHand");
  const monthlyExpensesInput = document.getElementById("monthlyExpenses");
  const monthlyRevenueInput = document.getElementById("monthlyRevenue");

  const oneTimeInflowInput = document.getElementById("oneTimeInflow");
  const reserveTargetInput = document.getElementById("reserveTarget");
  const expenseGrowthPctInput = document.getElementById("expenseGrowthPct");
  const revenueGrowthPctInput = document.getElementById("revenueGrowthPct");
  const maxMonthsInput = document.getElementById("maxMonths");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(cashOnHandInput);
  attachLiveFormatting(monthlyExpensesInput);
  attachLiveFormatting(monthlyRevenueInput);
  attachLiveFormatting(oneTimeInflowInput);
  attachLiveFormatting(reserveTargetInput);

  // ------------------------------------------------------------
  // 3) RESULT HELPERS
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
  // 5) VALIDATION HELPERS
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
    if (!Number.isFinite(value)) {
      setResultError("Enter a valid " + fieldLabel + ".");
      return false;
    }
    if (value < -100 || value > 100) {
      setResultError(fieldLabel + " must be between -100 and 100.");
      return false;
    }
    return true;
  }

  function safeIntegerOrDefault(value, defaultValue) {
    if (!Number.isFinite(value)) return defaultValue;
    const rounded = Math.round(value);
    if (rounded <= 0) return defaultValue;
    return rounded;
  }

  function monthsToLabel(months) {
    if (!Number.isFinite(months)) return "";
    if (months < 1) return "less than 1 month";
    if (months < 2) return "about 1 month";
    return "about " + formatNumberTwoDecimals(months) + " months";
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!cashOnHandInput || !monthlyExpensesInput || !monthlyRevenueInput) return;

      const cashOnHand = toNumber(cashOnHandInput.value);
      const monthlyExpenses = toNumber(monthlyExpensesInput.value);
      const monthlyRevenue = toNumber(monthlyRevenueInput.value);

      const oneTimeInflow = toNumber(oneTimeInflowInput ? oneTimeInflowInput.value : "");
      const reserveTarget = toNumber(reserveTargetInput ? reserveTargetInput.value : "");
      const expenseGrowthPct = toNumber(expenseGrowthPctInput ? expenseGrowthPctInput.value : "");
      const revenueGrowthPct = toNumber(revenueGrowthPctInput ? revenueGrowthPctInput.value : "");
      const maxMonthsRaw = toNumber(maxMonthsInput ? maxMonthsInput.value : "");

      if (!validateNonNegative(cashOnHand, "cash on hand")) return;
      if (!validatePositive(monthlyExpenses, "monthly operating expenses")) return;

      const revenueUsed = Number.isFinite(monthlyRevenue) ? Math.max(0, monthlyRevenue) : 0;
      const inflowUsed = Number.isFinite(oneTimeInflow) ? Math.max(0, oneTimeInflow) : 0;
      const reserveUsed = Number.isFinite(reserveTarget) ? Math.max(0, reserveTarget) : 0;

      if (reserveUsed > cashOnHand + inflowUsed) {
        setResultError("Your minimum cash reserve is higher than your available cash. Lower the reserve or increase cash on hand.");
        return;
      }

      const expenseGrowthUsed = Number.isFinite(expenseGrowthPct) ? expenseGrowthPct : 0;
      const revenueGrowthUsed = Number.isFinite(revenueGrowthPct) ? revenueGrowthPct : 0;

      if (!validatePercent(expenseGrowthUsed, "Expense change per month %")) return;
      if (!validatePercent(revenueGrowthUsed, "Revenue change per month %")) return;

      const maxMonths = safeIntegerOrDefault(maxMonthsRaw, 120);
      const useSimulation = expenseGrowthUsed !== 0 || revenueGrowthUsed !== 0;

      const grossBurn = monthlyExpenses;
      const netBurnBase = monthlyExpenses - revenueUsed;

      let runwayMonths = null;
      let runwayType = "steady";
      let monthsSimulated = null;
      let endingCash = null;

      const startingCashAvailable = cashOnHand + inflowUsed;
      const cashToSpend = Math.max(0, startingCashAvailable - reserveUsed);

      if (!useSimulation) {
        runwayType = "steady";

        if (netBurnBase <= 0) {
          runwayMonths = Infinity;
        } else {
          runwayMonths = cashToSpend / netBurnBase;
        }
      } else {
        runwayType = "simulated";

        let cash = startingCashAvailable;
        let expenses = monthlyExpenses;
        let revenue = revenueUsed;

        let months = 0;

        while (months < maxMonths) {
          const net = expenses - revenue;
          cash = cash - net;

          months += 1;

          if (cash <= reserveUsed) {
            break;
          }

          expenses = expenses * (1 + expenseGrowthUsed / 100);
          revenue = revenue * (1 + revenueGrowthUsed / 100);

          if (!Number.isFinite(expenses) || !Number.isFinite(revenue) || !Number.isFinite(cash)) {
            setResultError("Inputs produced an unrealistic projection. Reduce growth rates and try again.");
            return;
          }

          if (expenses < 0) expenses = 0;
          if (revenue < 0) revenue = 0;
        }

        monthsSimulated = months;
        endingCash = cash;

        if (netBurnBase <= 0 && cash >= reserveUsed && monthsSimulated === maxMonths) {
          runwayMonths = Infinity;
        } else if (cash <= reserveUsed) {
          runwayMonths = monthsSimulated;
        } else {
          runwayMonths = Infinity;
        }
      }

      const breakEvenRevenue = monthlyExpenses;
      const monthlySurplus = Math.max(0, revenueUsed - monthlyExpenses);

      let primaryLine = "";
      let supportLine = "";
      let runwayLine = "";
      let noteLine = "";

      const money = function (v) {
        return formatNumberTwoDecimals(v);
      };

      const grossBurnStr = money(grossBurn);
      const netBurnStr = money(Math.max(0, netBurnBase));
      const surplusStr = money(monthlySurplus);
      const breakEvenStr = money(breakEvenRevenue);
      const startingCashStr = money(startingCashAvailable);
      const reserveStr = money(reserveUsed);

      if (runwayMonths === Infinity) {
        primaryLine = "<p><strong>Status:</strong> You are not burning cash on these inputs.</p>";
        supportLine =
          "<p><strong>Monthly surplus:</strong> " + surplusStr + " (revenue minus expenses)</p>";
        runwayLine =
          "<p><strong>Runway:</strong> No cash runway limit is implied here (under the same assumptions).</p>";

        if (useSimulation) {
          noteLine =
            "<p><strong>Projection note:</strong> With your growth assumptions, cash did not fall to your reserve within " +
            maxMonths +
            " months.</p>";
        }
      } else {
        primaryLine =
          "<p><strong>Estimated runway:</strong> " + monthsToLabel(runwayMonths) + "</p>";

        supportLine =
          "<p><strong>Gross burn:</strong> " + grossBurnStr + " per month</p>" +
          "<p><strong>Net burn:</strong> " + netBurnStr + " per month (expenses minus revenue)</p>";

        if (useSimulation) {
          runwayLine =
            "<p><strong>Runway method:</strong> Simulated month by month using your growth assumptions.</p>";
          if (Number.isFinite(endingCash)) {
            runwayLine +=
              "<p><strong>Cash at runway end:</strong> " + money(Math.max(0, endingCash)) + " (approx.)</p>";
          }
        } else {
          runwayLine =
            "<p><strong>Runway method:</strong> Simple steady-state estimate (no monthly growth applied).</p>";
        }

        noteLine =
          "<p><strong>Cash used for runway:</strong> " +
          startingCashStr +
          " minus reserve " +
          reserveStr +
          " = " +
          money(cashToSpend) +
          "</p>";
      }

      const insightLine =
        "<p><strong>Break-even revenue:</strong> " +
        breakEvenStr +
        " per month is needed to reach a net burn of 0.</p>";

      let resultHtml =
        primaryLine +
        supportLine +
        runwayLine +
        noteLine +
        insightLine;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Burn Rate Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
