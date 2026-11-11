import { cacheLife } from "next/cache";

/** Tekoče leto. Strežnik ga osveži vsak dan, zato ga ni treba ročno posodabljati. */
export async function CurrentYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}
