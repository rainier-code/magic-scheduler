const EVENT_FIELDS = new Set([
  "client",
  "type",
  "package",
  "location",
  "distance",
  "date",
  "time",
  "performers",
  "totalAmount",
  "downpayment",
  // Accepted for compatibility with the client, but always recalculated here.
  "balance",
  "paymentStatus",
]);

const TEXT_LIMITS = {
  client: 120,
  type: 80,
  package: 100,
  location: 500,
  distance: 20,
};

function isRealDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
}

function validateEventPayload(input, existing = {}) {
  const errors = [];
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { errors: ["Event data must be an object."], data: null };
  }

  const unknownFields = Object.keys(input).filter((field) => !EVENT_FIELDS.has(field));
  if (unknownFields.length) errors.push("Event data contains unsupported fields.");

  const data = {};
  for (const [field, maxLength] of Object.entries(TEXT_LIMITS)) {
    const value = input[field] === undefined ? existing[field] : input[field];
    if (value === undefined && field === "distance") {
      data.distance = "";
      continue;
    }
    if (typeof value !== "string") {
      errors.push(`${field} must be text.`);
      continue;
    }
    const normalized = value.trim();
    if (normalized.length > maxLength) errors.push(`${field} is too long.`);
    if (field !== "distance" && !normalized) errors.push(`${field} is required.`);
    data[field] = normalized;
  }

  const date = input.date === undefined ? existing.date : input.date;
  if (!isRealDate(date)) errors.push("date must be a valid YYYY-MM-DD date.");
  else data.date = date;

  const time = input.time === undefined ? existing.time : input.time;
  if (typeof time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    errors.push("time must use 24-hour HH:mm format.");
  } else data.time = time;

  const performers = input.performers === undefined ? existing.performers || [] : input.performers;
  if (!Array.isArray(performers) || performers.length > 40) {
    errors.push("performers must be a list of at most 40 names.");
  } else if (performers.some((person) => typeof person !== "string" || !person.trim() || person.trim().length > 80)) {
    errors.push("Each performer name must be 1 to 80 characters.");
  } else {
    if (performers.length === 0) errors.push("At least one performer is required.");
    data.performers = performers.map((person) => person.trim());
  }

  for (const field of ["totalAmount", "downpayment"]) {
    const value = input[field] === undefined ? existing[field] ?? 0 : input[field];
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      errors.push(`${field} must be a non-negative number.`);
    } else {
      data[field] = value;
    }
  }

  if (data.totalAmount !== undefined && data.downpayment !== undefined) {
    if (data.downpayment > data.totalAmount) {
      errors.push("downpayment cannot be greater than totalAmount.");
    } else {
      data.balance = Math.max(data.totalAmount - data.downpayment, 0);
      data.paymentStatus = data.totalAmount > 0 && data.balance === 0
        ? "Fully Paid"
        : data.downpayment > 0
          ? "Downpayment Paid"
          : "Unpaid";
    }
  }

  return { errors, data };
}

module.exports = validateEventPayload;
