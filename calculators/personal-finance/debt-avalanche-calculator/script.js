document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const extraPaymentInput = document.getElementById("extraPayment");
  const compareSnowballInput = document.getElementById("compareSnowball");

  const debtNameInputs = [
    document.getElementById("debtName1"),
    document.getElementById("debtName2"),
    document.getElementById("debtName3"),
    document.getElementById("debtName4"),
    document.getElementById("debtName5"),
    document.getElementById("debtName6")
  ];

  const balanceInputs = [
    document.getElementById("balance1"),
    document.getElementById("balance2"),
    document.getElementById("balance3"),
    document.getElementById("balance4"),
    document.getElementById("balance5"),
    document.getElementById("balance6")
  ];

  const aprInputs = [
    document.getElementById("apr1"),
    document.getElementById("apr2"),
    document.getElementById("apr3"),
    document.getElementById("apr4"),
    document.getElementById("apr5"),
    document.getElementById("apr6")
  ];

  const minInputs = [
    document.getElementById("min1"),
    document.getElementById("min2"),
    document.getElementById("min3"),
    document.getElementById("min4"),
    document.getElementById("min5"),
    document.getElementById("min6")
  ];

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(extraPaymentInput);
  balanceInputs.forEach(attachLiveFormatting);
  minInputs.forEach(attachLiveFormatting);
  // APRs are typically small; keep as typed (no comma formatting)

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
  // 4) OPTIONAL MODE HANDLING (NOT USED)
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
  // 6) CORE LOGIC
  // ------------------------------------------------------------
  function sanitizeName(name, fallbackIndex) {
    const trimmed = (name || "").trim();
    if (trimmed.length > 0) return trimmed;
    return "Debt " + (fallbackIndex + 1);
  }

  function formatMonthsToYearsMonths(months) {
    const m = Math.max(0, Math.round(months));
    const years = Math.floor(m / 12);
    const rem = m % 12;

    if (years <= 0) return rem + " months";
    if (rem === 0) return years + " years";
    return years + " years, " + rem + " months";
  }

  function addMonthsToDate(dateObj, monthsToAdd) {
    const d = new Date(dateObj.getTime());
    const targetMonth = d.getMonth() + monthsToAdd;
    d.setMonth(targetMonth);

    // If month rolled over oddly (end-of-month), normalize by stepping back
    while (d.getMonth() !== ((targetMonth % 12) + 12) % 12) {
      d.setDate(d.getDate() - 1);
    }
    return d;
  }

  function formatMonthYear(dateObj) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months[dateObj.getMonth()] + " " + dateObj.getFullYear();
  }

  function simulateStrategy(debtsInput, extraPayment, strategy) {
    // strategy: "avalanche" (highest APR) or "snowball" (lowest balance)
    const debts = debtsInput.map(function (d) {
      return {
        name: d.name,
        apr: d.apr,
        rateMonthly: d.apr / 100 / 12,
        min: d.min,
        startBalance: d.balance,
        balance: d.balance,
        interestPaid: 0,
        paidTotal: 0,
        payoffMonth: null
      };
    });

    let months = 0;
    let totalInterest = 0;
    let totalPaid = 0;

    const MAX_MONTHS = 1200; // 100 years cap to prevent runaway
    const EPS = 0.005;

    function activeIndexes() {
      const idx = [];
      for (let i = 0; i < debts.length; i++) {
        if (debts[i].balance > EPS) idx.push(i);
      }
      return idx;
    }

    function pickTarget(activeIdxs) {
      if (activeIdxs.length === 0) return null;

      let best = activeIdxs[0];
      for (let i = 1; i < activeIdxs.length; i++) {
        const j = activeIdxs[i];

        if (strategy === "avalanche") {
          // Higher APR first; tie-breaker: higher balance
          if (debts[j].apr > debts[best].apr) best = j;
          else if (debts[j].apr === debts[best].apr && debts[j].balance > debts[best].balance) best = j;
        } else {
          // Snowball: smaller balance first; tie-breaker: higher APR
          if (debts[j].balance < debts[best].balance) best = j;
          else if (debts[j].balance === debts[best].balance && debts[j].apr > debts[best].apr) best = j;
        }
      }
      return best;
    }

    while (months < MAX_MONTHS) {
      const actives = activeIndexes();
      if (actives.length === 0) break;

      months += 1;

      // 1) Apply interest
      for (let i = 0; i < actives.length; i++) {
        const idx = actives[i];
        const d = debts[idx];
        const interest = d.balance * d.rateMonthly;
        d.balance += interest;
        d.interestPaid += interest;
        totalInterest += interest;
      }

      // 2) Pay minimums
      let extraPool = extraPayment;

      for (let i = 0; i < actives.length; i++) {
        const idx = actives[i];
        const d = debts[idx];

        const payMin = Math.min(d.min, d.balance);
        if (payMin > 0) {
          d.balance -= payMin;
          d.paidTotal += payMin;
          totalPaid += payMin;
        }

        if (d.balance <= EPS && d.payoffMonth === null) {
          d.balance = 0;
          d.payoffMonth = months;
        }
      }

      // 3) Apply extra to target (and roll if target is paid mid-month)
      while (extraPool > EPS) {
        const currentActives = activeIndexes();
        if (currentActives.length === 0) break;

        const targetIdx = pickTarget(currentActives);
        if (targetIdx === null) break;

        const t = debts[targetIdx];
        const payExtra = Math.min(extraPool, t.balance);

        if (payExtra <= 0) break;

        t.balance -= payExtra;
        t.paidTotal += payExtra;
        totalPaid += payExtra;
        extraPool -= payExtra;

        if (t.balance <= EPS && t.payoffMonth === null) {
          t.balance = 0;
          t.payoffMonth = months;
        }
      }

      // 4) Detect non-payable behavior: if nothing reduced over time, loop will hit cap
      // (Handled by MAX_MONTHS)
    }

    const remaining = activeIndexes().length;
    if (remaining > 0) {
      return {
        ok: false,
        error:
          "Your payments appear too low to pay off these debts (balances are not reaching zero). Increase the extra monthly payment or minimum payments and try again."
      };
    }

    return {
      ok: true,
      months: months,
      totalInterest: totalInterest,
      totalPaid: totalPaid,
      debts: debts
    };
  }

  function readDebtsFromInputs() {
    const debts = [];

    for (let i = 0; i < balanceInputs.length; i++) {
      const bal = toNumber(balanceInputs[i] ? balanceInputs[i].value : "");
      const apr = toNumber(aprInputs[i] ? aprInputs[i].value : "");
      const min = toNumber(minInputs[i] ? minInputs[i].value : "");
      const name = sanitizeName(debtNameInputs[i] ? debtNameInputs[i].value : "", i);

      const hasAny = (balanceInputs[i] && (balanceInputs[i].value || "").trim().length > 0) ||
                     (aprInputs[i] && (aprInputs[i].value || "").trim().length > 0) ||
                     (minInputs[i] && (minInputs[i].value || "").trim().length > 0) ||
                     (debtNameInputs[i] && (debtNameInputs[i].value || "").trim().length > 0);

      if (!hasAny) continue;

      debts.push({
        name: name,
        balance: bal,
        apr: apr,
        min: min
      });
    }

    return debts;
  }

  function buildTableHtml(sim, title) {
    const now = new Date();
    const rows = sim.debts
      .slice()
      .sort(function (a, b) {
        // Sort by payoff month (earlier first), then by APR desc
        const am = a.payoffMonth === null ? 999999 : a.payoffMonth;
        const bm = b.payoffMonth === null ? 999999 : b.payoffMonth;
        if (am !== bm) return am - bm;
        return b.apr - a.apr;
      })
      .map(function (d) {
        const payoffMonths = d.payoffMonth ? d.payoffMonth : 0;
        const payoffDate = addMonthsToDate(now, payoffMonths);
        return (
          "<tr>" +
            "<td>" + d.name + "</td>" +
            "<td>" + formatNumberTwoDecimals(d.apr) + "%</td>" +
            "<td>" + formatNumberTwoDecimals(d.startBalance) + "</td>" +
            "<td>" + formatNumberTwoDecimals(d.min) + "</td>" +
            "<td>" + payoffMonths + "</td>" +
            "<td>" + formatMonthYear(payoffDate) + "</td>" +
          "</tr>"
        );
      })
      .join("");

    return (
      "<div class=\"result-card\">" +
        "<h3>" + title + "</h3>" +
        "<div class=\"table-wrap\">" +
          "<table class=\"result-table\">" +
            "<thead>" +
              "<tr>" +
                "<th>Debt</th>" +
                "<th>APR</th>" +
                "<th>Start balance</th>" +
                "<th>Min / month</th>" +
                "<th>Payoff month</th>" +
                "<th>Est. paid off</th>" +
              "</tr>" +
            "</thead>" +
            "<tbody>" + rows + "</tbody>" +
          "</table>" +
        "</div>" +
      "</div>"
    );
  }

  function buildSummaryHtml(sim, title) {
    const payoffDate = addMonthsToDate(new Date(), sim.months);
    const list =
      "<ul class=\"result-kv\">" +
        "<li><strong>Estimated payoff time:</strong> " + formatMonthsToYearsMonths(sim.months) + " (" + sim.months + " months)</li>" +
        "<li><strong>Estimated payoff date:</strong> " + formatMonthYear(payoffDate) + "</li>" +
        "<li><strong>Total interest paid (estimate):</strong> " + formatNumberTwoDecimals(sim.totalInterest) + "</li>" +
        "<li><strong>Total paid (principal + interest):</strong> " + formatNumberTwoDecimals(sim.totalPaid) + "</li>" +
      "</ul>";

    return (
      "<div class=\"result-card\">" +
        "<h3>" + title + "</h3>" +
        list +
      "</div>"
    );
  }

  // ------------------------------------------------------------
  // 7) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!extraPaymentInput || !compareSnowballInput) return;

      const extraPayment = toNumber(extraPaymentInput.value);
      const compareSnowball = !!compareSnowballInput.checked;

      if (!validateNonNegative(extraPayment, "extra monthly payment")) return;

      const debts = readDebtsFromInputs();

      if (!debts || debts.length === 0) {
        setResultError("Enter at least one debt (balance, APR, and minimum payment).");
        return;
      }

      // Validate each debt row that is being used
      for (let i = 0; i < debts.length; i++) {
        const d = debts[i];
        if (!validatePositive(d.balance, d.name + " balance")) return;
        if (!validateNonNegative(d.apr, d.name + " APR")) return;
        if (!validatePositive(d.min, d.name + " minimum payment")) return;
      }

      // Quick sanity: total monthly payment should be > 0 (already guaranteed by mins)
      // But we can flag a realistic issue: if everything is extremely low, it may never pay off (handled by simulation cap)
      const avalancheSim = simulateStrategy(debts, extraPayment, "avalanche");
      if (!avalancheSim.ok) {
        setResultError(avalancheSim.error);
        return;
      }

      let resultHtml = "";
      resultHtml += "<div class=\"result-split\">";
      resultHtml += buildSummaryHtml(avalancheSim, "Debt avalanche (highest APR first)");

      if (compareSnowball) {
        const snowballSim = simulateStrategy(debts, extraPayment, "snowball");
        if (!snowballSim.ok) {
          setResultError(snowballSim.error);
          return;
        }

        // Quick comparison note
        const interestDiff = snowballSim.totalInterest - avalancheSim.totalInterest;
        const monthsDiff = snowballSim.months - avalancheSim.months;

        let comparisonLine = "<p style=\"margin:0 0 8px;\">";
        if (Math.abs(interestDiff) < 0.01 && monthsDiff === 0) {
          comparisonLine += "<strong>Comparison:</strong> Both methods estimate the same payoff time and interest with these inputs.";
        } else {
          comparisonLine += "<strong>Comparison:</strong> ";
          if (interestDiff > 0.01) {
            comparisonLine += "Avalanche estimates " + formatNumberTwoDecimals(interestDiff) + " less interest than snowball. ";
          } else if (interestDiff < -0.01) {
            comparisonLine += "Snowball estimates " + formatNumberTwoDecimals(Math.abs(interestDiff)) + " less interest than avalanche. ";
          }
          if (monthsDiff > 0) {
            comparisonLine += "Avalanche also pays off about " + monthsDiff + " months sooner.";
          } else if (monthsDiff < 0) {
            comparisonLine += "Snowball also pays off about " + Math.abs(monthsDiff) + " months sooner.";
          }
        }
        comparisonLine += "</p>";

        resultHtml += "<div class=\"result-card\">" + comparisonLine + "</div>";
        resultHtml += buildSummaryHtml(snowballSim, "Debt snowball (smallest balance first)");
        resultHtml += buildTableHtml(avalancheSim, "Avalanche payoff detail");
        resultHtml += buildTableHtml(snowballSim, "Snowball payoff detail");
      } else {
        resultHtml += buildTableHtml(avalancheSim, "Payoff detail (avalanche)");
      }

      resultHtml += "</div>";

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 8) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Debt Avalanche Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
