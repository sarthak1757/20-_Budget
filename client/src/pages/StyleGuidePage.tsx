import { useState, type ReactNode } from "react";
import { ChromeBlob } from "../components/brand/ChromeBlob";
import { HeroTitle } from "../components/brand/HeroTitle";
import {
  ArrowButton,
  ArrowLink,
  Hairline,
  Label,
  Panel,
  PillButton,
  PriceBadge,
  RatingBar,
  SideLabel,
  UrgentNote,
} from "../components/brand/primitives";
import { contrastGrade, contrastRatio, PAIRINGS, PALETTE, type PaletteName } from "../lib/palette";

// /style-guide: the new visual identity in one place. Colours (with their
// measured contrast), type, chrome shapes, and every component.

// Literal class names so Tailwind generates them.
const SWATCHES: { name: PaletteName; className: string; role: string }[] = [
  { name: "mocha", className: "bg-mocha", role: "Page background" },
  { name: "mocha-dark", className: "bg-mocha-dark", role: "Cards, slots, header and footer bars" },
  { name: "mocha-light", className: "bg-mocha-light", role: "Hover surfaces, dividers" },
  { name: "lavender", className: "bg-lavender", role: "Headlines, primary text, primary button" },
  { name: "lavender-deep", className: "bg-lavender-deep", role: "Active player, current turn, urgency" },
  { name: "platinum", className: "bg-platinum", role: "Body text, borders, secondary buttons, bars" },
];

export function StyleGuidePage() {
  return (
    <div className="min-h-dvh bg-mocha font-body text-platinum">
      <TopNav />
      <main className="mx-auto grid max-w-6xl gap-20 px-5 pt-10 pb-24 sm:px-8">
        <HeroSpecimen />
        <Section number="01" title="Colour">
          <ColourSection />
        </Section>
        <Section number="02" title="Type">
          <TypeSection />
        </Section>
        <Section number="03" title="Chrome">
          <ChromeSection />
        </Section>
        <Section number="04" title="Buttons & links">
          <ButtonSection />
        </Section>
        <Section number="05" title="Controls">
          <ControlSection />
        </Section>
        <Section number="06" title="Item card">
          <ItemCardSection />
        </Section>
        <Section number="07" title="Player column">
          <PlayerSection />
        </Section>
        <Section number="08" title="In the game">
          <InGameSection />
        </Section>
        <Section number="09" title="Overlays">
          <OverlaySection />
        </Section>
        <Section number="10" title="Lobby, results & leaderboard">
          <ListsSection />
        </Section>
      </main>
    </div>
  );
}

// ---- Page furniture ----

function TopNav() {
  return (
    <header className="border-b border-platinum/30 bg-mocha-dark">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-4 sm:px-8">
        <span className="display-italic text-2xl text-lavender">Budget Draft</span>
        <nav className="ml-auto hidden items-center gap-6 sm:flex" aria-label="Main">
          <Label>Play</Label>
          <Label>Daily</Label>
          <Label>Leaderboard</Label>
        </nav>
        <div className="ml-auto flex items-center gap-2 sm:ml-0">
          <IconCircle label="Sound on">♪</IconCircle>
          <IconCircle label="How to play">?</IconCircle>
        </div>
      </div>
    </header>
  );
}

function IconCircle({ children, label }: { children: ReactNode; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="grid size-9 place-items-center rounded-full text-sm text-platinum ring-1 ring-platinum/60 hover:bg-mocha-light"
    >
      {children}
    </button>
  );
}

function Section({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <section className="grid gap-8">
      <div className="flex items-end gap-4">
        <Label className="text-platinum/80">{number}</Label>
        <h2 className="display-italic text-5xl text-lavender sm:text-6xl">{title}</h2>
      </div>
      <Hairline />
      {children}
    </section>
  );
}

// ---- Home hero (a preview of step 2) ----

function HeroSpecimen() {
  return (
    <section className="relative grid gap-8 pt-6">
      <div className="flex items-center gap-4">
        <Label>Style guide</Label>
        <Hairline className="flex-1" />
        <Label>Season 01</Label>
      </div>
      <div className="relative">
        <HeroTitle />
        <SideLabel className="absolute top-0 right-0 hidden sm:block">Editorial · No. 20</SideLabel>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-6">
        <Label className="text-lavender">Build the best team with $20</Label>
        <ArrowLink to="/style-guide">Explore</ArrowLink>
      </div>
    </section>
  );
}

// ---- 01 Colour ----

