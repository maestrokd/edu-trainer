import React from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Volume2, Settings, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ModeToggle } from "@/components/theme/mode-toggle.tsx";
import LanguageSelector, { LanguageSelectorMode } from "@/components/lang/LanguageSelector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { cn } from "@/lib/utils";
import {
  DEFAULT_PICTURE_LIBRARY,
  generateExercise,
  type PictureChooseExercise,
  type PictureItem,
} from "@/lib/picture-choose/library";

type Screen = "setup" | "play";

export default function PictureChooseGame() {
  const { t, i18n } = useTranslation();
  const tr = React.useCallback(
    (key: string, options?: Record<string, unknown>) => t(`picChooseT.${key}`, options),
    [t]
  );

  const [screen, setScreen] = React.useState<Screen>("setup");
  const [exercise, setExercise] = React.useState<PictureChooseExercise | null>(null);
  const [correctCount, setCorrectCount] = React.useState(0);
  const [wrongCount, setWrongCount] = React.useState(0);
  const [feedback, setFeedback] = React.useState<"correct" | "wrong" | null>(null);
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);

  const categories = React.useMemo(() => {
    const cats = new Set(DEFAULT_PICTURE_LIBRARY.map((item) => item.category));
    return Array.from(cats);
  }, []);

  const filteredLibrary = React.useMemo(() => {
    if (selectedCategories.length === 0) return DEFAULT_PICTURE_LIBRARY;
    return DEFAULT_PICTURE_LIBRARY.filter((item) => selectedCategories.includes(item.category));
  }, [selectedCategories]);

  const playSound = React.useCallback(
    (text: string) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = i18n.language === "uk" ? "uk-UA" : i18n.language === "ru" ? "ru-RU" : "en-US";
      window.speechSynthesis.speak(utterance);
    },
    [i18n.language]
  );

  const startNewExercise = React.useCallback(() => {
    const nextExercise = generateExercise(filteredLibrary);
    setExercise(nextExercise);
    setFeedback(null);
    if (nextExercise) {
      // Small delay before playing sound automatically if needed,
      // but the requirement says "when you press the sound button".
    }
  }, [filteredLibrary]);

  const handleStart = React.useCallback(() => {
    setScreen("play");
    setCorrectCount(0);
    setWrongCount(0);
    startNewExercise();
  }, [startNewExercise]);

  const handleSelect = React.useCallback(
    (item: PictureItem) => {
      if (!exercise || feedback === "correct") return;

      if (item.id === exercise.target.id) {
        setFeedback("correct");
        setCorrectCount((c) => c + 1);
        playSound(tr("play.feedback.correct"));
        setTimeout(() => {
          startNewExercise();
        }, 1500);
      } else {
        setFeedback("wrong");
        setWrongCount((w) => w + 1);
        playSound(tr("play.feedback.wrong"));
        setTimeout(() => setFeedback(null), 1000);
      }
    },
    [exercise, feedback, playSound, tr, startNewExercise]
  );

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };

  return (
    <div className="min-h-dvh w-full relative flex flex-col p-4 overflow-hidden bg-[#0a0a0a]">
      {/* Background with black dots and rainbow halos */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(255, 0, 0, 0.2), transparent 40%),
            radial-gradient(circle at 20% 30%, rgba(0, 255, 0, 0.2), transparent 40%),
            radial-gradient(circle at 80% 70%, rgba(0, 0, 255, 0.2), transparent 40%),
            radial-gradient(circle at 10% 80%, rgba(255, 255, 0, 0.2), transparent 40%),
            radial-gradient(circle at 90% 20%, rgba(255, 0, 255, 0.2), transparent 40%)
          `,
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, #000 1.5px, transparent 1.5px)",
            backgroundSize: "30px 30px",
          }}
        />
      </div>

      <div className="relative z-10 w-full flex flex-col h-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="text-white hover:text-primary transition-colors">
            <ArrowLeft className="size-8" />
          </Link>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <LanguageSelector mode={LanguageSelectorMode.ICON} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="bg-white/10 text-white border-white/20">
                  <Settings className="size-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{tr("title")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setScreen("setup")}>{tr("actions.changeSetup")}</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleStart}>{tr("actions.newSession")}</DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/">{tr("actions.toMenu")}</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {screen === "setup" ? (
          <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white animate-in zoom-in-95 duration-300">
            <CardContent className="p-8 space-y-6">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <Settings className="size-8" />
                {tr("setup.title")}
              </h2>
              <p className="text-white/70">{tr("setup.intro")}</p>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold">{tr("setup.categories")}</h3>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant={selectedCategories.length === 0 ? "default" : "outline"}
                    className={cn(
                      "rounded-full border-white/20",
                      selectedCategories.length === 0 ? "bg-primary text-white" : "text-white hover:bg-white/10"
                    )}
                    onClick={() => setSelectedCategories([])}
                  >
                    {tr("setup.allCategories")}
                  </Button>
                  {categories.map((cat) => (
                    <Button
                      key={cat}
                      variant={selectedCategories.includes(cat) ? "default" : "outline"}
                      className={cn(
                        "rounded-full border-white/20",
                        selectedCategories.includes(cat) ? "bg-primary text-white" : "text-white hover:bg-white/10"
                      )}
                      onClick={() => toggleCategory(cat)}
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleStart}
                size="lg"
                className="w-full text-xl h-14 bg-white text-black hover:bg-white/90 font-bold rounded-2xl"
              >
                {tr("setup.start")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-500">
            {/* Speaker Button */}
            <Button
              onClick={() => exercise && playSound(exercise.target.name)}
              size="lg"
              className="size-40 rounded-full bg-white text-black hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)] group"
            >
              <Volume2 className="size-24 group-hover:scale-110 transition-transform" />
              <span className="sr-only">{tr("aria.playSound")}</span>
            </Button>

            <p className="text-white/80 text-xl font-medium tracking-wide">{tr("play.instruction")}</p>

            {/* Picture Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-4xl px-4">
              {exercise?.options.map((item, idx) => (
                <button
                  key={item.id + idx}
                  onClick={() => handleSelect(item)}
                  className={cn(
                    "aspect-square rounded-[32px] bg-white p-4 shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 group relative overflow-hidden",
                    feedback === "correct" && item.id === exercise.target.id ? "ring-8 ring-emerald-500" : "",
                    feedback === "wrong" && item.id !== exercise.target.id ? "opacity-50 grayscale" : ""
                  )}
                >
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                  {feedback === "correct" && item.id === exercise.target.id && (
                    <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center animate-in zoom-in duration-300">
                      <div className="bg-white rounded-full p-4 shadow-lg">
                        <span className="text-4xl">✅</span>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Stats */}
            <div className="flex gap-8 text-white/60 text-lg font-medium pt-8">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">{tr("stats.correct")}:</span>
                <span className="text-white">{correctCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-rose-400">{tr("stats.wrong")}:</span>
                <span className="text-white">{wrongCount}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
