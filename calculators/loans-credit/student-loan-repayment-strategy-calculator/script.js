document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const strategySelect = document.getElementById("strategySelect");
  const extraPayment = document.getElementById("extraPayment");

  const toggleAdvanced = document.getElementById("toggleAdvanced");
  const advancedSection = document.getElementById("advancedSection");
  const maxMonths = document.getElementById("maxMonths");
  const rateTypeSelect = document.getElementById("rateTypeSelect");
  const roundingSelect = document.getElementById("roundingSelect");

  const loan1Balance = document.getElementById("loan1Balance");
  const loan1Rate = document.getElementById("loan1Rate");
  const loan1Min = document.getElementById("loan1Min");

  const loan2Balance = document.getElementById("loan2Balance");
  const loan2Rate = document.getElementById("loan2Rate");
  const loan2Min = document.getElementById("loan2Min");

  const loan3Balance = document.getElementById("loan3Balance");
  const loan3Rate = document.getElementById("loan3Rate");
  const loan3Min = document.getElementById("loan3Min");

  const loan4Balance = document.getElementById("loan4Balance");
  const loan4Rate = document.getElementById("loan4Rate");
  const loan4Min = document.getElementById("loan4Min");

  const loan5Balance = document.getElementById("loan5Balance");
  const loan5Rate = document.getElementById("loan5Rate");
  const loan5Min = document.getElementById("loan5Min");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(extraPayment);
  attachLiveFormatting(maxMonths);

  attachLiveFormatting(loan1Balance);
  attachLiveFormatting(loan1Rate);
  attachLiveFormatting(loan1Min);

  attachLiveFormatting(loan2Balance);
  attachLiveFormatting(loan2Rate);
  attachLiveFormatting(loan2Min);

  attachLiveFormatting(loan3Balance);
  attachLiveFormatting(loan3Rate);
  attachLiveFormatting(loan3Min);

  attachLiveFormatting(loan4Balance);
  attachLiveFormatting(loan4Rate);
  attachLiveFormatting(loan4Min);

  attachLiveFormatting(loan5Balance);
  attachLiveFormatting(loan5Rate);
  attachLiveFormatting(loan5Min);

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

  function money2(n) {
    return formatNumberTwoDecimals(n);
  }

  function buildLoans(rateType) {
    const rows = [
      { b: loan1Balance, r: loan1Rate, m: loan1Min, name: "Loan 1" },
      { b: loan2Balance, r: loan2Rate, m: loan2Min, name: "Loan 2" },
      { b: loan3Balance, r: loan3Rate, m: loan3Min, name: "Loan 3" },
      { b: loan4Balance, r: loan4Rate, m: loan4Min, name: "Loan 4" },
      { b: loan5Balance, r: loan5Rate, m: loan5Min, name: "Loan 5" }
    ];

    const loans = [];
    for (let i = 0; i < rows.length; i++) {
      const bal = toNumber(rows[i].b ? rows[i].b.value : "");
      const rateIn = toNumber(rows[i].r ? rows[i].r.value : "");
      const minPay = toNumber(rows[i].m ? rows[i].m.value : "");

      const allBlank =
        (!rows[i].b || String(rows[i].b.value || "").trim() === "") &&
        (!rows[i].r || String(rows[i].r.value || "").trim() === "") &&
        (!rows[i].m || String(rows[i].m.value || "").trim() === "");

      if (allBlank) continue;

      if (!Number.isFinite(bal) || bal <= 0) {
        setResultError(rows[i].name + ": enter a balance greater than 0.");
        return null;
      }
      if (!Number.isFinite(rateIn) || rateIn < 0) {
        setResultError(rows[i].name + ": enter an interest rate of 0 or higher.");
        return null;
      }
      if (!Number.isFinite(minPay) || minPay < 0) {
        setResultError(rows[i].name + ": enter a minimum payment of 0 or higher.");
        return null;
      }

      const monthlyRate =
        rateType === "monthly" ? rateIn / 100 : (rateIn / 100) / 12;

      loans.push({
        name: rows[i].name,
        balance: bal,
        monthlyRate: monthlyRate,
        aprPercent: rateType === "monthly" ? (monthlyRate * 12 * 100) : rateIn,
        minPayment: minPay
      });
    }

    if (loans.length === 0) {
      setResultError("Enter at least one loan (balance, rate, and minimum payment).");
      return null;
    }

    return loans;
  }

  function cloneLoans(loans) {
    return loans.map(function (x) {
      return {
        name: x.name,
        balance: x.balance,
        monthlyRate: x.monthlyRate,
        aprPercent: x.aprPercent,
        minPayment: x.minPayment
      };
    });
  }

  function sortIndexes(loans, strategy) {
    const idx = loans.map(function (_, i) { return i; });

    if (strategy === "snowball") {
      idx.sort(function (a, b) {
        const da = loans[a].balance;
        const db = loans[b].balance;
        if (da !== db) return da - db;
        return loans[b].monthlyRate - loans[a].monthlyRate;
      });
      return idx;
    }

    // avalanche
    idx.sort(function (a, b) {
      const ra = loans[a].monthlyRate;
      const rb = loans[b].monthlyRate;
      if (ra !== rb) return rb - ra;
      return loans[a].balance - loans[b].balance;
    });
    return idx;
  }

  function sumBalances(loans) {
    let s = 0;
    for (let i = 0; i < loans.length; i++) s += Math.max(0, loans[i].balance);
    return s;
  }

  function sumMinPayments(loans) {
    let s = 0;
    for (let i = 0; i < loans.length; i++) s += Math.max(0, loans[i].minPayment);
    return s;
  }

  function monthInterest(loans) {
    let s = 0;
    for (let i = 0; i < loans.length; i++) {
      if (loans[i].balance > 0) s += loans[i].balance * loans[i].monthlyRate;
    }
    return s;
  }

  function applyRounding(n, roundingMode) {
    if (roundingMode === "cents") {
      return Math.round(n * 100) / 100;
    }
    return n;
  }

  function simulate(loansInput, extra, strategy, maxMonthsLimit, roundingMode) {
    const loans = cloneLoans(loansInput);

    let month = 0;
    let totalInterest = 0;
    let totalPaid = 0;

    // Pre-check: if mins + extra cannot cover first-month interest, warn early.
    const initialInterest = monthInterest(loans);
    const totalMonthlyBudget = sumMinPayments(loans) + extra;

    if (totalMonthlyBudget <= 0) {
      return { error: "Your total monthly payment is 0. Enter minimum payments and/or an extra amount." };
    }

    if (initialInterest > totalMonthlyBudget + 1e-9) {
      return {
        error:
          "Your monthly payments are not enough to cover monthly interest (negative amortization). Increase minimum payments or extra payment."
      };
    }

    const order = sortIndexes(loans, strategy);

    while (month < maxMonthsLimit && sumBalances(loans) > 0.005) {
      month += 1;

      // 1) Accrue interest
      let thisMonthInterest = 0;
      for (let i = 0; i < loans.length; i++) {
        if (loans[i].balance <= 0) continue;
        const interest = loans[i].balance * loans[i].monthlyRate;
        loans[i].balance += interest;
        thisMonthInterest += interest;
      }
      totalInterest += thisMonthInterest;

      // 2) Pay minimums (or remaining balance if smaller)
      let budget = sumMinPayments(loans) + extra;

      // Guard mid-sim: if interest snowballs beyond budget due to zeros, break.
      const afterInterestInterest = monthInterest(loans);
      if (afterInterestInterest > budget + 1e-9) {
        return {
          error:
            "Partway through, your payments fail to cover monthly interest. This usually happens when one or more minimum payments are 0 or very low. Increase payments."
        };
      }

      for (let i = 0; i < loans.length; i++) {
        if (loans[i].balance <= 0) continue;

        const minPay = Math.max(0, loans[i].minPayment);
        if (minPay <= 0) continue;

        const pay = Math.min(loans[i].balance, minPay, budget);
        loans[i].balance -= pay;
        budget -= pay;
        totalPaid += pay;
      }

      // 3) Allocate remaining budget by strategy
      // Recompute order each month to reflect changing balances (especially for snowball).
      const dynamicOrder = sortIndexes(loans, strategy);

      for (let k = 0; k < dynamicOrder.length; k++) {
        if (budget <= 0.000001) break;
        const i = dynamicOrder[k];
        if (loans[i].balance <= 0) continue;

        const pay = Math.min(loans[i].balance, budget);
        loans[i].balance -= pay;
        budget -= pay;
        totalPaid += pay;
      }

      // 4) Rounding (optional)
      totalInterest = applyRounding(totalInterest, roundingMode);
      totalPaid = applyRounding(totalPaid, roundingMode);
    }

    if (sumBalances(loans) > 0.01) {
      return {
        error:
          "Simulation hit the max month limit before payoff. Increase the max months, increase payments, or check inputs."
      };
    }

    return {
      months: month,
      totalInterest: totalInterest,
      totalPaid: totalPaid
    };
  }

  function formatMonthsToYearsMonths(months) {
    const y = Math.floor(months / 12);
    const m = months % 12;
    if (y <= 0) return m + " months";
    if (m === 0) return y + " years";
    return y + " years " + m + " months";
  }

  // ------------------------------------------------------------
  // UI behavior: advanced toggle
  // ------------------------------------------------------------
  if (toggleAdvanced && advancedSection) {
    toggleAdvanced.addEventListener("click", function () {
      const isHidden = advancedSection.classList.contains("hidden");
      if (isHidden) {
        advancedSection.classList.remove("hidden");
      } else {
        advancedSection.classList.add("hidden");
      }
      clearResult();
    });
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      const strategy = strategySelect ? String(strategySelect.value || "avalanche") : "avalanche";
      const extra = toNumber(extraPayment ? extraPayment.value : "");
      const roundingMode = roundingSelect ? String(roundingSelect.value || "none") : "none";
      const rateType = rateTypeSelect ? String(rateTypeSelect.value || "apr") : "apr";
      const maxM = toNumber(maxMonths ? maxMonths.value : "600");

      if (!validateNonNegative(extra, "extra monthly payment")) return;

      if (!Number.isFinite(maxM) || maxM <= 0) {
        setResultError("Enter a valid max months value greater than 0.");
        return;
      }
      const maxMonthsLimit = Math.min(Math.max(Math.floor(maxM), 12), 2400);

      const loans = buildLoans(rateType);
      if (!loans) return;

      const totalBalance = sumBalances(loans);
      const totalMins = sumMinPayments(loans);
      const totalMonthly = totalMins + extra;

      if (totalMonthly <= 0) {
        setResultError("Your total monthly payment is 0. Enter minimum payments and/or an extra amount.");
        return;
      }

      // Run all three scenarios for comparison
      const baseline = simulate(loans, 0, "avalanche", maxMonthsLimit, roundingMode); // min-only, order irrelevant
      if (baseline.error) {
        setResultError(baseline.error);
        return;
      }

      const avalanche = simulate(loans, extra, "avalanche", maxMonthsLimit, roundingMode);
      if (avalanche.error) {
        setResultError(avalanche.error);
        return;
      }

      const snowball = simulate(loans, extra, "snowball", maxMonthsLimit, roundingMode);
      if (snowball.error) {
        setResultError(snowball.error);
        return;
      }

      const primary = strategy === "snowball" ? snowball : avalanche;

      const saveVsMinInterest = Math.max(0, baseline.totalInterest - primary.totalInterest);
      const monthsSaved = Math.max(0, baseline.months - primary.months);

      const cheapest =
        avalanche.totalInterest <= snowball.totalInterest ? "Avalanche" : "Snowball";
      const fastest =
        avalanche.months <= snowball.months ? "Avalanche" : "Snowball";

      const html =
        `
        <div class="result-grid">
          <div class="result-card">
            <p class="result-card-title">Your selected focus: ${strategy === "snowball" ? "Snowball" : "Avalanche"}</p>
            <div class="result-row"><span>Total balance</span><span>${money2(totalBalance)}</span></div>
            <div class="result-row"><span>Minimum payments</span><span>${money2(totalMins)} / month</span></div>
            <div class="result-row"><span>Extra payment</span><span>${money2(extra)} / month</span></div>
            <div class="result-row"><span>Total monthly payment</span><span>${money2(totalMonthly)} / month</span></div>
            <div class="result-row"><span>Estimated payoff time</span><span>${formatMonthsToYearsMonths(primary.months)}</span></div>
            <div class="result-row"><span>Total interest paid</span><span>${money2(primary.totalInterest)}</span></div>
            <div class="result-row"><span>Interest saved vs minimum-only</span><span>${money2(saveVsMinInterest)}</span></div>
            <div class="result-row"><span>Time saved vs minimum-only</span><span>${formatMonthsToYearsMonths(monthsSaved)}</span></div>
            <p class="note">
              Cheapest (lowest interest): <strong>${cheapest}</strong><br />
              Fastest (fewest months): <strong>${fastest}</strong>
            </p>
          </div>

          <div class="result-card">
            <p class="result-card-title">Comparison</p>
            <div class="result-row"><span>Minimum-only payoff</span><span>${formatMonthsToYearsMonths(baseline.months)}</span></div>
            <div class="result-row"><span>Minimum-only interest</span><span>${money2(baseline.totalInterest)}</span></div>

            <div class="small-muted">With your extra payment:</div>

            <div class="result-row"><span>Avalanche payoff</span><span>${formatMonthsToYearsMonths(avalanche.months)}</span></div>
            <div class="result-row"><span>Avalanche interest</span><span>${money2(avalanche.totalInterest)}</span></div>

            <div class="result-row"><span>Snowball payoff</span><span>${formatMonthsToYearsMonths(snowball.months)}</span></div>
            <div class="result-row"><span>Snowball interest</span><span>${money2(snowball.totalInterest)}</span></div>
          </div>
        </div>
      `;

      setResultSuccess(html);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message =
        "Student Loan Repayment Strategy Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
