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

import { usePageTitle } from "@/hooks/usePageTitle.ts";

import {
  FamilyTaskDashboardPage,
  TodayPage,
  SharedDisplayPage,
  ChoresPage,
  ChoreDetailsPage,
  RoutinesPage,
  RoutineDetailsPage,
  ApprovalsPage,
  RewardsPage,
  RewardDetailsPage,
  RewardRedemptionsPage,
  ListsPage,
  ListDetailsPage,
  CalendarPage,
  EventDetailsPage,
  ProfilesPage,
  ProfileDetailsPage,
  InvitationsPage,
  DevicesPage,
  DeviceDetailsPage,
  FamilyTaskSettingsPage,
} from "@/features/familyTaskManager";
import { BidDashboardPage, BidDetailsPage } from "@/features/bidManager";

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
        element={
          <WebLayout>
            <Outlet />
          </WebLayout>
        }
      >
        <Route path="/" element={<MenuPage />} />

        <Route element={<PrivateRoute />}>
          <Route path="mailboxes/bids" element={<BidDashboardPage />} />
          <Route path="mailboxes/:mailboxId/bids" element={<BidDashboardPage />} />
          <Route path="mailboxes/:mailboxId/bids/:bidId" element={<BidDetailsPage />} />

          <Route element={<AuthorityRoute authority={Authority.MANAGE_SUBSCRIPTIONS} />}>
            <Route path="subscriptions" element={<SubscriptionPage />} />
          </Route>

          <Route element={<AuthorityRoute authority={Authority.MANAGE_PROFILES} />}>
            <Route path="settings" element={<SettingsPage />} />
            <Route path="settings/profiles" element={<SecondaryProfilesPage />} />
            <Route path="settings/profiles/create" element={<CreateSecondaryProfilePage />} />
            <Route path="settings/profiles/:id/edit" element={<EditSecondaryProfilePage />} />
          </Route>

          <Route element={<AuthorityRoute authority={Authority.ENGLISH_COACH_OPENAI} />}>
            <Route path="english-coach" element={<EnglishCoachPage />} />
          </Route>

          <Route element={<AuthorityRoute authority={Authority.FAMILY_TASK_MANAGER} />}>
            <Route path="family-tasks" element={<FamilyTaskDashboardPage />} />
            <Route path="family-tasks/today" element={<TodayPage />} />
            <Route path="family-tasks/rewards" element={<RewardsPage />} />
            <Route path="family-tasks/lists" element={<ListsPage />} />
            <Route path="family-tasks/lists/:listUuid" element={<ListDetailsPage />} />
            <Route path="family-tasks/calendar" element={<CalendarPage />} />
            <Route path="family-tasks/devices" element={<DevicesPage />} />
            <Route path="family-tasks/display" element={<SharedDisplayPage />} />

            <Route element={<AuthorityRoute authority={Authority.MANAGE_PROFILES} />}>
              <Route path="family-tasks/tasks" element={<Navigate to="/family-tasks/tasks/chores" replace />} />
              <Route path="family-tasks/tasks/chores" element={<ChoresPage />} />
              <Route path="family-tasks/tasks/chores/:choreUuid" element={<ChoreDetailsPage />} />
              <Route path="family-tasks/tasks/routines" element={<RoutinesPage />} />
              <Route path="family-tasks/tasks/routines/:routineUuid" element={<RoutineDetailsPage />} />
              <Route path="family-tasks/approvals" element={<ApprovalsPage />} />
              <Route path="family-tasks/chores" element={<ChoresPage />} />
              <Route path="family-tasks/chores/:choreUuid" element={<ChoreDetailsPage />} />
              <Route path="family-tasks/routines" element={<RoutinesPage />} />
              <Route path="family-tasks/routines/:routineUuid" element={<RoutineDetailsPage />} />
              <Route path="family-tasks/redemptions" element={<RewardRedemptionsPage />} />
              <Route path="family-tasks/rewards/redemptions" element={<RewardRedemptionsPage />} />
              <Route path="family-tasks/rewards/:rewardUuid" element={<RewardDetailsPage />} />
              <Route path="family-tasks/calendar/events/new" element={<EventDetailsPage />} />
              <Route path="family-tasks/calendar/events/:eventUuid" element={<EventDetailsPage />} />
              <Route path="family-tasks/profiles" element={<ProfilesPage />} />
              <Route path="family-tasks/profiles/:profileUuid" element={<ProfileDetailsPage />} />
              <Route path="family-tasks/invitations" element={<InvitationsPage />} />
              <Route path="family-tasks/devices/new" element={<DeviceDetailsPage />} />
              <Route path="family-tasks/devices/:deviceUuid" element={<DeviceDetailsPage />} />
              <Route path="family-tasks/settings" element={<FamilyTaskSettingsPage />} />
            </Route>
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
