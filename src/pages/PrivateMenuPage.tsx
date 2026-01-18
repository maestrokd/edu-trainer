import React from "react";
import { useCustomHeader } from "@/layout/TelegramHeader";

const PrivateMenuPage: React.FC = () => {
  const headerNode = React.useMemo(
    () => (
      <div className="flex items-center justify-center-safe w-full h-full px-2">
        <span className="text-lg font-semibold leading-none">
          Private Menu
        </span>
      </div>
    ),
    [],
  );

  useCustomHeader(headerNode, { visible: true, deps: [headerNode] });

  return (
    <section className="px-4 py-6">
      <h1 className="text-2xl font-semibold">Private Menu</h1>
    </section>
  );
};

export default PrivateMenuPage;
