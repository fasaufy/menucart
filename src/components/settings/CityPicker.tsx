"use client";

import { useEffect, useMemo, useState } from "react";
import { GpsFixIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Card, Group, rowDivider } from "@/components/ui/Group";
import { inputClasses, sheetTitleClasses } from "@/components/ui/Input";
import { radioClasses } from "@/components/ui/Radio";
import { Sheet, SheetClose } from "@/components/ui/Sheet";
import { allRegencies, cityLabel, isProvinceAverage, locate, PROVINCE_AVERAGE, searchPlaces, type Place } from "@/lib/region/places";
import type { Strings } from "@/lib/strings";
import type { City } from "@/lib/types";

/** "You shop in · Kota Salatiga, Central Java · Change" (onboarding P2, Settings). */
export function CityRow({ city, onChange, t }: { city: City; onChange: (city: City) => void; t: Strings }) {
  const [open, setOpen] = useState(false);
  return (
    <Group className="flex-row items-center gap-3 px-3.5 py-3">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span id="city-label" className="text-xs text-text-muted">
          {t.city.shopIn}
        </span>
        <span className="flex items-center gap-1 text-body leading-[1.3] font-semibold">
          <GpsFixIcon size={12} className="shrink-0" />
          {cityLabel(city, t)}
        </span>
      </div>
      <Button variant="secondary" size="sm" fullWidth={false} aria-describedby="city-label" onClick={() => setOpen(true)}>
        {t.city.change}
      </Button>
      <CityPicker
        open={open}
        value={city}
        t={t}
        onClose={() => setOpen(false)}
        onPick={(next) => {
          onChange(next);
          setOpen(false);
        }}
      />
    </Group>
  );
}

type PickerProps = {
  open: boolean;
  value: City;
  t: Strings;
  onClose: () => void;
  onPick: (city: City) => void;
};

/** P3: search kota/kabupaten (kecamatan and desa map to theirs), GPS once, or the province average. */
export function CityPicker({ open, value, t, onClose, onPick }: PickerProps) {
  return (
    <Sheet open={open} onClose={onClose} labelledBy="city-title">
      <Body value={value} t={t} onClose={onClose} onPick={onPick} />
    </Sheet>
  );
}

type Choice = { key: string; city: City };
type Gps = { state: "idle" | "locating" | "off" | "outside" } | { state: "found"; city: City };

function Body({ value, t, onClose, onPick }: Omit<PickerProps, "open">) {
  const [query, setQuery] = useState("");
  const [choice, setChoice] = useState<Choice>({ key: isProvinceAverage(value) ? "average" : value.id, city: value });
  const [gps, setGps] = useState<Gps>({ state: "idle" });
  // Desa/kelurahan are big, so they load on the first search.
  const [villages, setVillages] = useState<Record<string, string>>();
  useEffect(() => {
    if (query.trim().length >= 3 && !villages) import("@/lib/region/jateng-villages").then((m) => setVillages(m.VILLAGES));
  }, [query, villages]);

  const trimmed = query.trim();
  const places = useMemo(() => (trimmed ? searchPlaces(trimmed, villages) : allRegencies()), [trimmed, villages]);

  function findMe() {
    setChoice({ key: "gps", city: value });
    if (!navigator.geolocation) return setGps({ state: "off" });
    setGps({ state: "locating" });
    // Used once to pick a kota/kabupaten; the coordinates are never stored or sent.
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { SHAPES } = await import("@/lib/region/jateng-shapes");
        const city = locate(coords.latitude, coords.longitude, SHAPES);
        setGps(city ? { state: "found", city } : { state: "outside" });
        setChoice({ key: "gps", city: city ?? PROVINCE_AVERAGE });
      },
      () => setGps({ state: "off" }),
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 10 * 60_000 },
    );
  }

  const gpsDetail =
    gps.state === "locating"
      ? t.city.locating
      : gps.state === "found"
        ? gps.city.name
        : gps.state === "off"
          ? t.city.locationOff
          : gps.state === "outside"
            ? t.city.outside
            : t.city.fromGps;
  // Nothing to confirm while locating or after GPS failed.
  const ready = choice.key !== "gps" || gps.state === "found" || gps.state === "outside";
  const confirmName = isProvinceAverage(choice.city) ? t.city.useAverage : t.city.confirm(choice.city.name);

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="city-title" className={sheetTitleClasses}>
            {t.city.title}
          </h2>
          <p className="text-sm text-text-muted">{t.city.hint}</p>
        </div>
        <SheetClose label={t.sheet.close} onClick={onClose} />
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.city.search}
        aria-label={t.city.search}
        autoComplete="off"
        enterKeyHint="search"
        className={inputClasses}
      />

      <Group>
        <fieldset className="contents">
          <legend className="px-3.5 py-3 text-body font-medium">{trimmed ? t.city.results(trimmed) : t.city.browse}</legend>
          <Card className="py-0">
            {places.length ? (
              places.map((place, i) => (
                <PlaceRow
                  key={place.key}
                  place={place}
                  checked={choice.key === place.key}
                  divided={i > 0}
                  t={t}
                  onChoose={() => setChoice({ key: place.key, city: place.city })}
                />
              ))
            ) : (
              <p className="py-3 text-body text-text-muted">{t.city.none(trimmed)}</p>
            )}
          </Card>
        </fieldset>
      </Group>

      <Group>
        <fieldset className="contents">
          <legend className="px-3.5 py-3 text-body font-medium">{t.city.notListed}</legend>
          <Card className="py-0">
            <Row
              name={t.city.useLocation}
              detail={gpsDetail}
              live
              checked={choice.key === "gps"}
              onChoose={findMe}
            />
            <Row
              name={t.city.useAverage}
              checked={choice.key === "average"}
              divided
              onChoose={() => setChoice({ key: "average", city: PROVINCE_AVERAGE })}
            />
          </Card>
        </fieldset>
      </Group>

      <div className="flex flex-col gap-2">
        <Button disabled={!ready} onClick={() => onPick(choice.city)}>
          {confirmName}
        </Button>
        <p className="text-center text-xs text-text-muted">{t.city.footnote}</p>
      </div>
    </>
  );
}

function PlaceRow({ place, checked, divided, t, onChoose }: { place: Place; checked: boolean; divided: boolean; t: Strings; onChoose: () => void }) {
  if (place.kind === "regency") {
    return <Row name={`${place.name}, ${t.city.province}`} checked={checked} divided={divided} onChoose={onChoose} />;
  }
  return (
    <Row
      name={`${place.name} (${t.city.kinds[place.kind]})`}
      detail={t.city.uses(place.city.name)}
      checked={checked}
      divided={divided}
      onChoose={onChoose}
    />
  );
}

function Row({
  name,
  detail,
  live,
  checked,
  divided,
  onChoose,
}: {
  name: string;
  detail?: string;
  /** Announce detail changes (GPS progress). */
  live?: boolean;
  checked: boolean;
  divided?: boolean;
  onChoose: () => void;
}) {
  return (
    <label className={`flex min-h-tap cursor-pointer items-center gap-3 py-2.5 ${divided ? rowDivider : ""}`}>
      <input type="radio" name="city" checked={checked} onChange={onChoose} className={radioClasses} />
      <span className="min-w-0 flex-1 text-body leading-[1.4]">{name}</span>
      {detail && (
        <span aria-live={live ? "polite" : undefined} className="max-w-[45%] text-right text-xs text-text-muted">
          {detail}
        </span>
      )}
    </label>
  );
}
