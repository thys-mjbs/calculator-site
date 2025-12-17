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
  const initialRateInput = document.getElementById("initialRate");
  const termYearsInput = document.getElementById("termYears");
  const fixedYearsInput = document.getElementById("fixedYears");
  const adjFreqYearsInput = document.getElementById("adjFreqYears");
  const indexRateInput = document.getElementById("indexRate");
  const marginInput = document.getElementById("margin");
  const periodicCapInput = document.getElementById("periodicCap");
  const lifetimeCapInput = document.getElementById("lifetimeCap");
  const floorRateInput = document.getElementById("floorRate");

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

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function monthlyPayment(principal, annualRatePct, months) {
    if (!Number.isFinite(principal) || !Number.isFinite(months) || months <= 0) return NaN;
    const r = (annualRatePct / 100) / 12;
    if (!Number.isFinite(r)) return NaN;
    if (r === 0) return principal / months;
    const denom = 1 - Math.pow(1 + r, -months);
    if (denom === 0) return NaN;
    return principal * (r / denom);
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const loanAmount = toNumber(loanAmountInput ? loanAmountInput.value : "");
      const initialRate = toNumber(initialRateInput ? initialRateInput.value : "");
      const termYears = toNumber(termYearsInput ? termYearsInput.value : "");
      const fixedYears = toNumber(fixedYearsInput ? fixedYearsInput.value : "");

      // Optional fields with defaults
      const adjFreqYearsRaw = toNumber(adjFreqYearsInput ? adjFreqYearsInput.value : "");
      const indexRateRaw = toNumber(indexRateInput ? indexRateInput.value : "");
      const marginRaw = toNumber(marginInput ? marginInput.value : "");
      const periodicCapRaw = toNumber(periodicCapInput ? periodicCapInput.value : "");
      const lifetimeCapRaw = toNumber(lifetimeCapInput ? lifetimeCapInput.value : "");
      const floorRateRaw = toNumber(floorRateInput ? floorRateInput.value : "");

      const adjFreqYears = Number.isFinite(adjFreqYearsRaw) && adjFreqYearsRaw > 0 ? adjFreqYearsRaw : 1;
      const indexRate = Number.isFinite(indexRateRaw) && indexRateRaw >= 0 ? indexRateRaw : 3.0;
      const margin = Number.isFinite(marginRaw) && marginRaw >= 0 ? marginRaw : 2.25;
      const periodicCap = Number.isFinite(periodicCapRaw) && periodicCapRaw >= 0 ? periodicCapRaw : 2.0;
      const lifetimeCap = Number.isFinite(lifetimeCapRaw) && lifetimeCapRaw >= 0 ? lifetimeCapRaw : 5.0;
      const floorRate = Number.isFinite(floorRateRaw) && floorRateRaw >= 0 ? floorRateRaw : 0.0;

      // Basic existence guard
      if (!loanAmountInput || !initialRateInput || !termYearsInput || !fixedYearsInput) return;

      // Validation (required)
      if (!validatePositive(loanAmount, "loan amount")) return;
      if (!validatePositive(initialRate, "initial interest rate")) return;
      if (!validatePositive(termYears, "loan term (years)")) return;
      if (!validateNonNegative(fixedYears, "initial fixed period (years)")) return;

      if (termYears > 50) {
        setResultError("Enter a realistic loan term (50 years or less).");
        return;
      }
      if (initialRate > 40) {
        setResultError("Enter a realistic initial interest rate (40% or less).");
        return;
      }
      if (fixedYears >= termYears) {
        setResultError("The initial fixed period must be less than the full loan term.");
        return;
      }
      if (adjFreqYears <= 0) {
        setResultError("Enter a valid adjustment frequency greater than 0.");
        return;
      }

      // Calculation logic
      const totalMonths = Math.round(termYears * 12);
      const fixedMonths = Math.round(fixedYears * 12);
      const adjFreqMonths = Math.max(1, Math.round(adjFreqYears * 12));

      const lifetimeMaxRate = initialRate + lifetimeCap;

      // Initial payment for fixed period (standard amortization over full term)
      let balance = loanAmount;
      let currentRate = initialRate;
      let remainingMonths = totalMonths;

      let payment = monthlyPayment(balance, currentRate, remainingMonths);
      if (!Number.isFinite(payment) || payment <= 0) {
        setResultError("Unable to calculate a payment with these inputs. Check your values and try again.");
        return;
      }

      const initialPayment = payment;

      let totalInterest = 0;
      let maxPayment = payment;
      let firstAdjPayment = null;
      let firstAdjRate = null;

      const adjEvents = [];
      const maxEventsToShow = 6;

      for (let m = 1; m <= totalMonths; m++) {
        // Apply rate adjustment at the start of an adjustment month (after fixed period)
        const isAdjustmentMonth = (m === fixedMonths + 1) || (m > fixedMonths + 1 && ((m - (fixedMonths + 1)) % adjFreqMonths === 0));

        if (m > fixedMonths && isAdjustmentMonth) {
          // Fully indexed target
          let targetRate = indexRate + margin;

          // Apply lifetime cap and floor
          targetRate = clamp(targetRate, floorRate, lifetimeMaxRate);

          // Apply periodic cap relative to current rate
          const minRate = currentRate - periodicCap;
          const maxRateAllowedByPeriodic = currentRate + periodicCap;
          let newRate = clamp(targetRate, minRate, maxRateAllowedByPeriodic);

          // Re-apply hard bounds
          newRate = clamp(newRate, floorRate, lifetimeMaxRate);

          currentRate = newRate;

          // Recalculate payment over remaining term
          remainingMonths = totalMonths - (m - 1);
          payment = monthlyPayment(balance, currentRate, remainingMonths);

          if (!Number.isFinite(payment) || payment <= 0) {
            setResultError("Unable to calculate a future payment with these inputs. Try simplifying optional fields.");
            return;
          }

          if (firstAdjPayment === null) {
            firstAdjPayment = payment;
            firstAdjRate = currentRate;
          }

          if (adjEvents.length < maxEventsToShow) {
            adjEvents.push({
              month: m,
              year: Math.ceil(m / 12),
              rate: currentRate,
              payment: payment
            });
          }
        }

        const r = (currentRate / 100) / 12;
        const interest = balance * r;
        let principal = payment - interest;

        if (principal <= 0) {
          // Payment is not covering interest: not expected with cap/floor inputs but guard anyway
          setResultError("Your inputs produce a payment that does not reduce the balance. Adjust rates/caps and try again.");
          return;
        }

        if (principal > balance) {
          principal = balance;
        }

        totalInterest += interest;
        balance -= principal;

        if (payment > maxPayment) maxPayment = payment;

        if (balance <= 0.00001) {
          balance = 0;
          break;
        }
      }

      if (firstAdjPayment === null) {
        // No adjustment occurs (fixed years ~ term)
        firstAdjPayment = initialPayment;
        firstAdjRate = initialRate;
      }

      // Build output HTML
      const currencyLoan = formatNumberTwoDecimals(loanAmount);
      const currencyInitial = formatNumberTwoDecimals(initialPayment);
      const currencyFirstAdj = formatNumberTwoDecimals(firstAdjPayment);
      const currencyMax = formatNumberTwoDecimals(maxPayment);
      const currencyInterest = formatNumberTwoDecimals(totalInterest);

      let eventsHtml = "";
      if (adjEvents.length > 0) {
        const rows = adjEvents.map(function (e, idx) {
          const label = idx === 0 ? "First adjustment" : ("Adjustment " + (idx + 1));
          return (
            "<tr>" +
              "<td style=\"padding:6px 6px; border-bottom:1px solid #eee;\">" + label + "</td>" +
              "<td style=\"padding:6px 6px; border-bottom:1px solid #eee;\">Year " + e.year + "</td>" +
              "<td style=\"padding:6px 6px; border-bottom:1px solid #eee;\">" + formatNumberTwoDecimals(e.rate) + "%</td>" +
              "<td style=\"padding:6px 6px; border-bottom:1px solid #eee;\">" + formatNumberTwoDecimals(e.payment) + "</td>" +
            "</tr>"
          );
        }).join("");

        eventsHtml =
          "<div style=\"margin-top:10px;\">" +
            "<strong>Projected adjustment snapshots (based on your index and cap inputs):</strong>" +
            "<table style=\"width:100%; border-collapse:collapse; margin-top:8px; font-size:13px;\">" +
              "<thead>" +
                "<tr>" +
                  "<th style=\"text-align:left; padding:6px 6px; border-bottom:1px solid #ddd;\">Event</th>" +
                  "<th style=\"text-align:left; padding:6px 6px; border-bottom:1px solid #ddd;\">Timing</th>" +
                  "<th style=\"text-align:left; padding:6px 6px; border-bottom:1px solid #ddd;\">Rate</th>" +
                  "<th style=\"text-align:left; padding:6px 6px; border-bottom:1px solid #ddd;\">Payment</th>" +
                "</tr>" +
              "</thead>" +
              "<tbody>" + rows + "</tbody>" +
            "</table>" +
            "<div style=\"margin-top:8px; font-size:13px; color:#444;\">" +
              "Note: This is a projection. Real ARM payments depend on future index values and your exact loan terms." +
            "</div>" +
          "</div>";
      }

      const resultHtml =
        "<div>" +
          "<p style=\"margin:0 0 8px;\"><strong>Loan amount:</strong> " + currencyLoan + "</p>" +
          "<p style=\"margin:0 0 8px;\"><strong>Initial rate:</strong> " + formatNumberTwoDecimals(initialRate) + "%</p>" +
          "<p style=\"margin:0 0 8px;\"><strong>Initial monthly payment (P&amp;I):</strong> " + currencyInitial + "</p>" +
          "<p style=\"margin:0 0 8px;\"><strong>Payment after first adjustment (projected):</strong> " + currencyFirstAdj +
            " <span style=\"color:#444;\">(rate: " + formatNumberTwoDecimals(firstAdjRate) + "%)</span></p>" +
          "<p style=\"margin:0 0 8px;\"><strong>Projected maximum monthly payment (under caps):</strong> " + currencyMax + "</p>" +
          "<p style=\"margin:0;\"><strong>Projected total interest (P&amp;I only):</strong> " + currencyInterest + "</p>" +
          "<div style=\"margin-top:10px; font-size:13px; color:#444;\">" +
            "<strong>Assumption used for projection:</strong> Fully indexed rate = index (" + formatNumberTwoDecimals(indexRate) + "%) + margin (" + formatNumberTwoDecimals(margin) + "%), " +
            "with periodic cap (" + formatNumberTwoDecimals(periodicCap) + "%) and lifetime cap (initial + " + formatNumberTwoDecimals(lifetimeCap) + "%), floor (" + formatNumberTwoDecimals(floorRate) + "%)." +
          "</div>" +
          eventsHtml +
        "</div>";

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
      const message = "Adjustable-Rate Mortgage (ARM) Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
