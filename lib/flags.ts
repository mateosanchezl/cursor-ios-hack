import { TEAMS } from "@/data/teams";

/** Country name -> ISO 3166-1 alpha-2, for deriving emoji flags from live data. */
const NAME_TO_ISO2: Record<string, string> = {
  Argentina: "AR",
  Australia: "AU",
  Austria: "AT",
  Belgium: "BE",
  Brazil: "BR",
  Cameroon: "CM",
  Canada: "CA",
  Chile: "CL",
  Colombia: "CO",
  Croatia: "HR",
  Denmark: "DK",
  Ecuador: "EC",
  Egypt: "EG",
  France: "FR",
  Germany: "DE",
  Ghana: "GH",
  Greece: "GR",
  Iran: "IR",
  Ireland: "IE",
  Italy: "IT",
  Jamaica: "JM",
  Japan: "JP",
  Mexico: "MX",
  Morocco: "MA",
  Netherlands: "NL",
  Nigeria: "NG",
  Norway: "NO",
  Panama: "PA",
  Peru: "PE",
  Poland: "PL",
  Portugal: "PT",
  Qatar: "QA",
  Senegal: "SN",
  Serbia: "RS",
  "South Korea": "KR",
  "Korea Republic": "KR",
  Spain: "ES",
  Sweden: "SE",
  Switzerland: "CH",
  Tunisia: "TN",
  Turkey: "TR",
  Uruguay: "UY",
  USA: "US",
  "United States": "US",
  Ukraine: "UA",
};

/** England/Scotland/Wales use subdivision flags, not ISO2. */
const SPECIAL: Record<string, string> = {
  England: "🏴",
  Scotland: "🏴",
  Wales: "🏴",
};

function emojiFromISO2(iso2: string): string {
  return iso2
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0)),
    );
}

const NAME_TO_FLAG = new Map<string, string>(
  TEAMS.map((team) => [team.name.toLowerCase(), team.flag]),
);

/** Best-effort emoji flag for a country name (returns "" if unknown). */
export function flagFromCountryName(name: string): string {
  if (!name) return "";
  if (SPECIAL[name]) return SPECIAL[name];
  const known = NAME_TO_FLAG.get(name.toLowerCase());
  if (known) return known;
  const iso2 = NAME_TO_ISO2[name];
  return iso2 ? emojiFromISO2(iso2) : "";
}
