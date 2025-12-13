document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const rowsContainer = document.getElementById("rowsContainer");
  const addRowButton = document.getElementById("addRowButton");
  const rowTemplate = document.getElementById("rowTemplate");

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

  // (Not used: percentage inputs should not be comma-formatted)

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

  // (Not used)

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

  function validatePercent(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      setResultError("Enter a valid " + fieldLabel + " between 0 and 100.");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // Extra: add row behaviour
  // ------------------------------------------------------------
  function getAllRowPairs() {
    if (!rowsContainer) return [];
    const inputs = rowsContainer.querySelectorAll("input[type='text']");
    const pairs = [];
    for (let i = 0; i < inputs.length; i += 2) {
      const scoreEl = inputs[i];
      const weightEl = inputs[i + 1];
      if (scoreEl && weightEl) pairs.push({ scoreEl, weightEl });
    }
    return pairs;
  }

  function relabelRowInputs() {
    // Ensure unique ids for label-for wiring on the initial rows only;
    // dynamically added rows use label wrapping and do not require for/id pairing.
    // We still keep this safe and non-destructive.
    const rows = rowsContainer ? rowsContainer.querySelectorAll(".grade-row") : [];
    let idx = 1;
    rows.forEach(function (row) {
      const inputs = row.querySelectorAll("input[type='text']");
      if (inputs.length >= 2) {
        const scoreEl = inputs[0];
        const weightEl = inputs[1];

        // Only set ids if missing (do not overwrite initial fixed ids)
        if (!scoreEl.id) scoreEl.id = "item" + idx + "ScoreDyn";
        if (!weightEl.id) weightEl.id = "item" + idx + "WeightDyn";

        idx += 1;
      }
    });
  }

  if (addRowButton && rowTemplate && rowsContainer) {
    addRowButton.addEventListener("click", function () {
      const currentRows = rowsContainer.querySelectorAll(".grade-row").length;
      if (currentRows >= 12) {
        setResultError("You can add up to 12 assessments.");
        return;
      }

      const fragment = rowTemplate.content.cloneNode(true);
      rowsContainer.appendChild(fragment);
      relabelRowInputs();
      clearResult();
    });
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const pairs = getAllRowPairs();
      if (!pairs.length) {
        setResultError("Enter at least one assessment score and weight.");
        return;
      }

      let totalWeight = 0;
      let weightedSum = 0;
      let usedRows = 0;

      for (const pair of pairs) {
        const scoreRaw = pair.scoreEl ? pair.scoreEl.value : "";
        const weightRaw = pair.weightEl ? pair.weightEl.value : "";

        const score = toNumber(scoreRaw);
        const weight = toNumber(weightRaw);

        const scoreBlank = !scoreRaw || String(scoreRaw).trim() === "";
        const weightBlank = !weightRaw || String(weightRaw).trim() === "";

        // Ignore fully blank rows
        if (scoreBlank && weightBlank) continue;

        // If partially filled, error
        if (scoreBlank || weightBlank) {
          setResultError("Each used row must include both a score and a weight.");
          return;
        }

        if (!validatePercent(score, "score (%)")) return;
        if (!validatePositive(weight, "weight (%)")) return;

        totalWeight += weight;
        weightedSum += score * weight;
        usedRows += 1;
      }

      if (usedRows === 0) {
        setResultError("Enter at least one assessment score and weight.");
        return;
      }

      if (!Number.isFinite(totalWeight) || totalWeight <= 0) {
        setResultError("Total weight must be greater than 0.");
        return;
      }

      const normalizedGrade = weightedSum / totalWeight;

      let noteHtml = "";
      const diff = totalWeight - 100;

      if (Math.abs(diff) < 0.0001) {
        noteHtml = "<p><strong>Weights:</strong> Your total weight is 100%, so this is your full weighted grade.</p>";
      } else if (totalWeight < 100) {
        noteHtml =
          "<p><strong>Weights:</strong> Your total weight is " +
          formatNumberTwoDecimals(totalWeight) +
          "%. The grade above is normalized to the work you entered (useful for an \"average so far\").</p>";
      } else {
        noteHtml =
          "<p><strong>Weights:</strong> Your total weight is " +
          formatNumberTwoDecimals(totalWeight) +
          "%. This is unusual. Double-check your weights.</p>";
      }

      const resultHtml =
        "<p><strong>Weighted grade:</strong> " +
        formatNumberTwoDecimals(normalizedGrade) +
        "%</p>" +
        "<p><strong>Assessments used:</strong> " +
        usedRows +
        "</p>" +
        noteHtml;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Weighted Grade Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
