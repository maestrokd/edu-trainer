import { Outlet, Route, Routes } from "react-router";
import RabbitJumpX9 from "./pages/jumping-rabbit/JumpingRabbit.tsx";
import { MultiplicationTrainerPage } from "@/features/multiplication-trainer";
import { CompareNumbersTrainerPage } from "@/features/compare-numbers-trainer";
import { RoundingTrainerPage } from "@/features/rounding-trainer";
import { AddSubTrainerPage } from "@/features/add-sub-trainer";
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
import { Authority } from "@/contexts/AuthContext.tsx";
import SecondaryProfilesPage from "@/pages/profiles/SecondaryProfilesPage.tsx";
import CreateSecondaryProfilePage from "@/pages/profiles/CreateSecondaryProfilePage.tsx";
import EditSecondaryProfilePage from "@/pages/profiles/EditSecondaryProfilePage.tsx";
import EnglishCoachPage from "@/pages/EnglishCoachPage.tsx";
import CreateTenantInvitationPage from "@/pages/invitations/CreateTenantInvitationPage.tsx";
import AcceptTenantInvitationPage from "@/pages/invitations/AcceptTenantInvitationPage.tsx";
import InvitationRegistrationPage from "@/pages/invitations/InvitationRegistrationPage.tsx";
import TenantInvitationSuccessPage from "@/pages/invitations/TenantInvitationSuccessPage.tsx";
import TenantProfilesPage from "@/pages/tenant/TenantProfilesPage.tsx";
import TenantInvitationsPage from "@/pages/tenant/TenantInvitationsPage.tsx";
import SelectTenantPage from "@/pages/tenant/SelectTenantPage.tsx";

import { usePageTitle } from "@/hooks/usePageTitle.ts";

export default function App() {
  usePageTitle();
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
        path="auth/invitations/:token"
        element={
          <DefaultLayout>
            <AcceptTenantInvitationPage />
          </DefaultLayout>
        }
      />
      <Route
        path="auth/invitations/:token/register"
        element={
          <DefaultLayout>
            <InvitationRegistrationPage />
          </DefaultLayout>
        }
      />
      <Route
        path="auth/invitations/:token/success"
        element={
          <DefaultLayout>
            <TenantInvitationSuccessPage />
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
          <Route path="settings/tenants/select" element={<SelectTenantPage />} />

          <Route element={<AuthorityRoute authority={Authority.MANAGE_PROFILES} />}>
            <Route path="settings/tenant-profiles" element={<TenantProfilesPage />} />
          </Route>

          <Route element={<AuthorityRoute authority={Authority.MANAGE_SUBSCRIPTIONS} requireTenantOwner />}>
            <Route path="subscriptions" element={<SubscriptionPage />} />
          </Route>

          <Route element={<AuthorityRoute authority={Authority.MANAGE_PROFILES} requireTenantOwner />}>
            <Route path="settings" element={<SettingsPage />} />
            <Route path="settings/profiles" element={<SecondaryProfilesPage />} />
            <Route path="settings/profiles/create" element={<CreateSecondaryProfilePage />} />
            <Route path="settings/profiles/:id/edit" element={<EditSecondaryProfilePage />} />
            <Route path="settings/tenant-invitations" element={<TenantInvitationsPage />} />
            <Route path="settings/tenant-invitations/create" element={<CreateTenantInvitationPage />} />
            <Route path="settings/profiles/invitations/create" element={<CreateTenantInvitationPage />} />
          </Route>

          <Route element={<AuthorityRoute authority={Authority.ENGLISH_COACH_OPENAI} />}>
            <Route path="english-coach" element={<EnglishCoachPage />} />
          </Route>
        </Route>
      </Route>

      <Route element={<CommonLayout />}>
        <Route path="/about" element={<h1 className="text-2xl">About Page</h1>} />
        <Route path="/multiplication-trainer" element={<MultiplicationTrainerPage />} />
        <Route path="/multiplication-rabbit" element={<RabbitJumpX9 />} />
        <Route path="/compare-numbers" element={<CompareNumbersTrainerPage />} />
        <Route path="/rounding-trainer" element={<RoundingTrainerPage />} />
        <Route path="/add-sub-trainer" element={<AddSubTrainerPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
