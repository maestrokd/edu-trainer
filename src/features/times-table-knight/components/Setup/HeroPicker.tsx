import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Hero, SkinId } from "../../model/game.types";
import { SKIN_PRICES } from "../../model/game.constants";
import { SKIN_COLORS } from "../../game/render";
import { KnightPreview } from "./KnightPreview";

interface HeroPickerProps {
  hero: Hero;
  skin: SkinId;
  ownedSkins: SkinId[];
  wallet: number;
  onHeroChange: (hero: Hero) => void;
  onSkinSelect: (skin: SkinId) => void;
  /** returns false when the wallet is too thin */
  onBuySkin: (skin: SkinId) => boolean;
  disabled?: boolean;
}

const HEROES: Hero[] = ["dame", "sir"];
const SKINS: SkinId[] = ["steel", "crimson", "azure", "gold"];

export function HeroPicker({
  hero,
  skin,
  ownedSkins,
  wallet,
  onHeroChange,
  onSkinSelect,
  onBuySkin,
  disabled,
}: HeroPickerProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label={t("timesTableKnight.setup.hero")} className="grid grid-cols-2 gap-3">
        {HEROES.map((value) => (
          <Card
            key={value}
            role="radio"
            aria-checked={hero === value}
            tabIndex={disabled ? -1 : 0}
            onClick={() => !disabled && onHeroChange(value)}
            onKeyDown={(e) => {
              if (!disabled && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onHeroChange(value);
              }
            }}
            className={cn(
              "cursor-pointer transition-colors select-none text-center",
              hero === value ? "border-primary ring-2 ring-primary/40 bg-primary/5" : "hover:border-primary/40",
              disabled && "opacity-50 pointer-events-none"
            )}
          >
            <CardContent className="p-3 flex flex-col items-center gap-1">
              <KnightPreview hero={value} skin={skin} />
              <span className="font-semibold">{t(`timesTableKnight.hero.${value}`)}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t("timesTableKnight.hero.skinTitle")}</span>
          <span className="text-sm text-muted-foreground">🪙 {t("timesTableKnight.hero.coins", { count: wallet })}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SKINS.map((s) => {
            const owned = ownedSkins.includes(s);
            const price = SKIN_PRICES[s];
            return (
              <div
                key={s}
                className={cn(
                  "rounded-xl border p-2 flex flex-col items-center gap-1",
                  skin === s && "border-primary ring-2 ring-primary/40"
                )}
              >
                <button
                  type="button"
                  disabled={disabled || !owned}
                  onClick={() => onSkinSelect(s)}
                  aria-pressed={skin === s}
                  aria-label={t(`timesTableKnight.hero.skin.${s}`)}
                  className={cn("flex flex-col items-center gap-1", !owned && "opacity-60")}
                >
                  <span
                    className="size-8 rounded-full border-2"
                    style={{ background: SKIN_COLORS[s].base, borderColor: SKIN_COLORS[s].dark }}
                    aria-hidden
                  />
                  <span className="text-xs font-medium">{t(`timesTableKnight.hero.skin.${s}`)}</span>
                </button>
                {!owned && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs px-2"
                    disabled={disabled || wallet < price}
                    onClick={() => onBuySkin(s)}
                  >
                    {t("timesTableKnight.hero.buy", { price })}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
