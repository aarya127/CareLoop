export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhoneE164(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone);
}

export function isValidDateString(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const d = new Date(date);
  return !isNaN(d.getTime());
}

export function isValidSSN(ssn: string): boolean {
  return /^\d{3}-\d{2}-\d{4}$/.test(ssn);
}

export function isValidNPI(npi: string): boolean {
  return /^\d{10}$/.test(npi);
}

export function isValidZip(zip: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(zip);
}
