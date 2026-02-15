import { Outlet, Route, Routes } from "react-router";
import RabbitJumpX9 from "./pages/jumping-rabbit/JumpingRabbit.tsx";
import MultiplicationTrainer from "@/pages/multiplication-trainer/MultiplicationTrainer.tsx";
import CompareNumbersGame from "@/pages/compare-numbers/CompareNumbersGame.tsx";
import RoundingGame from "@/pages/rounding-trainer/RoundingGame.tsx";
import AddSubTrainer from "@/pages/add-sub-trainer/AddSubTrainer.tsx";
import CommonLayout from "@/layout/CommonLayout.tsx";
import RegistrationPage from "@/pages/login/RegistrationPage.tsx";
import DefaultLayout from "@/layout/DefaultLayout.tsx";
import ResetPasswordPage from "@/pages/login/ResetPasswordPage.tsx";
import LoginPage from "@/pages/login/LoginPage.tsx";
import PrivateRoute from "@/components/PrivateRoute.tsx";
import WebLayout from "./layout/WebLayout.tsx";
import { Navigate } from "react-router-dom";
import SettingsPage from "@/pages/SettingsPage.tsx";
import SubscriptionPage from "@/pages/subscriptions/SubscriptionPage.tsx";
import MenuPage from "@/pages/MenuPage.tsx";
import AuthorityRoute from "@/components/AuthorityRoute.tsx";
import SecondaryProfilesPage from "@/pages/profiles/SecondaryProfilesPage.tsx";
import CreateSecondaryProfilePage from "@/pages/profiles/CreateSecondaryProfilePage.tsx";
import EditSecondaryProfilePage from "@/pages/profiles/EditSecondaryProfilePage.tsx";
import PictureChooseGame from "@/pages/picture-choose/PictureChooseGame.tsx";

export default function App() {
  return (
    <Routes>
      <Route
        path="register"
        element={
          <DefaultLayout>
            <RegistrationPage />
          </DefaultLayout>
        }
      />
      <Route
        path="password/reset"
        element={
          <DefaultLayout>
            <ResetPasswordPage />
          </DefaultLayout>
        }
      />
      <Route
        path="login"
        element={
          <DefaultLayout>
            <LoginPage />
          </DefaultLayout>
        }
      />
      <Route
        path="telegram/login"
        element={
          <DefaultLayout>
            <LoginPage />
          </DefaultLayout>
        }
      />
      <Route
        element={
          <WebLayout>
            <Outlet />
          </WebLayout>
        }
      >
        <Route path="/" element={<MenuPage />} />

        <Route element={<PrivateRoute />}>
          <Route element={<AuthorityRoute authority="MANAGE_SUBSCRIPTIONS" />}>
            <Route path="subscriptions" element={<SubscriptionPage />} />
          </Route>

          <Route element={<AuthorityRoute authority="MANAGE_PROFILES" />}>
            <Route path="settings" element={<SettingsPage />} />
            <Route path="settings/profiles" element={<SecondaryProfilesPage />} />
            <Route path="settings/profiles/create" element={<CreateSecondaryProfilePage />} />
            <Route path="settings/profiles/:id/edit" element={<EditSecondaryProfilePage />} />
          </Route>
        </Route>
      </Route>

      <Route element={<CommonLayout />}>
        <Route path="/about" element={<h1 className="text-2xl">About Page</h1>} />
        <Route path="/multiplication-trainer" element={<MultiplicationTrainer />} />
        <Route path="/multiplication-rabbit" element={<RabbitJumpX9 />} />
        <Route path="/compare-numbers" element={<CompareNumbersGame />} />
        <Route path="/rounding-trainer" element={<RoundingGame />} />
        <Route path="/add-sub-trainer" element={<AddSubTrainer />} />
        <Route path="/picture-choose" element={<PictureChooseGame />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
