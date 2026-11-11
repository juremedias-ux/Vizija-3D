import Link from "next/link";

/**
 * Začasni besedilni logotip. Zamenjaš ga lahko z grafičnim (npr. SVG) brez
 * sprememb drugje: komponento uporabljata glava in noga.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-2.5 rounded-sm ${className}`}
      aria-label="Vizija 3D — na začetek"
    >
      <span
        aria-hidden="true"
        className="relative grid size-8 place-items-center overflow-hidden rounded-[5px] border border-accent/70 bg-accent/10"
      >
        <span className="absolute inset-x-1 bottom-1 flex flex-col gap-[2px]">
          <span className="h-[2px] w-[55%] bg-accent/45" />
          <span className="h-[2px] w-[75%] bg-accent/65" />
          <span className="h-[2px] w-full bg-accent" />
        </span>
        <span className="relative -mt-2.5 font-mono text-[10px] leading-none font-medium text-accent">
          3D
        </span>
      </span>
      <span className="font-display text-lg font-semibold tracking-tight text-fg">
        Vizija<span className="text-accent"> 3D</span>
      </span>
    </Link>
  );
}
