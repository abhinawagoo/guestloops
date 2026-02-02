/**
 * Countries with dial code for mobile input (E.164).
 * ISO 3166-1 alpha-2 code + dial code + label.
 */
export interface CountryOption {
  code: string;
  dialCode: string;
  name: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: "US", dialCode: "+1", name: "United States" },
  { code: "GB", dialCode: "+44", name: "United Kingdom" },
  { code: "IN", dialCode: "+91", name: "India" },
  { code: "AU", dialCode: "+61", name: "Australia" },
  { code: "CA", dialCode: "+1", name: "Canada" },
  { code: "AE", dialCode: "+971", name: "United Arab Emirates" },
  { code: "DE", dialCode: "+49", name: "Germany" },
  { code: "FR", dialCode: "+33", name: "France" },
  { code: "ES", dialCode: "+34", name: "Spain" },
  { code: "IT", dialCode: "+39", name: "Italy" },
  { code: "NL", dialCode: "+31", name: "Netherlands" },
  { code: "SG", dialCode: "+65", name: "Singapore" },
  { code: "MY", dialCode: "+60", name: "Malaysia" },
  { code: "TH", dialCode: "+66", name: "Thailand" },
  { code: "JP", dialCode: "+81", name: "Japan" },
  { code: "KR", dialCode: "+82", name: "South Korea" },
  { code: "CN", dialCode: "+86", name: "China" },
  { code: "HK", dialCode: "+852", name: "Hong Kong" },
  { code: "SA", dialCode: "+966", name: "Saudi Arabia" },
  { code: "ZA", dialCode: "+27", name: "South Africa" },
  { code: "BR", dialCode: "+55", name: "Brazil" },
  { code: "MX", dialCode: "+52", name: "Mexico" },
  { code: "IE", dialCode: "+353", name: "Ireland" },
  { code: "NZ", dialCode: "+64", name: "New Zealand" },
  { code: "PT", dialCode: "+351", name: "Portugal" },
  { code: "PL", dialCode: "+48", name: "Poland" },
  { code: "CH", dialCode: "+41", name: "Switzerland" },
  { code: "AT", dialCode: "+43", name: "Austria" },
  { code: "BE", dialCode: "+32", name: "Belgium" },
  { code: "SE", dialCode: "+46", name: "Sweden" },
  { code: "NO", dialCode: "+47", name: "Norway" },
  { code: "DK", dialCode: "+45", name: "Denmark" },
  { code: "FI", dialCode: "+358", name: "Finland" },
  { code: "GR", dialCode: "+30", name: "Greece" },
  { code: "TR", dialCode: "+90", name: "Turkey" },
  { code: "EG", dialCode: "+20", name: "Egypt" },
  { code: "PK", dialCode: "+92", name: "Pakistan" },
  { code: "BD", dialCode: "+880", name: "Bangladesh" },
  { code: "PH", dialCode: "+63", name: "Philippines" },
  { code: "ID", dialCode: "+62", name: "Indonesia" },
  { code: "VN", dialCode: "+84", name: "Vietnam" },
  { code: "IL", dialCode: "+972", name: "Israel" },
  { code: "RU", dialCode: "+7", name: "Russia" },
  { code: "UA", dialCode: "+380", name: "Ukraine" },
  { code: "RO", dialCode: "+40", name: "Romania" },
  { code: "CZ", dialCode: "+420", name: "Czech Republic" },
  { code: "HU", dialCode: "+36", name: "Hungary" },
  { code: "AR", dialCode: "+54", name: "Argentina" },
  { code: "CL", dialCode: "+56", name: "Chile" },
  { code: "CO", dialCode: "+57", name: "Colombia" },
  { code: "PE", dialCode: "+51", name: "Peru" },
  { code: "NG", dialCode: "+234", name: "Nigeria" },
  { code: "KE", dialCode: "+254", name: "Kenya" },
  { code: "GH", dialCode: "+233", name: "Ghana" },
  { code: "MA", dialCode: "+212", name: "Morocco" },
  { code: "QA", dialCode: "+974", name: "Qatar" },
  { code: "KW", dialCode: "+965", name: "Kuwait" },
  { code: "BH", dialCode: "+973", name: "Bahrain" },
  { code: "OM", dialCode: "+968", name: "Oman" },
];

export function getCountryByCode(code: string): CountryOption | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

export function formatPhoneWithDial(dialCode: string, localNumber: string): string {
  const digits = localNumber.replace(/\D/g, "");
  return `${dialCode}${digits}`;
}
