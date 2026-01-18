import React from "react";
import { Outlet } from "react-router";
import {
  TelegramHeaderProvider,
  useCustomHeader,
} from "@/layout/TelegramHeader";

const CommonLayout: React.FC = () => {
  return (
    <TelegramHeaderProvider>
      <Outlet />
    </TelegramHeaderProvider>
  );
};

export default CommonLayout;
export { useCustomHeader };
