import { revalidatePath } from "next/cache";

/** Call after the admin changes site content so the cached home page is rebuilt right away. */
export function revalidateSite() {
  try {
    revalidatePath("/");
  } catch {
    /* never let cache invalidation break a save */
  }
}
