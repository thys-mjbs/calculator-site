document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const scoresInput = document.getElementById("scoresInput");
  const scoreScaleInput = document.getElementById("scoreScaleInput");
  const targetAverageInput = document.getElementById("targetAverageInput");
  const nextTestWeightInput = document.getElementById("nextTestWeightInput");
  const nextScoreKnownInput = document.getElementById("nextScoreKnownInput");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (Not used for this calculator)

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
  attachLiveFormatting(scoreScaleInput);
  attachLiveFormatting(targetAverageInput);
  attachLiveFormatting(nextTestWeightInput);
  attachLiveFormatting(nextScoreKnownInput);

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
  function parseScoresList(raw) {
    const cleaned = (raw || "").trim();
    if (!cleaned) return [];

    const tokens = cleaned
      .split(/[\s,;]+/g)
      .map(function (t) {
        return (t || "").trim();
      })
      .filter(function (t) {
        return t.length > 0;
      });

    const scores = [];
    for (let i = 0; i < tokens.length; i++) {
      const n = toNumber(tokens[i]);
      if (Number.isFinite(n)) scores.push(n);
    }
    return scores;
  }

  function roundTwo(n) {
    return Math.round(n * 100) / 100;
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const scoresRaw = scoresInput ? scoresInput.value : "";
      const scores = parseScoresList(scoresRaw);

      const scoreScale = toNumber(scoreScaleInput ? scoreScaleInput.value : "");
      const targetAvg = toNumber(targetAverageInput ? targetAverageInput.value : "");
      const nextWeightRaw = toNumber(nextTestWeightInput ? nextTestWeightInput.value : "");
      const nextKnown = toNumber(nextScoreKnownInput ? nextScoreKnownInput.value : "");

      // Guards
      if (!scoresInput || !scoreScaleInput) return;

      if (!validatePositive(scoreScale, "score scale")) return;

      if (!scores.length) {
        setResultError("Enter at least one completed test score.");
        return;
      }

      // Validate scores within 0..scale
      for (let i = 0; i < scores.length; i++) {
        const s = scores[i];
        if (!validateNonNegative(s, "test score")) return;
        if (s > scoreScale) {
          setResultError("A score in your list is higher than your score scale. Fix the score list or increase the scale.");
          return;
        }
      }

      const nextWeight = Number.isFinite(nextWeightRaw) && nextWeightRaw > 0 ? nextWeightRaw : 1;

      // Basic stats
      const count = scores.length;
      let sum = 0;
      let min = scores[0];
      let max = scores[0];

      for (let i = 0; i < scores.length; i++) {
        sum += scores[i];
        if (scores[i] < min) min = scores[i];
        if (scores[i] > max) max = scores[i];
      }

      const currentAverage = sum / count;

      // Needed next score for target (optional)
      let neededHtml = "";
      if (Number.isFinite(targetAvg) && targetAvg > 0) {
        if (targetAvg > scoreScale) {
          setResultError("Your target average cannot be higher than the score scale.");
          return;
        }

        // Weighted mean model:
        // current sum represents count "units"
        // next test adds nextWeight units
        // targetAvg = (sum + nextScore * nextWeight) / (count + nextWeight)
        const needed = ((targetAvg * (count + nextWeight)) - sum) / nextWeight;

        if (!Number.isFinite(needed)) {
          setResultError("Enter a valid target average.");
          return;
        }

        const neededRounded = roundTwo(needed);

        if (neededRounded < 0) {
          neededHtml =
            `<p><strong>Needed next test score to reach target:</strong> 0.00 (or higher)</p>` +
            `<p>Your target average is already achievable even with a very low next score, based on the inputs provided.</p>`;
        } else if (neededRounded > scoreScale) {
          neededHtml =
            `<p><strong>Needed next test score to reach target:</strong> ${formatNumberTwoDecimals(neededRounded)} out of ${formatNumberTwoDecimals(scoreScale)}</p>` +
            `<p><strong>Reality check:</strong> That is above the maximum score, so the target average cannot be reached with just the next test under these assumptions.</p>`;
        } else {
          neededHtml =
            `<p><strong>Needed next test score to reach target:</strong> ${formatNumberTwoDecimals(neededRounded)} out of ${formatNumberTwoDecimals(scoreScale)}</p>` +
            `<p>This assumes the next test counts as weight ${formatNumberTwoDecimals(nextWeight)} compared to your past tests.</p>`;
        }
      }

      // Projected average if next score is known (optional)
      let projectedHtml = "";
      if (Number.isFinite(nextKnown) && nextScoreKnownInput && (nextScoreKnownInput.value || "").trim() !== "") {
        if (!validateNonNegative(nextKnown, "next test score")) return;
        if (nextKnown > scoreScale) {
          setResultError("Your next test score cannot be higher than the score scale.");
          return;
        }

        const projected = (sum + (nextKnown * nextWeight)) / (count + nextWeight);
        projectedHtml =
          `<p><strong>Projected average after next test:</strong> ${formatNumberTwoDecimals(projected)} out of ${formatNumberTwoDecimals(scoreScale)}</p>`;
      }

      const percentCurrent = (currentAverage / scoreScale) * 100;

      const resultHtml =
        `<p><strong>Current average:</strong> ${formatNumberTwoDecimals(currentAverage)} out of ${formatNumberTwoDecimals(scoreScale)} (${formatNumberTwoDecimals(percentCurrent)}%)</p>` +
        `<p><strong>Tests counted:</strong> ${count}</p>` +
        `<p><strong>Highest / lowest:</strong> ${formatNumberTwoDecimals(max)} / ${formatNumberTwoDecimals(min)}</p>` +
        (neededHtml ? `<hr>${neededHtml}` : "") +
        (projectedHtml ? `<hr>${projectedHtml}` : "");

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Test Average Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
