document.addEventListener("DOMContentLoaded", function () {
  const startInput = document.getElementById("startDateTime");
  const endInput = document.getElementById("endDateTime");
  const button = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");

  function parseLocalDateTime(inputValue) {
    if (!inputValue) return null;

    const trimmed = String(inputValue).trim();
    if (!trimmed) return null;

    // Accept "YYYY-MM-DD HH:MM" or "YYYY-MM-DDTHH:MM"
    const normalized = trimmed.replace(" ", "T");
    const date = new Date(normalized);

    if (Number.isNaN(date.getTime())) return null;
    return date;
  }

  function setError(message) {
    resultDiv.classList.remove("success");
    resultDiv.classList.add("error");
    resultDiv.textContent = message;
  }

  function setSuccess(html) {
    resultDiv.classList.remove("error");
    resultDiv.classList.add("success");
    resultDiv.innerHTML = html;
  }

  button.addEventListener("click", function () {
    const startDate = parseLocalDateTime(startInput.value);
    const endDate = parseLocalDateTime(endInput.value);

    if (!startDate || !endDate) {
      setError("Please enter both start and end date/time values in a valid format (YYYY-MM-DD HH:MM).");
      return;
    }

    const startMs = startDate.getTime();
    const endMs = endDate.getTime();

    if (endMs <= startMs) {
      setError("End date/time must be later than start date/time.");
      return;
    }

    const diffMs = endMs - startMs;

    const totalSeconds = Math.floor(diffMs / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = diffMs / (1000 * 60 * 60);

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const remainderAfterDays = diffMs - days * 24 * 60 * 60 * 1000;

    const hours = Math.floor(remainderAfterDays / (1000 * 60 * 60));
    const remainderAfterHours = remainderAfterDays - hours * 60 * 60 * 1000;

    const minutes = Math.floor(remainderAfterHours / (1000 * 60));

    const weeks = diffMs / (1000 * 60 * 60 * 24 * 7);

    setSuccess(
      "<div><strong>Duration:</strong> " +
        formatInputWithCommas(String(days)) +
        " days, " +
        formatInputWithCommas(String(hours)) +
        " hours, " +
        formatInputWithCommas(String(minutes)) +
        " minutes</div>" +
        "<div style=\"margin-top:8px;\"><strong>Total hours:</strong> " +
        formatNumberTwoDecimals(totalHours) +
        "</div>" +
        "<div><strong>Total minutes:</strong> " +
        formatInputWithCommas(String(totalMinutes)) +
        "</div>" +
        "<div><strong>Total seconds:</strong> " +
        formatInputWithCommas(String(totalSeconds)) +
        "</div>" +
        "<div><strong>Total weeks:</strong> " +
        formatNumberTwoDecimals(weeks) +
        "</div>"
    );
  });

  const shareButton = document.getElementById("shareWhatsAppButton");
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Time Duration Calculator – check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
