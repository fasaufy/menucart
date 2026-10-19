import closed from "@/assets/envelope-closed.svg";
import open from "@/assets/envelope-open.svg";

/** Sign-in illustrations: a sealed envelope to ask, an open one once it's sent. */
export function Envelope({ opened }: { opened?: boolean }) {
  const img = opened ? open : closed;
  return (
    <div aria-hidden="true" className="flex justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- static SVG, precached for offline */}
      <img src={img.src} alt="" width={opened ? 137 : 134} height={opened ? 150 : 88} className={opened ? "-rotate-1" : ""} />
    </div>
  );
}

/** Centred title and body under the envelope. */
export function AuthHeading({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 text-center">
      <h1 className="font-display text-2xl leading-tight font-semibold">{title}</h1>
      {children}
    </div>
  );
}
