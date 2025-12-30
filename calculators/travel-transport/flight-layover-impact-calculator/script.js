document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const layoverMinutesInput = document.getElementById("layoverMinutes");
  const connectionTypeSelect = document.getElementById("connectionType");

  const deplaneMinutesInput = document.getElementById("deplaneMinutes");
  const walkMinutesInput = document.getElementById("walkMinutes");
  const securityMinutesInput = document.getElementById("securityMinutes");
  const immigrationMinutesInput = document.getElementById("immigrationMinutes");
  const extraBufferMinutesInput = document.getElementById("extraBufferMinutes");

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
  attachLiveFormatting(layoverMinutesInput);
  attachLiveFormatting(deplaneMinutesInput);
  attachLiveFormatting(walkMinutesInput);
  attachLiveFormatting(securityMinutesInput);
  attachLiveFormatting(immigrationMinutesInput);
  attachLiveFormatting(extraBufferMinutesInput);

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

  function minutesLabel(mins) {
    const rounded = Math.round(mins);
    return rounded + " min";
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!layoverMinutesInput || !connectionTypeSelect) return;

      const layoverMinutes = toNumber(layoverMinutesInput.value);

      // Defaults depend on connection type (used only when advanced fields are blank)
      const connectionType = (connectionTypeSelect.value || "protected").toLowerCase();

      const defaultDeplane = 10;
      const defaultWalk = 15;
      const defaultSecurity = 20;
      const defaultImmigration = 0;
      const defaultExtraBuffer = connectionType === "self" ? 30 : 15;

      const deplaneMinutesRaw = toNumber(deplaneMinutesInput ? deplaneMinutesInput.value : "");
      const walkMinutesRaw = toNumber(walkMinutesInput ? walkMinutesInput.value : "");
      const securityMinutesRaw = toNumber(securityMinutesInput ? securityMinutesInput.value : "");
      const immigrationMinutesRaw = toNumber(immigrationMinutesInput ? immigrationMinutesInput.value : "");
      const extraBufferMinutesRaw = toNumber(extraBufferMinutesInput ? extraBufferMinutesInput.value : "");

      const deplaneMinutes = Number.isFinite(deplaneMinutesRaw) && deplaneMinutesInput && deplaneMinutesInput.value.trim() !== "" ? deplaneMinutesRaw : defaultDeplane;
      const walkMinutes = Number.isFinite(walkMinutesRaw) && walkMinutesInput && walkMinutesInput.value.trim() !== "" ? walkMinutesRaw : defaultWalk;
      const securityMinutes = Number.isFinite(securityMinutesRaw) && securityMinutesInput && securityMinutesInput.value.trim() !== "" ? securityMinutesRaw : defaultSecurity;
      const immigrationMinutes = Number.isFinite(immigrationMinutesRaw) && immigrationMinutesInput && immigrationMinutesInput.value.trim() !== "" ? immigrationMinutesRaw : defaultImmigration;
      const extraBufferMinutes = Number.isFinite(extraBufferMinutesRaw) && extraBufferMinutesInput && extraBufferMinutesInput.value.trim() !== "" ? extraBufferMinutesRaw : defaultExtraBuffer;

      // Validation
      if (!validatePositive(layoverMinutes, "scheduled layover (minutes)")) return;
      if (!validateNonNegative(deplaneMinutes, "deplaning time")) return;
      if (!validateNonNegative(walkMinutes, "walking/transfer time")) return;
      if (!validateNonNegative(securityMinutes, "security time")) return;
      if (!validateNonNegative(immigrationMinutes, "immigration time")) return;
      if (!validateNonNegative(extraBufferMinutes, "extra buffer")) return;

      // Sanity limits (avoid absurd entries)
      if (layoverMinutes > 24 * 60) {
        setResultError("Enter a scheduled layover under 1,440 minutes (24 hours).");
        return;
      }
      if (deplaneMinutes + walkMinutes + securityMinutes + immigrationMinutes + extraBufferMinutes > 24 * 60) {
        setResultError("Your advanced time costs add up to more than 24 hours. Reduce them and try again.");
        return;
      }

      const totalTimeCosts = deplaneMinutes + walkMinutes + securityMinutes + immigrationMinutes + extraBufferMinutes;
      const effectiveBuffer = layoverMinutes - totalTimeCosts;

      const suggestedMinBuffer = connectionType === "self" ? 45 : 15;

      let statusLabel = "";
      let statusNote = "";

      if (effectiveBuffer < 0) {
        statusLabel = "Very high risk";
        statusNote = "Under these assumptions, you do not have enough time. This connection is not realistic without everything going perfectly.";
      } else if (effectiveBuffer < suggestedMinBuffer) {
        statusLabel = "High risk";
        statusNote = "You have some time left, but the buffer is small for this connection type. A modest inbound delay or queue can break it.";
      } else if (effectiveBuffer < suggestedMinBuffer + 30) {
        statusLabel = "Moderate risk";
        statusNote = "This is workable for many trips, but you still have limited slack. Consider increasing buffer if you want lower stress.";
      } else {
        statusLabel = "Lower risk";
        statusNote = "You have meaningful slack after typical airport time costs. This is the kind of buffer that absorbs small delays.";
      }

      const html = `
        <p><strong>Connection assessment:</strong> ${statusLabel}</p>
        <p><strong>Effective buffer after time costs:</strong> ${minutesLabel(effectiveBuffer)}</p>
        <p>${statusNote}</p>
        <hr>
        <p><strong>Breakdown used</strong></p>
        <ul>
          <li>Scheduled layover: ${minutesLabel(layoverMinutes)}</li>
          <li>Deplaning: ${minutesLabel(deplaneMinutes)}</li>
          <li>Walking/transfer: ${minutesLabel(walkMinutes)}</li>
          <li>Security/re-screening: ${minutesLabel(securityMinutes)}</li>
          <li>Immigration/passport control: ${minutesLabel(immigrationMinutes)}</li>
          <li>Extra buffer (boarding, gate closure, uncertainty): ${minutesLabel(extraBufferMinutes)}</li>
          <li><strong>Total time costs:</strong> ${minutesLabel(totalTimeCosts)}</li>
        </ul>
        <p><strong>Rule of thumb used for this result:</strong> target at least ${minutesLabel(suggestedMinBuffer)} of effective buffer for ${
          connectionType === "self" ? "separate tickets (self-transfer)" : "a protected connection"
        }.</p>
      `;

      setResultSuccess(html);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Flight Layover Impact Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