function ColourSection() {
  return (
    <div className="grid gap-10">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {SWATCHES.map((swatch) => (
          <figure key={swatch.name} className="grid min-w-0 content-start gap-3">
            <div className={`aspect-square rounded-[1.5rem] ring-1 ring-platinum/30 ${swatch.className}`} />
            <figcaption className="grid gap-1">
              <Label className="text-lavender">{swatch.name}</Label>
              <span className="font-mono text-xs text-platinum">{PALETTE[swatch.name]}</span>
              <span className="text-sm text-platinum">{swatch.role}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      <Panel className="overflow-x-auto p-0">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <caption className="px-6 pt-6 text-left">
            <Label>WCAG contrast, measured</Label>
          </caption>
          <thead>
            <tr className="border-b border-platinum/30">
              <th className="px-6 py-3 font-normal"><Label>Sample</Label></th>
              <th className="px-3 py-3 font-normal"><Label>Text on background</Label></th>
              <th className="px-3 py-3 font-normal"><Label>Ratio</Label></th>
              <th className="px-3 py-3 font-normal"><Label>Grade</Label></th>
              <th className="px-6 py-3 font-normal"><Label>Used for</Label></th>
            </tr>
          </thead>
          <tbody>
            {PAIRINGS.map((pairing) => {
              const ratio = contrastRatio(pairing.foreground, pairing.background);
              return (
                <tr key={`${pairing.foreground}-${pairing.background}`} className="border-b border-platinum/15 last:border-0">
                  <td className="px-6 py-3">
                    <ContrastSample foreground={pairing.foreground} background={pairing.background} />
                  </td>
                  <td className="px-3 py-3 text-platinum">
                    {pairing.foreground} on {pairing.background}
                  </td>
                  <td className="px-3 py-3 font-mono text-lavender">{ratio.toFixed(2)}:1</td>
                  <td className="px-3 py-3 text-lavender">{contrastGrade(ratio)}</td>
                  <td className="px-6 py-3 text-platinum">{pairing.use}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

// Literal class pairs for Tailwind.
const TEXT_CLASS: Record<PaletteName, string> = {
  mocha: "text-mocha",
  "mocha-dark": "text-mocha-dark",
  "mocha-light": "text-mocha-light",
  lavender: "text-lavender",
  "lavender-deep": "text-lavender-deep",
  platinum: "text-platinum",
};
const BG_CLASS: Record<PaletteName, string> = {
  mocha: "bg-mocha",
  "mocha-dark": "bg-mocha-dark",
  "mocha-light": "bg-mocha-light",
  lavender: "bg-lavender",
  "lavender-deep": "bg-lavender-deep",
  platinum: "bg-platinum",
};

function ContrastSample({ foreground, background }: { foreground: PaletteName; background: PaletteName }) {
  return (
    <span className={`inline-grid h-10 w-16 place-items-center rounded-lg ring-1 ring-platinum/30 ${BG_CLASS[background]}`}>
      <span className={`display-italic text-xl ${TEXT_CLASS[foreground]}`}>Aa</span>
    </span>
  );
}

// ---- 02 Type ----

function TypeSection() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
      <div className="grid gap-6">
        <TypeRow name="Display · Bodoni Moda italic · 128">
          <span className="display-italic block text-7xl text-lavender sm:text-9xl">Draft</span>
        </TypeRow>
        <TypeRow name="Display · 64 · item names, winner">
          <span className="display-italic block text-5xl text-lavender sm:text-6xl">Erling Haaland</span>
        </TypeRow>
        <TypeRow name="Display · 72 · budgets">
          <span className="display-italic block text-7xl text-lavender">$13</span>
        </TypeRow>
        <TypeRow name="Body · DM Sans · 16">
          <p className="max-w-prose text-base text-platinum">
            Items are revealed one at a time. Buy or pass, and fill every slot without running out of money. Calm,
            readable, with plenty of room around it.
          </p>
        </TypeRow>
        <TypeRow name="Label · DM Sans · 11 · 0.2em">
          <span className="flex flex-wrap gap-6">
            <Label>Slot 1</Label>
            <Label>Room code</Label>
            <Label>Price</Label>
            <Label>Time left · 12s</Label>
          </span>
        </TypeRow>
      </div>
      <Panel className="relative grid content-between gap-6 overflow-hidden">
        <Label>The rule</Label>
        <p className="display-italic relative z-10 text-4xl text-lavender">Large serif speaks. Small labels whisper.</p>
        <p className="relative z-10 text-sm text-platinum">
          Serif only at 24px and up, where its hairline strokes stay sharp. Everything small is DM Sans.
        </p>
      </Panel>
    </div>
  );
}

function TypeRow({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="grid gap-3">
      <Label className="text-platinum/80">{name}</Label>
      {children}
      <Hairline />
    </div>
  );
}

// ---- 03 Chrome ----

function ChromeSection() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
      {(["pebble", "ring", "ribbon"] as const).map((shape) => (
        <Panel key={shape} className="grid place-items-center gap-4 bg-mocha">
          <ChromeBlob shape={shape} className="w-48" />
          <Label>{shape}</Label>
        </Panel>
      ))}
    </div>
  );
}

// ---- 04 Buttons ----

function ButtonSection() {
  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-center gap-4">
        <PillButton>Start draft</PillButton>
        <PillButton variant="secondary">Join with a code</PillButton>
        <PillButton variant="ghost">Quit game</PillButton>
        <PillButton disabled>Buy</PillButton>
      </div>
      <div className="flex flex-wrap items-center gap-8">
        <ArrowLink to="/style-guide">Explore</ArrowLink>
        <ArrowButton onClick={() => undefined}>Leaderboard</ArrowButton>
      </div>
      <div className="grid max-w-md grid-cols-2 gap-3">
        <PillButton className="py-4 text-lg">Buy</PillButton>
        <PillButton variant="secondary" className="py-4 text-lg">
          Pass
        </PillButton>
      </div>
    </div>
  );
}

// ---- 05 Controls ----

function ControlSection() {
  const [name, setName] = useState("Asha");
  const [mystery, setMystery] = useState(true);
  const [slots, setSlots] = useState(5);
  const [style, setStyle] = useState<"classic" | "auction">("classic");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel className="grid gap-6">
        <label className="grid gap-2">
          <Label>Your name</Label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="border-b border-platinum/60 bg-transparent py-2 font-body text-lg text-lavender outline-none placeholder:text-platinum/50 focus:border-lavender"
          />
        </label>
        <div className="flex items-center justify-between">
          <Label>Slots</Label>
          <div className="flex items-center gap-4">
            <StepButton label="Fewer slots" onClick={() => setSlots(Math.max(3, slots - 1))}>
              −
            </StepButton>
            <span className="display-italic w-10 text-center text-4xl text-lavender">{slots}</span>
            <StepButton label="More slots" onClick={() => setSlots(Math.min(7, slots + 1))}>
              +
            </StepButton>
          </div>
        </div>
        <div className="flex items-start justify-between gap-6">
          <span>
            <Label className="text-lavender">Mystery items</Label>
            <span className="mt-1 block text-sm text-platinum">About 1 in 6 items hide their rating until the end.</span>
          </span>
          <Switch on={mystery} onChange={setMystery} label="Mystery items" />
        </div>
      </Panel>
      <Panel className="grid content-start gap-4">
        <Label>Draft style</Label>
        <div className="grid grid-cols-2 gap-3">
          <Choice selected={style === "classic"} onClick={() => setStyle("classic")} title="Classic" text="Buy or pass at the listed price." />
          <Choice selected={style === "auction"} onClick={() => setStyle("auction")} title="Auction" text="Bid against each other." />
        </div>
        <Label className="mt-2">Category</Label>
        <div className="flex flex-wrap gap-2">
          <Chip selected>Football</Chip>
          <Chip>Cricket</Chip>
          <Chip>F1 Drivers</Chip>
          <Chip>Fast Food</Chip>
        </div>
      </Panel>
    </div>
  );
}

function StepButton({ children, label, onClick }: { children: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-10 place-items-center rounded-full text-xl text-platinum ring-1 ring-platinum/60 hover:bg-mocha-light"
    >
      {children}
    </button>
  );
}

function Switch({ on, onChange, label }: { on: boolean; onChange: (on: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-7 w-12 shrink-0 rounded-full ring-1 transition ${on ? "bg-lavender ring-lavender" : "ring-platinum/60"}`}
    >
      <span
        className={`absolute top-1 size-5 rounded-full transition-all ${on ? "left-6 bg-mocha-dark" : "left-1 bg-platinum"}`}
      />
    </button>
  );
}

function Choice({ selected, onClick, title, text }: { selected: boolean; onClick: () => void; title: string; text: string }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-[1.25rem] p-4 text-left ring-1 transition ${selected ? "bg-mocha shadow-glow ring-lavender-deep" : "ring-platinum/30 hover:bg-mocha-light"}`}
    >
      <span className="display-italic block text-3xl text-lavender">{title}</span>
      <span className="mt-1 block text-sm text-platinum">{text}</span>
    </button>
  );
}

function Chip({ children, selected = false }: { children: ReactNode; selected?: boolean }) {
  return (
    <span
      className={`label-caps rounded-full px-3 py-1.5 ring-1 ${selected ? "bg-lavender text-mocha ring-lavender" : "text-platinum ring-platinum/50"}`}
    >
      {children}
    </span>
  );
}

// ---- 06 Item card ----

function ItemCardSection() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <ItemCardSpecimen name="Erling Haaland" tag="Forward" price={9} rating={94} round={4} left={38} />
      <ItemCardSpecimen name="Martin Ødegaard" tag="Midfielder" price={7} rating={86} round={5} left={37} auction />
      <ItemCardSpecimen name="Ben Stokes" tag="All-rounder" price={6} rating={null} round={9} left={31} />
    </div>
  );
}

interface ItemSpecimenProps {
  name: string;
  tag: string;
  price: number;
  rating: number | null;
  round: number;
  left: number;
  auction?: boolean;
}

function ItemCardSpecimen({ name, tag, price, rating, round, left, auction = false }: ItemSpecimenProps) {
  const mystery = rating === null;
  return (
    <article className="relative grid content-start gap-6 overflow-hidden rounded-[2rem] border border-platinum/30 bg-mocha-dark p-6">
      <div className="flex items-center justify-between">
        <Label>
          Item {round} · {left} left
        </Label>
        <Label className="text-lavender">{tag}</Label>
      </div>
      {mystery && (
        <div className="relative grid h-36 place-items-center">
          <ChromeBlob shape="pebble" className="absolute w-36" />
          <span className="display-italic relative text-[7rem] text-lavender drop-shadow-[0_2px_8px_var(--color-mocha-dark)]">?</span>
        </div>
      )}
      <h3 className="display-italic text-5xl text-lavender">{name}</h3>
      {mystery && <Label className="text-lavender-deep">Mystery · rating revealed at the end</Label>}
      <Hairline />
      <div className="flex items-end gap-6">
        <PriceBadge price={price} label={auction ? "Guide price" : "Price"} />
        <RatingBar rating={rating} className="flex-1 pb-6" />
      </div>
      {auction && (
        <div className="flex items-center justify-between rounded-full px-4 py-2 ring-1 ring-lavender-deep">
          <Label className="text-lavender-deep">High bid · Asha</Label>
          <span className="display-italic text-3xl text-lavender">$8</span>
        </div>
      )}
    </article>
  );
}

// ---- 07 Player column ----

interface SlotSpecimen {
  name: string;
  tag: string;
  paid: number;
  rating: number | null;
}

function PlayerSection() {
  const ashaTeam: (SlotSpecimen | null)[] = [
    { name: "Alisson", tag: "Goalkeeper", paid: 4, rating: 88 },
    { name: "Virgil van Dijk", tag: "Defender", paid: 5, rating: 89 },
    null,
    null,
    null,
  ];
  const benTeam: (SlotSpecimen | null)[] = [
    { name: "Kevin De Bruyne", tag: "Midfielder", paid: 8, rating: null },
    null,
    null,
    null,
    null,
  ];
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <PlayerSpecimen name="Asha" budget={11} canSpend={8} team={ashaTeam} active roles={["Goalkeeper", "Defender", "Midfielder", "Forward"]} />
      <PlayerSpecimen name="Ben" budget={12} canSpend={8} team={benTeam} highBid />
      <PlayerSpecimen name="Chen (bot)" budget={3} canSpend={0} team={ashaTeam} cantAfford />
    </div>
  );
}

