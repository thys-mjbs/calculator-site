document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS
  // ------------------------------------------------------------

  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Diagnostic-specific bindings
  const incomeSlider = document.getElementById("incomeSlider");
  const essentialsSlider = document.getElementById("essentialsSlider");
  const incomeSwingSlider = document.getElementById("incomeSwingSlider");
  const hiddenEssentialsSlider = document.getElementById("hiddenEssentialsSlider");

  const incomeValue = document.getElementById("incomeValue");
  const essentialsValue = document.getElementById("essentialsValue");
  const incomeSwingValue = document.getElementById("incomeSwingValue");
  const hiddenEssentialsValue = document.getElementById("hiddenEssentialsValue");

  // ------------------------------------------------------------
  // 2) RESULT HELPERS (CONSISTENT)
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
  // 3) DISPLAY HELPERS
  // ------------------------------------------------------------
  function formatCurrencyApprox(n) {
    if (!Number.isFinite(n)) return "0";
    return formatNumberTwoDecimals(n);
  }

  function readNumberFromRange(rangeEl) {
    if (!rangeEl) return NaN;
    const v = Number(rangeEl.value);
    return Number.isFinite(v) ? v : NaN;
  }

  function updateLiveValues() {
    const income = readNumberFromRange(incomeSlider);
    const essentials = readNumberFromRange(essentialsSlider);
    const swing = readNumberFromRange(incomeSwingSlider);
    const hidden = readNumberFromRange(hiddenEssentialsSlider);

    if (incomeValue) incomeValue.textContent = formatCurrencyApprox(income);
    if (essentialsValue) essentialsValue.textContent = formatCurrencyApprox(essentials);
    if (incomeSwingValue) incomeSwingValue.textContent = String(swing) + "%";
    if (hiddenEssentialsValue) hiddenEssentialsValue.textContent = String(hidden) + "%";
  }

  // Init live display and attach listeners
  updateLiveValues();

  [incomeSlider, essentialsSlider, incomeSwingSlider, hiddenEssentialsSlider].forEach(
    function (el) {
      if (!el) return;
      el.addEventListener("input", function () {
        updateLiveValues();
        clearResult();
      });
    }
  );

  // ------------------------------------------------------------
  // 4) MAIN CALCULATE HANDLER
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const income = readNumberFromRange(incomeSlider);
      const essentials = readNumberFromRange(essentialsSlider);
      const swingPct = readNumberFromRange(incomeSwingSlider);
      const hiddenPct = readNumberFromRange(hiddenEssentialsSlider);

      if (!Number.isFinite(income) || income < 0) {
        setResultError("Enter a valid monthly income (0 or higher).");
        return;
      }

      if (!Number.isFinite(essentials) || essentials <= 0) {
        setResultError("Enter valid essential expenses greater than 0.");
        return;
      }

      if (!Number.isFinite(swingPct) || swingPct < 0 || swingPct > 30) {
        setResultError("Income variability haircut must be between 0% and 30%.");
        return;
      }

      if (!Number.isFinite(hiddenPct) || hiddenPct < 0 || hiddenPct > 20) {
        setResultError("Hidden essentials uplift must be between 0% and 20%.");
        return;
      }

      const incomeAdj = income * (1 - swingPct / 100);
      const essentialsAdj = essentials * (1 + hiddenPct / 100);

      const ratio = essentialsAdj === 0 ? Infinity : incomeAdj / essentialsAdj;

      let band = "Stable";
      let bandNote = "Your conservative income covers essentials with some margin.";
      let action1 = "";
      let action2 = "";

      if (ratio < 1.0) {
        band = "Underprepared";
        bandNote = "Your conservative income does not reliably cover core expenses.";
      } else if (ratio < 1.15) {
        band = "Borderline";
        bandNote = "Your essentials are covered, but the cushion is thin.";
      }

      // Minimum correction targets (kept minimal, used only for actions)
      const needTo100Income = Math.max(0, essentialsAdj - incomeAdj);
      const needTo115Income = Math.max(0, essentialsAdj * 1.15 - incomeAdj);

      if (band === "Underprepared") {
        action1 =
          "Close the baseline gap: increase monthly income by " +
          formatCurrencyApprox(needTo100Income) +
          " or cut essentials by the same amount until you reach 1.00x.";
        action2 =
          "Freeze new discretionary commitments until you reach at least 1.10x coverage (small shocks stop becoming debt).";
      } else if (band === "Borderline") {
        action1 =
          "Build margin: target an extra " +
          formatCurrencyApprox(needTo115Income) +
          " per month (income up or essentials down) to reach 1.15x.";
        action2 =
          "Pick two essentials to renegotiate this week (housing, transport, insurance, utilities) and lock savings as defaults.";
      } else {
        action1 =
          "Formalise your cushion: set an automatic monthly transfer tied to your margin so lifestyle creep does not eat it.";
        action2 =
          "Run a quarterly essentials audit: if essentials rise faster than income, your stability will silently decay.";
      }

      const ratioRounded = Math.round(ratio * 100) / 100;

      const resultHtml =
        "<p><strong>Result:</strong> " +
        band +
        " (" +
        ratioRounded +
        "x essential coverage)</p>" +
        "<p>" +
        bandNote +
        "</p>" +
        "<p><strong>Do this now:</strong></p>" +
        "<ul>" +
        "<li>" +
        action1 +
        "</li>" +
        "<li>" +
        action2 +
        "</li>" +
        "</ul>";

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 5) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Income vs Essential Expenses Diagnostic - check this tool: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
