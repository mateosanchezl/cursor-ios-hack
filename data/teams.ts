import type { Team } from "@/lib/types";

/**
 * Sample tournament teams. `aliases` lets us match a team against a venue's
 * free-text `fanBases` (which may use regional groupings like "LatAm").
 */
export const TEAMS: Team[] = [
  { code: "ENG", name: "England", flag: "🏴", aliases: ["england", "home nations"] },
  { code: "ARG", name: "Argentina", flag: "🇦🇷", aliases: ["argentina", "latam"] },
  { code: "BRA", name: "Brazil", flag: "🇧🇷", aliases: ["brazil", "latam"] },
  { code: "FRA", name: "France", flag: "🇫🇷", aliases: ["france"] },
  { code: "ESP", name: "Spain", flag: "🇪🇸", aliases: ["spain"] },
  { code: "GER", name: "Germany", flag: "🇩🇪", aliases: ["germany"] },
  { code: "POR", name: "Portugal", flag: "🇵🇹", aliases: ["portugal"] },
  { code: "NED", name: "Netherlands", flag: "🇳🇱", aliases: ["netherlands", "holland"] },
  { code: "ITA", name: "Italy", flag: "🇮🇹", aliases: ["italy"] },
  { code: "MEX", name: "Mexico", flag: "🇲🇽", aliases: ["mexico", "latam"] },
  { code: "COL", name: "Colombia", flag: "🇨🇴", aliases: ["colombia", "latam"] },
  { code: "SEN", name: "Senegal", flag: "🇸🇳", aliases: ["senegal"] },
  { code: "SCO", name: "Scotland", flag: "🏴", aliases: ["scotland", "home nations"] },
  { code: "IRL", name: "Ireland", flag: "🇮🇪", aliases: ["ireland"] },
  { code: "JAM", name: "Jamaica", flag: "🇯🇲", aliases: ["jamaica"] },
  { code: "USA", name: "USA", flag: "🇺🇸", aliases: ["usa", "united states"] },
  { code: "CRO", name: "Croatia", flag: "🇭🇷", aliases: ["croatia"] },
  { code: "MAR", name: "Morocco", flag: "🇲🇦", aliases: ["morocco"] },
];

const TEAM_BY_CODE = new Map(TEAMS.map((team) => [team.code, team]));

export function getTeam(code: string | null | undefined): Team | null {
  if (!code) return null;
  return TEAM_BY_CODE.get(code) ?? null;
}
