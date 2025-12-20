document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const q1 = document.getElementById("q1");
  const q2 = document.getElementById("q2");
  const q3 = document.getElementById("q3");
  const q4 = document.getElementById("q4");
  const q5 = document.getElementById("q5");
  const q6 = document.getElementById("q6");
  const q7 = document.getElementById("q7");
  const q8 = document.getElementById("q8");
  const horizonYears = document.getElementById("horizonYears");
  const emergencyMonths = document.getElementById("emergencyMonths");

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
  attachLiveFormatting(horizonYears);
  attachLiveFormatting(emergencyMonths);

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

  function validateSelect(selectEl, fieldLabel) {
    if (!selectEl) return false;
    const val = (selectEl.value || "").trim();
    if (!val) {
      setResultError("Please answer: " + fieldLabel);
      return false;
    }
    const num = toNumber(val);
    if (!Number.isFinite(num) || num <= 0) {
      setResultError("Please choose a valid option for: " + fieldLabel);
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Basic existence guard
      if (!q1 || !q2 || !q3 || !q4 || !q5 || !q6 || !q7 || !q8) return;

      // Validation (required questionnaire)
      if (!validateSelect(q1, "Question 1")) return;
      if (!validateSelect(q2, "Question 2")) return;
      if (!validateSelect(q3, "Question 3")) return;
      if (!validateSelect(q4, "Question 4")) return;
      if (!validateSelect(q5, "Question 5")) return;
      if (!validateSelect(q6, "Question 6")) return;
      if (!validateSelect(q7, "Question 7")) return;
      if (!validateSelect(q8, "Question 8")) return;

      // Parse required inputs
      const s1 = toNumber(q1.value);
      const s2 = toNumber(q2.value);
      const s3 = toNumber(q3.value);
      const s4 = toNumber(q4.value);
      const s5 = toNumber(q5.value);
      const s6 = toNumber(q6.value);
      const s7 = toNumber(q7.value);
      const s8 = toNumber(q8.value);

      // Optional inputs
      const horizonRaw = horizonYears ? horizonYears.value : "";
      const emergencyRaw = emergencyMonths ? emergencyMonths.value : "";
      const horizon = horizonRaw && horizonRaw.trim() !== "" ? toNumber(horizonRaw) : null;
      const emergency = emergencyRaw && emergencyRaw.trim() !== "" ? toNumber(emergencyRaw) : null;

      if (horizon !== null && !validateNonNegative(horizon, "investment horizon (years)")) return;
      if (emergency !== null && !validateNonNegative(emergency, "emergency fund months")) return;

      // Calculation logic
      // Base score: 8 questions, each 1–5 => total 8–40
      const total = s1 + s2 + s3 + s4 + s5 + s6 + s7 + s8;
      const maxTotal = 40;
      let score = (total / maxTotal) * 100;

      // Adjustments (small, realistic nudges)
      // If horizonYears is provided, use it. Otherwise infer from Q3 bucket.
      let horizonAdj = 0;
      if (horizon !== null) {
        if (horizon < 2) horizonAdj = -10;
        else if (horizon <= 5) horizonAdj = -5;
        else if (horizon <= 10) horizonAdj = 0;
        else if (horizon <= 20) horizonAdj = 3;
        else horizonAdj = 5;
      } else {
        // Q3 mapping: 1..5 (short to long)
        if (s3 === 1) horizonAdj = -10;
        else if (s3 === 2) horizonAdj = -5;
        else if (s3 === 3) horizonAdj = 0;
        else if (s3 === 4) horizonAdj = 3;
        else if (s3 === 5) horizonAdj = 5;
      }

      let liquidityAdj = 0;
      if (emergency !== null) {
        if (emergency < 1) liquidityAdj = -8;
        else if (emergency < 3) liquidityAdj = -5;
        else if (emergency < 6) liquidityAdj = -2;
        else liquidityAdj = 0;
      }

      let adjustedScore = score + horizonAdj + liquidityAdj;
      if (adjustedScore < 0) adjustedScore = 0;
      if (adjustedScore > 100) adjustedScore = 100;

      // Profile bands
      let profile = "";
      let profileSummary = "";
      let allocation = "";

      if (adjustedScore < 25) {
        profile = "Conservative";
        profileSummary = "You likely prefer stability and lower drawdowns, even if long-term returns are lower. Large short-term losses can cause stress or trigger selling.";
        allocation = "Typical mix (illustrative): 70–90% defensive (cash/bonds) and 10–30% growth (equities).";
      } else if (adjustedScore < 45) {
        profile = "Moderately Conservative";
        profileSummary = "You can accept some volatility, but large swings may still feel uncomfortable. You may prefer smoother returns and clearer downside limits.";
        allocation = "Typical mix (illustrative): 50–70% defensive and 30–50% growth.";
      } else if (adjustedScore < 65) {
        profile = "Balanced";
        profileSummary = "You can tolerate normal market ups and downs and are usually able to stay invested through declines, especially with a clear plan.";
        allocation = "Typical mix (illustrative): 35–55% defensive and 45–65% growth.";
      } else if (adjustedScore < 80) {
        profile = "Growth";
        profileSummary = "You are comfortable with volatility and are focused on long-term growth. Short-term losses are acceptable if the plan remains intact.";
        allocation = "Typical mix (illustrative): 20–40% defensive and 60–80% growth.";
      } else {
        profile = "Aggressive";
        profileSummary = "You can tolerate high volatility and are willing to accept meaningful drawdowns for higher long-term growth potential. Discipline still matters most in downturns.";
        allocation = "Typical mix (illustrative): 0–25% defensive and 75–100% growth.";
      }

      // Secondary insights
      const baseScoreRounded = Math.round(score);
      const adjustedScoreRounded = Math.round(adjustedScore);
      const adjustmentTotal = Math.round((adjustedScore - score) * 10) / 10;

      let adjustmentLine = "No optional adjustments applied.";
      if (horizonAdj !== 0 || liquidityAdj !== 0) {
        const parts = [];
        if (horizonAdj !== 0) parts.push("horizon adjustment " + (horizonAdj > 0 ? "+" : "") + horizonAdj);
        if (liquidityAdj !== 0) parts.push("liquidity adjustment " + (liquidityAdj > 0 ? "+" : "") + liquidityAdj);
        adjustmentLine = "Applied: " + parts.join(", ") + " (total " + (adjustmentTotal > 0 ? "+" : "") + adjustmentTotal + ").";
      }

      // Build output HTML
      const resultHtml = `
        <p><strong>Your risk tolerance score:</strong> ${adjustedScoreRounded} / 100</p>
        <p><strong>Profile:</strong> ${profile}</p>
        <p>${profileSummary}</p>
        <p><strong>Illustrative allocation range:</strong> ${allocation}</p>
        <p><strong>Score details:</strong> Base questionnaire score ${baseScoreRounded} / 100. ${adjustmentLine}</p>
        <p><strong>Reality check:</strong> If you have sold in past downturns, treat your practical risk tolerance as lower than your score suggests.</p>
      `;

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
      const message = "Risk Tolerance Scoring Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
