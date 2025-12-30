document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const rankInput = document.getElementById("rankInput");
  const totalInput = document.getElementById("totalInput");
  const tiesInput = document.getElementById("tiesInput");

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

  attachLiveFormatting(rankInput);
  attachLiveFormatting(totalInput);
  attachLiveFormatting(tiesInput);

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
      // Parse inputs using toNumber() (from /scripts/main.js)
      const rank = toNumber(rankInput ? rankInput.value : "");
      const total = toNumber(totalInput ? totalInput.value : "");
      let ties = toNumber(tiesInput ? tiesInput.value : "");

      // Basic existence guard
      if (!rankInput || !totalInput || !tiesInput) return;

      // Validation
      if (!validatePositive(total, "total students")) return;

      if (!Number.isFinite(rank) || rank <= 0) {
        setResultError("Enter a valid rank (1 or higher).");
        return;
      }

      if (rank > total) {
        setResultError("Rank cannot be greater than the total number of students.");
        return;
      }

      if (!Number.isFinite(ties) || ties <= 0) {
        ties = 1;
      }

      const maxTies = Math.floor(total - rank + 1);
      if (ties > maxTies) {
        setResultError("Ties at your rank cannot exceed " + formatInputWithCommas(String(maxTies)) + " for this class size.");
        return;
      }

      // Calculation logic (rank 1 = best)
      const studentsAbove = Math.floor(rank - 1);
      const studentsBelow = Math.floor(total - (rank + ties - 1));

      const percentAhead = (studentsBelow / total) * 100;

      const topBestCase = (rank / total) * 100;
      const topWorstCase = ((rank + ties - 1) / total) * 100;

      // Build output HTML
      const percentAheadText = formatNumberTwoDecimals(percentAhead);
      const topBestText = formatNumberTwoDecimals(topBestCase);
      const topWorstText = formatNumberTwoDecimals(topWorstCase);

      const studentsAboveText = formatInputWithCommas(String(studentsAbove));
      const studentsBelowText = formatInputWithCommas(String(studentsBelow));
      const totalText = formatInputWithCommas(String(Math.floor(total)));
      const tiesText = formatInputWithCommas(String(Math.floor(ties)));

      let topLine = "";
      if (Math.floor(ties) <= 1) {
        topLine = `<p><strong>Top percentage:</strong> You are in the <strong>top ${topBestText}%</strong> of the group.</p>`;
      } else {
        topLine = `<p><strong>Top percentage (with ties):</strong> You are in the <strong>top ${topBestText}%</strong> to <strong>top ${topWorstText}%</strong> of the group (tie group size: ${tiesText}).</p>`;
      }

      const resultHtml =
        `<p><strong>Percent of students you are ahead of:</strong> ${percentAheadText}%</p>` +
        topLine +
        `<p><strong>Students above you:</strong> ${studentsAboveText} out of ${totalText}</p>` +
        `<p><strong>Students below you:</strong> ${studentsBelowText} out of ${totalText}</p>` +
        `<p><strong>How to read this:</strong> Rank 1 is treated as the best position. “Ahead of” means ranked below you. If your ranking system has ties, use the Advanced option for a more honest top-percentage range.</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Percentile Rank Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
