document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const numbersInput = document.getElementById("numbersInput");
  const showSorted = document.getElementById("showSorted");
  const displayLimit = document.getElementById("displayLimit");

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

  // Attach formatting where it makes sense (limit only)
  attachLiveFormatting(displayLimit);

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

  function safeFormatNumber(value) {
    if (!Number.isFinite(value)) return "";
    const isInt = Math.abs(value - Math.round(value)) < 1e-10;
    if (isInt) return formatInputWithCommas(String(Math.round(value)));
    return formatNumberTwoDecimals(value);
  }

  function parseNumbersFromText(raw) {
    const text = String(raw || "").trim();
    if (!text) return { ok: false, error: "Enter at least one number to calculate the median." };

    // Split on commas, whitespace, semicolons, or pipes. Tabs/newlines are covered by whitespace.
    const parts = text.split(/[\s,;|]+/).filter(Boolean);

    if (parts.length === 0) {
      return { ok: false, error: "Enter at least one number to calculate the median." };
    }

    // Guard against absurdly large pastes
    if (parts.length > 20000) {
      return {
        ok: false,
        error: "That is too many values for a browser-based calculator. Reduce the list to 20,000 numbers or fewer."
      };
    }

    const values = [];
    for (let i = 0; i < parts.length; i++) {
      const token = parts[i];

      // Allow thousands separators inside a token
      const cleaned = token.replace(/,/g, "");

      const num = toNumber(cleaned);
      if (!Number.isFinite(num)) {
        return {
          ok: false,
          error:
            "One of your entries is not a valid number: \"" +
            token +
            "\". Remove symbols/units and keep only numeric values."
        };
      }
      values.push(num);
    }

    return { ok: true, values };
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Input existence guard
      if (!numbersInput || !displayLimit || !showSorted) return;

      const parsed = parseNumbersFromText(numbersInput.value);
      if (!parsed.ok) {
        setResultError(parsed.error);
        return;
      }

      const limitRaw = toNumber(displayLimit.value);
      let limit = 25;
      if (Number.isFinite(limitRaw) && limitRaw > 0) {
        limit = Math.min(Math.floor(limitRaw), 500);
      }

      const numbers = parsed.values.slice().sort(function (a, b) {
        return a - b;
      });

      const n = numbers.length;
      const min = numbers[0];
      const max = numbers[n - 1];

      let sum = 0;
      for (let i = 0; i < n; i++) sum += numbers[i];
      const mean = sum / n;

      let median = 0;
      let medianNote = "";
      if (n % 2 === 1) {
        const midIndex = Math.floor(n / 2);
        median = numbers[midIndex];
        medianNote =
          "Odd count: the median is the single middle value after sorting (position " +
          (midIndex + 1) +
          " of " +
          n +
          ").";
      } else {
        const upperMid = n / 2;
        const lowerMid = upperMid - 1;
        const a = numbers[lowerMid];
        const b = numbers[upperMid];
        median = (a + b) / 2;
        medianNote =
          "Even count: the median is the average of the two middle values (" +
          safeFormatNumber(a) +
          " and " +
          safeFormatNumber(b) +
          ").";
      }

      const showPreview = !!showSorted.checked;
      let previewHtml = "";
      if (showPreview) {
        const shown = numbers.slice(0, limit);
        const remainder = n - shown.length;

        const shownText = shown
          .map(function (v) {
            return safeFormatNumber(v);
          })
          .join(", ");

        previewHtml =
          "<p><strong>Sorted preview:</strong> " +
          shownText +
          (remainder > 0 ? " … (+" + remainder + " more)" : "") +
          "</p>";
      }

      const resultHtml =
        "<p><strong>Median:</strong> " +
        safeFormatNumber(median) +
        "</p>" +
        "<p><strong>Values used:</strong> " +
        formatInputWithCommas(String(n)) +
        "</p>" +
        "<p><strong>Minimum:</strong> " +
        safeFormatNumber(min) +
        " &nbsp; <strong>Maximum:</strong> " +
        safeFormatNumber(max) +
        "</p>" +
        "<p><strong>Mean (average):</strong> " +
        safeFormatNumber(mean) +
        "</p>" +
        "<p><strong>How the median was chosen:</strong> " +
        medianNote +
        "</p>" +
        previewHtml;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Median Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
