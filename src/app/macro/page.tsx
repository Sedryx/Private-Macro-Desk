import { MacroCommandCenter } from "@/components/macro/MacroCommandCenter";
import { getMacroProfiles } from "@/lib/macroProfiles.server";

export const dynamic = "force-dynamic";

export default async function MacroPage() {
  const profiles = await getMacroProfiles();

  return <MacroCommandCenter profiles={profiles} />;
}
