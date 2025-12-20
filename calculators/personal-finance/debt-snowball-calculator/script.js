document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const extraPayment = document.getElementById("extraPayment");

  const d1Name = document.getElementById("d1Name");
  const d1Balance = document.getElementById("d1Balance");
  const d1Apr = document.getElementById("d1Apr");
  const d1Min = document.getElementById("d1Min");

  const d2Name = document.getElementById("d2Name");
  const d2Balance = document.getElementById("d2Balance");
  const d2Apr = document.getElementById("d2Apr");
  const d2Min = document.getElementById("d2Min");

  const d3Name = document.getElementById("d3Name");
  const d3Balance = document.getElementById("d3Balance");
  const d3Apr = document.getElementById("d3Apr");
  const d3Min = document.getElementById("d3Min");

  const d4Name = document.getElementById("d4Name");
  const d4Balance = document.getElementById("d4Balance");
  const d4Apr = document.getElementById("d4Apr");
  const d4Min = document.getElementById("d4Min");

  const d5Name = document.getElementById("d5Name");
  const d5Balance = document.getElementById("d5Balance");
  const d5Apr = document.getElementById("d5Apr");
  const d5Min = document.getElementById("d5Min");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (Not used here)

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Attach formatting where it makes sense
  attachLiveFormatting(extraPayment);

  attachLiveFormatting(d1Balance);
  attachLiveFormatting(d1Apr);
  attachLiveFormatting(d1Min);

  attachLiveFormatting(d2Balance);
  attachLiveFormatting(d2Apr);
  attachLiveFormatting(d2Min);

  attachLiveFormatting(d3Balance);
  attachLiveFormatting(d3Apr);
  attachLiveFormatting(d3Min);

  attachLiveFormatting(d4Balance);
  attachLiveFormatting(d4Apr);
  attachLiveFormatting(d4Min);

  attachLiveFormatting(d5Balance);
  attachLiveFormatting(d5Apr);
  attachLiveFormatting(d5Min);

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
    // Not used
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

  function sanitizeApr(aprPercent) {
    if (!Number.isFinite(aprPercent) || aprPercent < 0) return 0;
    if (aprPercent > 100) return 100;
    return aprPercent;
  }

  function safeName(raw, fallback) {
    const v = (raw || "").trim();
    return v.length ? v : fallback;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // No modes
      // const mode = "default";

      // Parse inputs
      const extra = toNumber(extraPayment ? extraPayment.value : "");

      const debtsRaw = [
        {
          name: safeName(d1Name ? d1Name.value : "", "Debt 1"),
          balance: toNumber(d1Balance ? d1Balance.value : ""),
          apr: sanitizeApr(toNumber(d1Apr ? d1Apr.value : "")),
          minPay: toNumber(d1Min ? d1Min.value : "")
        },
        {
          name: safeName(d2Name ? d2Name.value : "", "Debt 2"),
          balance: toNumber(d2Balance ? d2Balance.value : ""),
          apr: sanitizeApr(toNumber(d2Apr ? d2Apr.value : "")),
          minPay: toNumber(d2Min ? d2Min.value : "")
        },
        {
          name: safeName(d3Name ? d3Name.value : "", "Debt 3"),
          balance: toNumber(d3Balance ? d3Balance.value : ""),
          apr: sanitizeApr(toNumber(d3Apr ? d3Apr.value : "")),
          minPay: toNumber(d3Min ? d3Min.value : "")
        },
        {
          name: safeName(d4Name ? d4Name.value : "", "Debt 4"),
          balance: toNumber(d4Balance ? d4Balance.value : ""),
          apr: sanitizeApr(toNumber(d4Apr ? d4Apr.value : "")),
          minPay: toNumber(d4Min ? d4Min.value : "")
        },
        {
          name: safeName(d5Name ? d5Name.value : "", "Debt 5"),
          balance: toNumber(d5Balance ? d5Balance.value : ""),
          apr: sanitizeApr(toNumber(d5Apr ? d5Apr.value : "")),
          minPay: toNumber(d5Min ? d5Min.value : "")
        }
      ];

      // Existence guard
      if (!resultDiv) return;

      // Validation
      if (!validateNonNegative(extra, "extra payment per month")) return;

      const debts = debtsRaw
        .filter(function (d) {
          return Number.isFinite(d.balance) && d.balance > 0;
        })
        .map(function (d, idx) {
          const bal = d.balance;
          const minp = d.minPay;

          return {
            id: idx + 1,
            name: d.name,
            balance: bal,
            apr: d.apr,
            minPay: Number.isFinite(minp) && minp > 0 ? minp : 0
          };
        });

      if (debts.length === 0) {
        setResultError("Enter at least one debt balance greater than 0.");
        return;
      }

      const anyMissingMin = debts.some(function (d) {
        return !Number.isFinite(d.minPay) || d.minPay <= 0;
      });
      if (anyMissingMin) {
        setResultError("Enter a minimum monthly payment greater than 0 for each debt you include.");
        return;
      }

      const totalMin = debts.reduce(function (sum, d) {
        return sum + d.minPay;
      }, 0);

      if (totalMin + extra <= 0) {
        setResultError("Enter a total monthly payment greater than 0 (minimums plus any extra).");
        return;
      }

      // Basic feasibility check: minimum payment should at least cover monthly interest for each debt (roughly)
      const likelyNegativeAmort = debts.some(function (d) {
        const monthlyRate = (d.apr / 100) / 12;
        const interest = d.balance * monthlyRate;
        return d.apr > 0 && d.minPay <= interest;
      });

      // Calculation logic: snowball simulation
      const simDebts = debts.map(function (d) {
        return {
          name: d.name,
          balance: d.balance,
          apr: d.apr,
          minPay: d.minPay,
          paidOffMonth: null
        };
      });

      const payoffOrder = [];
      const timelinePreview = [];

      let months = 0;
      let totalInterest = 0;
      let baseExtra = extra;
      let rolloverExtra = 0;

      function totalBalanceNow() {
        return simDebts.reduce(function (sum, d) {
          return sum + (d.balance > 0 ? d.balance : 0);
        }, 0);
      }

      function activeDebts() {
        return simDebts.filter(function (d) {
          return d.balance > 0.0000001;
        });
      }

      function pickSnowballTarget() {
        const act = activeDebts();
        if (act.length === 0) return null;
        act.sort(function (a, b) {
          if (a.balance !== b.balance) return a.balance - b.balance;
          return (a.apr - b.apr);
        });
        return act[0];
      }

      const MAX_MONTHS = 1200;

      while (activeDebts().length > 0 && months < MAX_MONTHS) {
        months += 1;

        // Accrue interest first
        let monthInterest = 0;
        activeDebts().forEach(function (d) {
          const monthlyRate = (d.apr / 100) / 12;
          const interest = d.balance * monthlyRate;
          d.balance += interest;
          monthInterest += interest;
        });
        totalInterest += monthInterest;

        // Pay minimums on all active debts
        let monthPayment = 0;
        activeDebts().forEach(function (d) {
          const pay = Math.min(d.minPay, d.balance);
          d.balance -= pay;
          monthPayment += pay;
        });

        // Extra payment goes to snowball target
        let extraThisMonth = baseExtra + rolloverExtra;
        let target = pickSnowballTarget();

        while (extraThisMonth > 0.0000001 && target) {
          const payExtra = Math.min(extraThisMonth, target.balance);
          target.balance -= payExtra;
          monthPayment += payExtra;
          extraThisMonth -= payExtra;

          // If target got paid off, mark and roll its min payment into rollover for future months
          if (target.balance <= 0.0000001) {
            target.balance = 0;

            if (target.paidOffMonth === null) {
              target.paidOffMonth = months;
              payoffOrder.push({
                name: target.name,
                month: months
              });
              rolloverExtra += target.minPay;
            }

            target = pickSnowballTarget();
          } else {
            break;
          }
        }

        // Catch any debts paid off by minimum payments (rare but possible)
        simDebts.forEach(function (d) {
          if (d.balance <= 0.0000001 && d.paidOffMonth === null) {
            d.balance = 0;
            d.paidOffMonth = months;
            payoffOrder.push({
              name: d.name,
              month: months
            });
            rolloverExtra += d.minPay;
          }
        });

        // Timeline preview (first 12 months only)
        if (months <= 12) {
          const paidOffNames = payoffOrder
            .filter(function (x) { return x.month === months; })
            .map(function (x) { return x.name; });

          timelinePreview.push({
            month: months,
            payment: monthPayment,
            interest: monthInterest,
            remaining: totalBalanceNow(),
            paidOff: paidOffNames.length ? paidOffNames.join(", ") : "—"
          });
        }
      }

      if (months >= MAX_MONTHS && activeDebts().length > 0) {
        setResultError("This plan did not reach payoff within " + MAX_MONTHS + " months. Check that your minimum payments exceed monthly interest, or increase your extra payment.");
        return;
      }

      const startingBalance = debts.reduce(function (sum, d) {
        return sum + d.balance;
      }, 0);

      const totalPaid = (startingBalance + totalInterest);

      const years = Math.floor(months / 12);
      const remMonths = months % 12;

      function formatMonths(m) {
        const y = Math.floor(m / 12);
        const r = m % 12;
        if (y === 0) return r + " month" + (r === 1 ? "" : "s");
        if (r === 0) return y + " year" + (y === 1 ? "" : "s");
        return y + " year" + (y === 1 ? "" : "s") + " " + r + " month" + (r === 1 ? "" : "s");
      }

      // Build payoff order list HTML
      const payoffListHtml = payoffOrder
        .sort(function (a, b) { return a.month - b.month; })
        .map(function (x, idx) {
          return "<li><strong>" + (idx + 1) + ".</strong> " + x.name + " — paid off in month " + x.month + " (" + formatMonths(x.month) + ")</li>";
        })
        .join("");

      // Build 12-month preview table
      const previewRows = timelinePreview.map(function (r) {
        return (
          "<tr>" +
            "<td>" + r.month + "</td>" +
            "<td>" + formatNumberTwoDecimals(r.payment) + "</td>" +
            "<td>" + formatNumberTwoDecimals(r.interest) + "</td>" +
            "<td>" + formatNumberTwoDecimals(r.remaining) + "</td>" +
            "<td>" + r.paidOff + "</td>" +
          "</tr>"
        );
      }).join("");

      const warningHtml = likelyNegativeAmort
        ? '<p class="muted small"><strong>Note:</strong> One or more debts have a minimum payment that may not cover monthly interest. Payoff estimates may be unrealistic unless you increase payments or the lender minimum changes.</p>'
        : "";

      const timeText = years === 0
        ? (months + " month" + (months === 1 ? "" : "s"))
        : (years + " year" + (years === 1 ? "" : "s") + (remMonths ? (" " + remMonths + " month" + (remMonths === 1 ? "" : "s")) : ""));

      const resultHtml =
        "<p><strong>Estimated time to become debt-free:</strong> " + timeText + "</p>" +
        "<p><strong>Starting total debt:</strong> " + formatNumberTwoDecimals(startingBalance) + "</p>" +
        "<p><strong>Estimated total interest paid:</strong> " + formatNumberTwoDecimals(totalInterest) + "</p>" +
        "<p><strong>Estimated total paid (principal + interest):</strong> " + formatNumberTwoDecimals(totalPaid) + "</p>" +
        "<p class=\"muted small\">Assumes monthly interest, minimum payments on all active debts, and all extra money directed to the smallest balance first. When a debt is paid off, its minimum payment is rolled into the snowball.</p>" +
        warningHtml +
        "<h3 class=\"small\" style=\"margin:12px 0 6px;\">Payoff order (snowball)</h3>" +
        "<ul style=\"margin:0 0 10px 18px;\">" + payoffListHtml + "</ul>" +
        "<h3 class=\"small\" style=\"margin:12px 0 6px;\">First 12 months preview</h3>" +
        "<div class=\"result-table-wrap\" role=\"region\" aria-label=\"Debt snowball timeline preview\" tabindex=\"0\">" +
          "<table class=\"result-table\">" +
            "<thead>" +
              "<tr>" +
                "<th>Month</th>" +
                "<th>Total payment</th>" +
                "<th>Interest</th>" +
                "<th>Remaining balance</th>" +
                "<th>Paid off</th>" +
              "</tr>" +
            "</thead>" +
            "<tbody>" +
              previewRows +
            "</tbody>" +
          "</table>" +
        "</div>";

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Debt Snowball Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
