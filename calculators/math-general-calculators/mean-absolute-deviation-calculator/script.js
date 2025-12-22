document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const dataValuesInput = document.getElementById("dataValues");
  const showDetailsInput = document.getElementById("showDetails");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Not used here: the input is a list of values, and commas are separators.
  // attachLiveFormatting(dataValuesInput);

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

  function parseNumberList(raw) {
    const cleaned = String(raw || "").trim();
    if (!cleaned) return [];

    // Treat commas, spaces, and new lines as separators.
    // IMPORTANT: This means "1,000" will be split, so users should enter "1000".
    const tokens = cleaned
      .replace(/\n/g, " ")
      .split(/[,\s]+/)
      .map(function (t) {
        return t.trim();
      })
      .filter(function (t) {
        return t.length > 0;
      });

    const values = [];
    for (let i = 0; i < tokens.length; i++) {
      const n = toNumber(tokens[i]);
      if (!Number.isFinite(n)) {
        return null;
      }
      values.push(n);
    }
    return values;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      if (!dataValuesInput) return;

      const values = parseNumberList(dataValuesInput.value);

      // Validation
      if (values === null) {
        setResultError("Enter only numbers separated by spaces, commas, or new lines.");
        return;
      }

      if (!Array.isArray(values) || values.length < 2) {
        setResultError("Enter at least two numbers to calculate mean absolute deviation.");
        return;
      }

      // Calculation logic (MAD around the mean)
      let sum = 0;
      for (let i = 0; i < values.length; i++) sum += values[i];

      const n = values.length;
      const mean = sum / n;

      const absDeviations = [];
      let sumAbs = 0;
      for (let i = 0; i < values.length; i++) {
        const dev = Math.abs(values[i] - mean);
        absDeviations.push(dev);
        sumAbs += dev;
      }

      const mad = sumAbs / n;

      let relativeMadPercent = null;
      if (Number.isFinite(mean) && mean !== 0) {
        relativeMadPercent = (mad / Math.abs(mean)) * 100;
      }

      const showDetails = !!(showDetailsInput && showDetailsInput.checked);

      // Build output HTML
      const meanFmt = formatNumberTwoDecimals(mean);
      const madFmt = formatNumberTwoDecimals(mad);
      const sumAbsFmt = formatNumberTwoDecimals(sumAbs);

      let relativeLine = "";
      if (relativeMadPercent !== null && Number.isFinite(relativeMadPercent)) {
        relativeLine =
          "<p><strong>Relative MAD:</strong> " +
          formatNumberTwoDecimals(relativeMadPercent) +
          "% (MAD as a share of the mean magnitude)</p>";
      } else {
        relativeLine =
          "<p><strong>Relative MAD:</strong> Not shown because the mean is 0.</p>";
      }

      let detailsHtml = "";
      if (showDetails) {
        const maxRows = 50;
        const rows = Math.min(values.length, maxRows);

        let listItems = "";
        for (let i = 0; i < rows; i++) {
          const v = formatNumberTwoDecimals(values[i]);
          const d = formatNumberTwoDecimals(absDeviations[i]);
          listItems += "<li><strong>" + v + "</strong> → |" + v + " − " + meanFmt + "| = <strong>" + d + "</strong></li>";
        }

        let truncatedNote = "";
        if (values.length > maxRows) {
          truncatedNote =
            "<p><em>Showing the first " + maxRows + " values only.</em></p>";
        }

        detailsHtml =
          '<div class="mad-details">' +
          "<p><strong>Deviation breakdown (absolute deviations from the mean):</strong></p>" +
          truncatedNote +
          "<ul>" +
          listItems +
          "</ul>" +
          "</div>";
      }

      const resultHtml =
        "<p><strong>Mean:</strong> " +
        meanFmt +
        "</p>" +
        "<p><strong>Mean absolute deviation (MAD):</strong> " +
        madFmt +
        "</p>" +
        "<p><strong>Count of values:</strong> " +
        n +
        "</p>" +
        "<p><strong>Sum of absolute deviations:</strong> " +
        sumAbsFmt +
        "</p>" +
        relativeLine +
        detailsHtml;

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
      const message = "Mean Absolute Deviation Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
