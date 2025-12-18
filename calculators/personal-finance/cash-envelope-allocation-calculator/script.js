document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const totalCashInput = document.getElementById("totalCash");
  const bufferCashInput = document.getElementById("bufferCash");

  const modeSelect = document.getElementById("modeSelect");
  const modePercentBlock = document.getElementById("modePercentBlock");
  const modeAmountBlock = document.getElementById("modeAmountBlock");

  // Percent mode (8 envelopes)
  const envName1 = document.getElementById("envName1");
  const envName2 = document.getElementById("envName2");
  const envName3 = document.getElementById("envName3");
  const envName4 = document.getElementById("envName4");
  const envName5 = document.getElementById("envName5");
  const envName6 = document.getElementById("envName6");
  const envName7 = document.getElementById("envName7");
  const envName8 = document.getElementById("envName8");

  const envVal1 = document.getElementById("envVal1");
  const envVal2 = document.getElementById("envVal2");
  const envVal3 = document.getElementById("envVal3");
  const envVal4 = document.getElementById("envVal4");
  const envVal5 = document.getElementById("envVal5");
  const envVal6 = document.getElementById("envVal6");
  const envVal7 = document.getElementById("envVal7");
  const envVal8 = document.getElementById("envVal8");

  // Amount mode (8 envelopes)
  const envName1b = document.getElementById("envName1b");
  const envName2b = document.getElementById("envName2b");
  const envName3b = document.getElementById("envName3b");
  const envName4b = document.getElementById("envName4b");
  const envName5b = document.getElementById("envName5b");
  const envName6b = document.getElementById("envName6b");
  const envName7b = document.getElementById("envName7b");
  const envName8b = document.getElementById("envName8b");

  const envVal1b = document.getElementById("envVal1b");
  const envVal2b = document.getElementById("envVal2b");
  const envVal3b = document.getElementById("envVal3b");
  const envVal4b = document.getElementById("envVal4b");
  const envVal5b = document.getElementById("envVal5b");
  const envVal6b = document.getElementById("envVal6b");
  const envVal7b = document.getElementById("envVal7b");
  const envVal8b = document.getElementById("envVal8b");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Money inputs
  attachLiveFormatting(totalCashInput);
  attachLiveFormatting(bufferCashInput);

  // Percent inputs
  attachLiveFormatting(envVal1);
  attachLiveFormatting(envVal2);
  attachLiveFormatting(envVal3);
  attachLiveFormatting(envVal4);
  attachLiveFormatting(envVal5);
  attachLiveFormatting(envVal6);
  attachLiveFormatting(envVal7);
  attachLiveFormatting(envVal8);

  // Amount inputs
  attachLiveFormatting(envVal1b);
  attachLiveFormatting(envVal2b);
  attachLiveFormatting(envVal3b);
  attachLiveFormatting(envVal4b);
  attachLiveFormatting(envVal5b);
  attachLiveFormatting(envVal6b);
  attachLiveFormatting(envVal7b);
  attachLiveFormatting(envVal8b);

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
    if (modePercentBlock) modePercentBlock.classList.add("hidden");
    if (modeAmountBlock) modeAmountBlock.classList.add("hidden");

    if (mode === "percent") {
      if (modePercentBlock) modePercentBlock.classList.remove("hidden");
    } else if (mode === "amount") {
      if (modeAmountBlock) modeAmountBlock.classList.remove("hidden");
    }

    clearResult();
  }

  if (modeSelect) {
    showMode(modeSelect.value);
    modeSelect.addEventListener("change", function () {
      showMode(modeSelect.value);
    });
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
      const mode = modeSelect ? modeSelect.value : "percent";

      const totalCash = toNumber(totalCashInput ? totalCashInput.value : "");
      const bufferCash = toNumber(bufferCashInput ? bufferCashInput.value : "");

      if (!validatePositive(totalCash, "total cash to allocate")) return;
      if (!validateNonNegative(bufferCash, "buffer")) return;

      if (bufferCash > totalCash) {
        setResultError("Your buffer cannot be greater than your total cash to allocate.");
        return;
      }

      const availableCash = totalCash - bufferCash;

      let rows = [];
      let allocatedTotal = 0;
      let totalPercent = 0;

      if (mode === "percent") {
        const envelopes = [
          { nameEl: envName1, valEl: envVal1 },
          { nameEl: envName2, valEl: envVal2 },
          { nameEl: envName3, valEl: envVal3 },
          { nameEl: envName4, valEl: envVal4 },
          { nameEl: envName5, valEl: envVal5 },
          { nameEl: envName6, valEl: envVal6 },
          { nameEl: envName7, valEl: envVal7 },
          { nameEl: envName8, valEl: envVal8 }
        ];

        for (let i = 0; i < envelopes.length; i++) {
          const labelRaw = envelopes[i].nameEl ? (envelopes[i].nameEl.value || "") : "";
          const label = labelRaw.trim() ? labelRaw.trim() : "Envelope " + (i + 1);

          const pct = toNumber(envelopes[i].valEl ? envelopes[i].valEl.value : "");
          const pctSafe = Number.isFinite(pct) ? pct : 0;

          if (pctSafe < 0) {
            setResultError("Envelope percentages cannot be negative.");
            return;
          }

          totalPercent += pctSafe;

          const amount = (availableCash * pctSafe) / 100;
          const amountSafe = Number.isFinite(amount) ? amount : 0;

          allocatedTotal += amountSafe;

          if (pctSafe > 0 || labelRaw.trim()) {
            rows.push({
              name: label,
              percent: pctSafe,
              amount: amountSafe
            });
          }
        }

        if (rows.length === 0) {
          setResultError("Enter at least one envelope percentage (or name) to generate a breakdown.");
          return;
        }
      } else {
        const envelopes = [
          { nameEl: envName1b, valEl: envVal1b },
          { nameEl: envName2b, valEl: envVal2b },
          { nameEl: envName3b, valEl: envVal3b },
          { nameEl: envName4b, valEl: envVal4b },
          { nameEl: envName5b, valEl: envVal5b },
          { nameEl: envName6b, valEl: envVal6b },
          { nameEl: envName7b, valEl: envVal7b },
          { nameEl: envName8b, valEl: envVal8b }
        ];

        for (let i = 0; i < envelopes.length; i++) {
          const labelRaw = envelopes[i].nameEl ? (envelopes[i].nameEl.value || "") : "";
          const label = labelRaw.trim() ? labelRaw.trim() : "Envelope " + (i + 1);

          const amt = toNumber(envelopes[i].valEl ? envelopes[i].valEl.value : "");
          const amtSafe = Number.isFinite(amt) ? amt : 0;

          if (amtSafe < 0) {
            setResultError("Envelope amounts cannot be negative.");
            return;
          }

          allocatedTotal += amtSafe;

          if (amtSafe > 0 || labelRaw.trim()) {
            rows.push({
              name: label,
              amount: amtSafe
            });
          }
        }

        if (rows.length === 0) {
          setResultError("Enter at least one envelope amount (or name) to generate a breakdown.");
          return;
        }
      }

      const remainingCash = availableCash - allocatedTotal;

      // Build output HTML
      let tableHead = "";
      let tableRows = "";

      if (mode === "percent") {
        tableHead = "<tr><th>Envelope</th><th>Percent</th><th>Amount</th></tr>";
        for (let i = 0; i < rows.length; i++) {
          tableRows +=
            "<tr>" +
            "<td>" + escapeHtml(rows[i].name) + "</td>" +
            "<td>" + formatNumberTwoDecimals(rows[i].percent) + "%</td>" +
            "<td>" + formatNumberTwoDecimals(rows[i].amount) + "</td>" +
            "</tr>";
        }
      } else {
        tableHead = "<tr><th>Envelope</th><th>Amount</th></tr>";
        for (let i = 0; i < rows.length; i++) {
          tableRows +=
            "<tr>" +
            "<td>" + escapeHtml(rows[i].name) + "</td>" +
            "<td>" + formatNumberTwoDecimals(rows[i].amount) + "</td>" +
            "</tr>";
        }
      }

      const remainingLabel = remainingCash >= 0 ? "Remaining (unallocated)" : "Over-allocated (shortfall)";
      const remainingAbs = Math.abs(remainingCash);

      let notes = "";
      if (mode === "percent") {
        const pctDelta = totalPercent - 100;
        if (Math.abs(pctDelta) < 0.000001) {
          notes = "<p><strong>Percent total:</strong> 100.00% (fully allocated)</p>";
        } else if (pctDelta < 0) {
          notes = "<p><strong>Percent total:</strong> " + formatNumberTwoDecimals(totalPercent) + "% (you have " + formatNumberTwoDecimals(Math.abs(pctDelta)) + "% unallocated)</p>";
        } else {
          notes = "<p><strong>Percent total:</strong> " + formatNumberTwoDecimals(totalPercent) + "% (you are over by " + formatNumberTwoDecimals(pctDelta) + "%)</p>";
        }
      }

      const resultHtml =
        "<div class=\"result-kpis\">" +
          "<div><strong>Total cash:</strong> " + formatNumberTwoDecimals(totalCash) + "</div>" +
          "<div><strong>Buffer:</strong> " + formatNumberTwoDecimals(bufferCash) + "</div>" +
          "<div><strong>Available to allocate:</strong> " + formatNumberTwoDecimals(availableCash) + "</div>" +
        "</div>" +
        notes +
        "<table class=\"result-table\" aria-label=\"Envelope allocation breakdown\">" +
          "<thead>" + tableHead + "</thead>" +
          "<tbody>" + tableRows + "</tbody>" +
        "</table>" +
        "<div class=\"result-kpis\">" +
          "<div><strong>Allocated total:</strong> " + formatNumberTwoDecimals(allocatedTotal) + "</div>" +
          "<div><strong>" + remainingLabel + ":</strong> " + formatNumberTwoDecimals(remainingAbs) + "</div>" +
        "</div>" +
        "<p style=\"margin-top:10px;\">Practical tip: If you withdraw cash in whole notes, round each envelope to a convenient note amount and adjust the remaining cash envelope accordingly.</p>";

      setResultSuccess(resultHtml);
    });
  }

  // Small helper to avoid HTML injection in envelope names
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Cash Envelope Allocation Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
