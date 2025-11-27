import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type GameItem, games as allGames } from "./menuItems";
import { isFavorite, toggleFavorite } from "@/services/favoritesService";
import { pushRecent } from "@/services/recentsService";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Star, StarOff } from "lucide-react";

type Props = { game: GameItem };

export default function GameCard({ game }: Props) {
  const { t } = useTranslation();
  const nav = useNavigate();
  const Icon = game.icon;
  const [fav, setFav] = React.useState<boolean>(() => isFavorite(game.id));

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Icon className="size-5 shrink-0" aria-hidden />
          <CardTitle className="text-base font-semibold">
            {t(game.titleKey)}
          </CardTitle>
          {game.badge && (
            <Badge variant="secondary" className="ml-auto">
              {game.badge.toUpperCase()}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {game.descriptionKey && (
          <p className="text-sm text-muted-foreground">
            {t(game.descriptionKey)}
          </p>
        )}
        <div className="flex gap-2">
          <Button
            onClick={() => {
              pushRecent(game.id);
              nav(game.path);
            }}
          >
            {t("menu.play")}
          </Button>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                aria-pressed={fav}
                onClick={() =>
                  setFav(
                    isFavorite(
                      toggleFavorite(game.id).has(game.id) ? game.id : game.id,
                    ),
                  )
                }
              >
                {fav ? (
                  <Star className="size-5" />
                ) : (
                  <StarOff className="size-5" />
                )}
                <span className="sr-only">
                  {fav ? t("menu.unfavorite") : t("menu.favorite")}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {fav ? t("menu.unfavorite") : t("menu.favorite")}
            </TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
}

// tiny helper if you ever need it elsewhere
export function getGameById(id: string) {
  return allGames.find((g) => g.id === id);
}
