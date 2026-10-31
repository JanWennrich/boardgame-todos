// Slides a .sheet dialog out before closing it; its onClose handler then unmounts it.
export async function closeSheet(dialog: HTMLDialogElement) {
  dialog.classList.add("closing");
  // allSettled: the switch to the closing animation cancels a slide-in that is still running.
  await Promise.allSettled(dialog.getAnimations().map((a) => a.finished));
  dialog.close();
}
