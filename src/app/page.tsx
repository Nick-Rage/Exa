import Workspace from "@/components/Workspace";
import { hasExaKey, isForcedDemoMode } from "@/lib/exa";

export default function Home() {
  return (
    <Workspace liveReady={hasExaKey() && !isForcedDemoMode()} />
  );
}
