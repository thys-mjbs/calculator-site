document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const monthlyIncome = document.getElementById("monthlyIncome");
  const roundingMode = document.getElementById("roundingMode");
  const normalizeToggle = document.getElementById("normalizeToggle");

  const catName1 = document.getElementById("catName1");
  const catName2 = document.getElementById("catName2");
  const catName3 = document.getElementById("catName3");
  const catName4 = document.getElementById("catName4");
  const catName5 = document.getElementById("catName5");
  const catName6 = document.getElementById("catName6");
  const catName7 = document.getElementById("catName7");
  const catName8 = document.getElementById("catName8");
  const catName9 = document.getElementById("catName9");
  const catName10 = document.getElementById("catName10");

  const catPct1 = document.getElementById("catPct1");
  const catPct2 = document.getElementById("catPct2");
  const catPct3 = document.getElementById("catPct3");
  const catPct4 = document.getElementById("catPct4");
  const catPct5 = document.getElementById("catPct5");
  const catPct6 = document.getElementById("catPct6");
  const catPct7 = document.getElementById("catPct7");
  const catPct8 = document.getElementById("catPct8");
  const catPct9 = document.getElementById("catPct9");
  const catPct10 = document.getElementById("catPct10");

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
  attachLiveFormatting(monthlyIncome);

  attachLiveFormatting(catPct1);
  attachLiveFormatting(catPct2);
  attachLiveFormatting(catPct3);
  attachLiveFormatting(catPct4);
  attachLiveFormatting(catPct5);
  attachLiveFormatting(catPct6);
  attachLiveFormatting(catPct7);
  attachLiveFormatting(catPct8);
  attachLiveFormatting(catPct9);
  attachLiveFormatting(catPct10);

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

  function cleanText(text) {
    const t = (text || "").trim();
    return t;
  }

  function roundToNearest(value, nearest) {
    if (!Number.isFinite(value)) return value;
    if (!nearest || nearest <= 0) return value;
    return Math.round(value / nearest) * nearest;
  }

  function formatMoney(value) {
    return formatNumberTwoDecimals(value);
  }

  function safePctDisplay(value) {
    if (!Number.isFinite(value)) return "0%";
    const rounded = Math.round(value * 100) / 100;
    return rounded.toFixed(2) + "%";
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const income = toNumber(monthlyIncome ? monthlyIncome.value : "");
      const rounding = roundingMode ? String(roundingMode.value || "none") : "none";
      const normalize = normalizeToggle ? !!normalizeToggle.checked : false;

      // Basic existence guard
      if (!monthlyIncome || !roundingMode || !normalizeToggle) return;

      // Validation
      if (!validatePositive(income, "monthly income")) return;

      const pairs = [
        { nameEl: catName1, pctEl: catPct1 },
        { nameEl: catName2, pctEl: catPct2 },
        { nameEl: catName3, pctEl: catPct3 },
        { nameEl: catName4, pctEl: catPct4 },
        { nameEl: catName5, pctEl: catPct5 },
        { nameEl: catName6, pctEl: catPct6 },
        { nameEl: catName7, pctEl: catPct7 },
        { nameEl: catName8, pctEl: catPct8 },
        { nameEl: catName9, pctEl: catPct9 },
        { nameEl: catName10, pctEl: catPct10 }
      ];

      const categories = [];
      for (let i = 0; i < pairs.length; i++) {
        const n = cleanText(pairs[i].nameEl ? pairs[i].nameEl.value : "");
        const p = toNumber(pairs[i].pctEl ? pairs[i].pctEl.value : "");

        const hasName = n.length > 0;
        const hasPct = Number.isFinite(p) && p !== 0;

        if (!hasName && !hasPct) continue;

        if (!hasName && hasPct) {
          setResultError("Row " + (i + 1) + ": enter a category name.");
          return;
        }

        if (hasName && (!Number.isFinite(p) || p <= 0)) {
          setResultError("Row " + (i + 1) + ": enter a valid percentage greater than 0.");
          return;
        }

        categories.push({ name: n, pct: p });
      }

      if (categories.length === 0) {
        setResultError("Enter at least one budget category with a percentage.");
        return;
      }

      let pctTotal = 0;
      for (let i = 0; i < categories.length; i++) pctTotal += categories[i].pct;

      if (!Number.isFinite(pctTotal) || pctTotal <= 0) {
        setResultError("Enter valid category percentages greater than 0.");
        return;
      }

      const tolerance = 0.01;
      const isExactly100 = Math.abs(pctTotal - 100) <= tolerance;

      if (!normalize && !isExactly100) {
        setResultError("Your category percentages add up to " + safePctDisplay(pctTotal) + ". They must total 100% (or enable normalization).");
        return;
      }

      // Calculation logic
      const allocations = [];
      const factor = normalize ? (100 / pctTotal) : 1;
      let allocatedSum = 0;

      const nearest = rounding === "none" ? 0 : toNumber(rounding);

      for (let i = 0; i < categories.length; i++) {
        const effectivePct = categories[i].pct * factor;
        let amount = (income * effectivePct) / 100;

        if (nearest && Number.isFinite(nearest) && nearest > 0) {
          amount = roundToNearest(amount, nearest);
        }

        allocatedSum += amount;

        allocations.push({
          name: categories[i].name,
          inputPct: categories[i].pct,
          effectivePct: effectivePct,
          amount: amount
        });
      }

      const difference = income - allocatedSum;
      const absDiff = Math.abs(difference);

      // Build output HTML
      const rowsHtml = allocations
        .map(function (a) {
          return (
            "<tr>" +
              "<td>" + escapeHtml(a.name) + "</td>" +
              "<td>" + safePctDisplay(a.effectivePct) + "</td>" +
              "<td>" + formatMoney(a.amount) + "</td>" +
            "</tr>"
          );
        })
        .join("");

      const pctNote = normalize
        ? "<p class=\"result-muted\">Normalization is ON. Entered total: " + safePctDisplay(pctTotal) + ". Effective percentages were rescaled to 100%.</p>"
        : "<p class=\"result-muted\">Normalization is OFF. Percentages total: " + safePctDisplay(pctTotal) + ".</p>";

      const roundingNote = rounding === "none"
        ? "<p class=\"result-muted\">Rounding: none.</p>"
        : "<p class=\"result-muted\">Rounding: nearest " + escapeHtml(String(nearest)) + ".</p>";

      const diffLine = (absDiff <= 0.01)
        ? "<p><strong>Difference:</strong> " + formatMoney(0) + " (allocated total matches income)</p>"
        : "<p><strong>Difference:</strong> " + formatMoney(difference) + (difference > 0 ? " (unallocated)" : " (over-allocated)") + "</p>";

      const resultHtml =
        "<div class=\"result-summary\">" +
          "<p><strong>Monthly income:</strong> " + formatMoney(income) + "</p>" +
          "<p><strong>Total allocated:</strong> " + formatMoney(allocatedSum) + "</p>" +
          diffLine +
        "</div>" +
        "<table class=\"result-table\" aria-label=\"Budget category allocations\">" +
          "<thead>" +
            "<tr>" +
              "<th>Category</th>" +
              "<th>Effective %</th>" +
              "<th>Monthly amount</th>" +
            "</tr>" +
          "</thead>" +
          "<tbody>" +
            rowsHtml +
          "</tbody>" +
        "</table>" +
        pctNote +
        roundingNote;

      // Output
      setResultSuccess(resultHtml);
    });
  }

  // Small safe HTML escape for category names in table
  function escapeHtml(str) {
    return String(str || "")
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
      const message = "Detailed Budget Category Allocator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