interface PlayerSpecimenProps {
  name: string;
  budget: number;
  canSpend: number;
  team: (SlotSpecimen | null)[];
  active?: boolean;
  highBid?: boolean;
  cantAfford?: boolean;
  roles?: string[];
}

function PlayerSpecimen({ name, budget, canSpend, team, active = false, highBid = false, cantAfford = false, roles = [] }: PlayerSpecimenProps) {
  const covered = new Set(team.map((slot) => slot?.tag));
  return (
    <section
      className={`grid content-start gap-4 rounded-[1.75rem] bg-mocha-dark p-5 transition ${active ? "shadow-glow" : "ring-1 ring-platinum/30"}`}
    >
      <header className="flex items-center gap-3">
        <Label className={active ? "text-lavender" : ""}>{name}</Label>
        {active && <Label className="ml-auto text-lavender-deep">Their turn</Label>}
        {highBid && <Label className="ml-auto rounded-full bg-lavender-deep px-2 py-0.5 text-mocha-dark">High bid</Label>}
      </header>
      <p className="display-italic text-7xl text-lavender">${budget}</p>
      <div className="h-5">
        {cantAfford ? <UrgentNote>Can't afford this one</UrgentNote> : <Label>Can spend up to ${canSpend}</Label>}
      </div>
      <ol className="grid">
        {team.map((slot, index) => (
          <li key={index} className="flex min-h-12 items-center gap-3 border-t border-platinum/30 py-2 last:border-b">
            <Label className="w-6 text-platinum/80">{String(index + 1).padStart(2, "0")}</Label>
            {slot === null ? (
              <span className="text-sm text-platinum/60">—</span>
            ) : (
              <>
                <span className="min-w-0 flex-1">
                  <span className="display-italic block truncate text-xl text-lavender">{slot.name}</span>
                  <Label className="text-platinum/80">
                    {slot.tag} · ${slot.paid}
                  </Label>
                </span>
                <span className="display-italic text-2xl text-lavender">{slot.rating ?? "?"}</span>
              </>
            )}
          </li>
        ))}
      </ol>
      {roles.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Roles for the balanced team bonus">
          {roles.map((role) => (
            <li
              key={role}
              className={`label-caps rounded-full px-2.5 py-1 ${covered.has(role) ? "bg-lavender text-mocha" : "text-platinum ring-1 ring-platinum/40"}`}
            >
              {covered.has(role) ? "✓ " : ""}
              {role}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ---- 08 In the game ----

function InGameSection() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel className="grid gap-6">
        <TimerSpecimen seconds={12} total={15} />
        <TimerSpecimen seconds={4} total={15} />
        <Hairline />
        <Label>Quick bids · auction</Label>
        <div className="flex flex-wrap gap-3">
          <PillButton>Bid $9</PillButton>
          <PillButton variant="secondary">+$2 · $10</PillButton>
          <PillButton variant="secondary" disabled>
            +$5 · $13
          </PillButton>
        </div>
      </Panel>
      <Panel className="grid content-start gap-6">
        <Label>Power-ups</Label>
        <div className="flex flex-wrap gap-3">
          <PowerChip icon="✋" name="Veto" />
          <PowerChip icon="✂" name="Discount" />
          <PowerChip icon="👁" name="Peek" used />
        </div>
        <Hairline />
        <Label>Reactions</Label>
        <div className="flex gap-2">
          {["👏", "😂", "😱", "🔥", "💸"].map((emoji) => (
            <span key={emoji} className="grid size-11 place-items-center rounded-full text-xl ring-1 ring-platinum/40">
              {emoji}
            </span>
          ))}
        </div>
        <Hairline />
        <Label>Activity</Label>
        <p className="text-sm text-platinum">Asha bought Alisson for $4 · Ben passed on Rodri</p>
      </Panel>
    </div>
  );
}

function TimerSpecimen({ seconds, total }: { seconds: number; total: number }) {
  const urgent = seconds <= 5;
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between">
        {urgent ? <UrgentNote>Hurry</UrgentNote> : <Label>Time left</Label>}
        <span className={`display-italic text-3xl ${urgent ? "animate-urgent origin-right text-lavender-deep" : "text-lavender"}`}>{seconds}s</span>
      </div>
      <div className="h-[2px] bg-platinum/20">
        <div className={`h-full ${urgent ? "bg-lavender-deep" : "bg-platinum"}`} style={{ width: `${(seconds / total) * 100}%` }} />
      </div>
    </div>
  );
}

function PowerChip({ icon, name, used = false }: { icon: string; name: string; used?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 ring-1 ${used ? "text-platinum/50 ring-platinum/20" : "text-platinum ring-platinum/60"}`}
    >
      <span aria-hidden>{icon}</span>
      <span className="label-caps">{name}</span>
      {used && <span className="label-caps">· used</span>}
    </span>
  );
}

// ---- 09 Overlays ----

function OverlaySection() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
      <div className="grid content-start gap-3">
        <Label>Toasts</Label>
        <ToastSpecimen>Copied! Paste it anywhere.</ToastSpecimen>
        <ToastSpecimen urgent>Connection lost. Reconnecting…</ToastSpecimen>
      </div>
      <div className="relative overflow-hidden rounded-[2rem] bg-mocha-dark p-8 text-center ring-1 ring-platinum/30">
        <ChromeBlob shape="ring" className="absolute -top-10 -right-12 w-44" />
        <Label className="relative">How to play · 1 / 4</Label>
        <h3 className="display-italic relative mt-10 text-5xl text-lavender">$20 for 5 slots</h3>
        <p className="relative mt-4 text-platinum">
          Items are shown one at a time, each with a price and a rating. Build the best team you can afford.
        </p>
        <div className="relative mt-8 flex justify-center gap-2" aria-hidden>
          <span className="h-px w-8 bg-lavender" />
          <span className="h-px w-8 bg-platinum/30" />
          <span className="h-px w-8 bg-platinum/30" />
          <span className="h-px w-8 bg-platinum/30" />
        </div>
        <div className="relative mt-8 flex justify-between">
          <PillButton variant="ghost">Skip</PillButton>
          <PillButton>Next</PillButton>
        </div>
      </div>
    </div>
  );
}

function ToastSpecimen({ children, urgent = false }: { children: ReactNode; urgent?: boolean }) {
  return (
    <div className="flex w-fit items-center gap-3 rounded-full bg-mocha-dark px-5 py-3 ring-1 ring-platinum/30">
      {urgent ? <UrgentNote>{children}</UrgentNote> : <span className="text-sm text-platinum">{children}</span>}
    </div>
  );
}

// ---- 10 Lists ----

function ListsSection() {
  const rows = [
    { name: "Asha", wins: 12, games: 20, best: 412 },
    { name: "Ben", wins: 9, games: 18, best: 398 },
    { name: "Chen", wins: 4, games: 11, best: null },
  ];
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Panel className="grid content-start gap-4 text-center">
        <Label>Room code</Label>
        <p className="display-italic text-6xl tracking-wide text-lavender">YB9WJR</p>
        <PillButton variant="secondary">Copy invite link</PillButton>
        <Hairline />
        <ul className="grid gap-3 text-left">
          <li className="flex items-center gap-3">
            <span className="display-italic text-2xl text-lavender">Asha</span>
            <Label className="text-lavender-deep">Host</Label>
            <span className="ml-auto size-2 rounded-full bg-lavender" aria-label="online" />
          </li>
          <li className="flex items-center gap-3">
            <span className="display-italic text-2xl text-lavender">Ben</span>
            <span className="ml-auto size-2 rounded-full ring-1 ring-platinum/60" aria-label="offline" />
          </li>
        </ul>
      </Panel>

      <Panel className="relative grid content-start gap-4 overflow-hidden">
        <ChromeBlob shape="ribbon" className="absolute -right-10 -bottom-12 w-48 opacity-90" />
        <Label>Winner</Label>
        <p className="display-italic relative text-7xl text-lavender">Asha</p>
        <dl className="relative grid gap-2">
          <ScoreRow label="Rating" value="397" />
          <ScoreRow label="Leftover" value="+3" />
          <ScoreRow label="Balanced team" value="+15" />
          <ScoreRow label="Total" value="415" strong />
        </dl>
        <div className="relative">
          <PillButton>Share result</PillButton>
        </div>
      </Panel>

      <Panel className="grid content-start gap-2 p-0">
        <div className="flex items-center gap-3 px-6 pt-6 pb-2">
          <Label>Leaderboard</Label>
          <Label className="ml-auto">Wins</Label>
          <Label className="w-12 text-right">Best</Label>
        </div>
        <ol>
          {rows.map((row, index) => (
            <li key={row.name} className="flex items-center gap-3 border-t border-platinum/30 px-6 py-3">
              <Label className="w-5 text-platinum/80">{String(index + 1).padStart(2, "0")}</Label>
              <span className="display-italic text-2xl text-lavender">{row.name}</span>
              <span className="ml-auto text-platinum">{row.wins}</span>
              <span className="w-12 text-right text-platinum">{row.best ?? "—"}</span>
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}

function ScoreRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between border-t border-platinum/30 pt-2 ${strong ? "pb-1" : ""}`}>
      <dt>
        <Label className={strong ? "text-lavender" : ""}>{label}</Label>
      </dt>
      <dd className={`display-italic ${strong ? "text-4xl text-lavender" : "text-2xl text-platinum"}`}>{value}</dd>
    </div>
  );
}
