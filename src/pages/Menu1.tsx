import {Link} from "react-router";
import LanguageSelector, {LanguageSelectorMode} from "@/components/lang/LanguageSelector.tsx";
import {useTranslation} from "react-i18next";

export default function Menu() {
    const {t} = useTranslation();

    return (
        <div className="min-h-dvh w-full bg-gradient-to-br from-sky-50 to-indigo-50">
            <div className="mx-auto max-w-5xl p-6">
                <header className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">{t('menu.title')}</h1>

                    <div className="flex items-center gap-2">
                        <LanguageSelector mode={LanguageSelectorMode.FULL}/>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
                    <aside className="md:sticky md:top-4">
                        <nav
                            className="bg-white/80 backdrop-blur rounded-2xl p-3 border border-gray-200 shadow-sm max-h-[70dvh] overflow-y-auto">
                            <ul className="flex flex-col gap-2">
                                <li>
                                    <Link
                                        to="/"
                                        className="block w-full rounded-xl px-4 py-2 text-sm font-medium text-indigo-700 visited:text-indigo-700 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1"
                                    >
                                        Home
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/about"
                                        className="block w-full rounded-xl px-4 py-2 text-sm font-medium text-indigo-700 visited:text-indigo-700 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1"
                                    >
                                        About
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/multiplication-trainer1"
                                        className="block w-full rounded-xl px-4 py-2 text-sm font-semibold bg-indigo-600 text-white visited:text-white hover:bg-indigo-700 antialiased drop-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1"
                                    >
                                        Multiplication Trainer 1
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/multiplication-trainer2"
                                        className="block w-full rounded-xl px-4 py-2 text-sm font-semibold bg-indigo-600 text-white visited:text-white hover:bg-indigo-700 antialiased drop-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1"
                                    >
                                        Multiplication Trainer 2
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/multiplication-rabbit"
                                        className="block w-full rounded-xl px-4 py-2 text-sm font-semibold bg-indigo-600 text-white visited:text-white hover:bg-indigo-700 antialiased drop-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1"
                                    >
                                        Jumping Rabbit
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/rounding-trainer"
                                        className="block w-full rounded-xl px-4 py-2 text-sm font-semibold bg-indigo-600 text-white visited:text-white hover:bg-indigo-700 antialiased drop-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1"
                                    >
                                        Rounding Trainer
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/rounding-trainer2"
                                        className="block w-full rounded-xl px-4 py-2 text-sm font-semibold bg-indigo-600 text-white visited:text-white hover:bg-indigo-700 antialiased drop-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1"
                                    >
                                        Rounding Trainer 2
                                    </Link>
                                </li>
                            </ul>
                        </nav>
                    </aside>

                    <main className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-gray-200 shadow">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome</h2>
                        <p className="text-gray-700">Choose a trainer from the menu to start practicing.</p>
                    </main>
                </div>
            </div>
        </div>
    );
}
