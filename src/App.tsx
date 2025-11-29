import { Route, Routes } from "react-router";
import MenuPage from "./pages/Menu.tsx";
import RabbitJumpX9 from "./pages/jumping-rabbit/JumpingRabbit.tsx";
import MultiplicationTrainer from "@/pages/multiplication-trainer/MultiplicationTrainer.tsx";
import CompareNumbersGame from "@/pages/compare-numbers/CompareNumbersGame.tsx";
import RoundingGame from "@/pages/rounding-trainer/RoundingGame.tsx";
import CommonLayout from "@/layout/CommonLayout.tsx";
import SignInPage from "@/pages/auth/SignInPage.tsx";
import SignUpPage from "@/pages/auth/SignUpPage.tsx";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage.tsx";
import EmailVerificationPage from "@/pages/auth/EmailVerificationPage.tsx";

export default function App() {
  return (
    <Routes>
      <Route element={<CommonLayout />}>
        <Route path="/" element={<MenuPage />} />
        <Route
          path="/about"
          element={<h1 className="text-2xl">About Page</h1>}
        />
        <Route
          path="/multiplication-trainer"
          element={<MultiplicationTrainer />}
        />
        <Route path="/multiplication-rabbit" element={<RabbitJumpX9 />} />
        <Route path="/compare-numbers" element={<CompareNumbersGame />} />
        <Route path="/rounding-trainer" element={<RoundingGame />} />
        <Route path="/auth/sign-in" element={<SignInPage />} />
        <Route path="/auth/sign-up" element={<SignUpPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/verify-email" element={<EmailVerificationPage />} />
      </Route>
    </Routes>
  );
}
