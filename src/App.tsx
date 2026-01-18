import {Outlet, Route, Routes} from "react-router";
import MenuPage from "./pages/Menu.tsx";
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
import {Navigate} from "react-router-dom";
import SettingsPage from "@/pages/SettingsPage.tsx";
import SubscriptionPage from "@/pages/subscriptions/SubscriptionPage.tsx";
import PrivateMenuPage from "@/pages/PrivateMenuPage.tsx";

export default function App() {
  return (
    <Routes>
      <Route path="register" element={<DefaultLayout><RegistrationPage/></DefaultLayout>}/>
      <Route path="password/reset" element={<DefaultLayout><ResetPasswordPage/></DefaultLayout>}/>
      <Route path="login" element={<DefaultLayout><LoginPage/></DefaultLayout>}/>
      <Route path="telegram/login" element={<DefaultLayout><LoginPage/></DefaultLayout>}/>
      <Route element={<PrivateRoute/>}>
          <Route element={<WebLayout><Outlet/></WebLayout>}>
              <Route path="private-menu" element={<PrivateMenuPage/>}/>
              <Route path="settings" element={<SettingsPage/>}/>
              <Route path="subscriptions" element={<SubscriptionPage/>}/>
          </Route>
          <Route path="*" element={<Navigate to="/" replace/>}/>
      </Route>
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
        <Route path="/add-sub-trainer" element={<AddSubTrainer />} />
      </Route>
    </Routes>
  );
}
