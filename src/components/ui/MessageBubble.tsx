/** An outgoing WhatsApp message on the chat wallpaper, to preview what gets sent (L7). */
export function MessageBubble({ text, time, label }: { text: string; time: string; label: string }) {
  return (
    // A week's message is long: it scrolls on its own so the send buttons stay in view.
    <figure aria-label={label} tabIndex={0} className="flex max-h-[40dvh] flex-col overflow-y-auto rounded-card bg-chat p-3 shadow-card">
      <div className="ml-6 flex flex-col gap-1 self-end rounded-card rounded-tr-sm bg-bubble px-3 pt-2 pb-1.5 shadow-card">
        <p className="text-sm leading-[1.45] whitespace-pre-wrap text-text [overflow-wrap:anywhere]">{text}</p>
        <span aria-hidden="true" className="self-end text-[0.6875rem] text-text-quiet tabular-nums">
          {time} <span className="text-accent">✓✓</span>
        </span>
      </div>
    </figure>
  );
}
