import {Route, Routes} from "react-router";
import MultiplicationTrainer1 from "./pages/MultiplicationTrainer1.tsx";
import Menu from "./pages/Menu1.tsx";
import MenuPage from "./pages/Menu.tsx";
import RabbitJumpX9 from "./pages/JumpingRabbit.tsx";
import MultiplicationTrainer2 from "@/pages/multiplication-trainer/MultiplicationTrainer2.tsx";
import CompareNumbersGame from "@/pages/compare-numbers/CompareNumbersGame.tsx";
import RoundingTrainer from "@/pages/rounding-trainer/RoundingTrainer.tsx";
import RoundingGame from "@/pages/rounding-trainer/RoundingGame.tsx";
import CommonLayout from "@/layout/CommonLayout.tsx";

export default function App() {
    return (
        <Routes>
            <Route element={<CommonLayout/>}>
                <Route path="/old" element={<Menu/>}/>
                <Route path="/" element={<MenuPage/>}/>
                <Route path="/about" element={<h1 className="text-2xl">About Page</h1>}/>
                <Route path="/multiplication-trainer1" element={<MultiplicationTrainer1/>}/>
                <Route path="/multiplication-trainer2" element={<MultiplicationTrainer2/>}/>
                <Route path="/multiplication-rabbit" element={<RabbitJumpX9/>}/>
                <Route path="/compare-numbers" element={<CompareNumbersGame/>}/>
                <Route path="/rounding-trainer" element={<RoundingTrainer/>}/>
                <Route path="/rounding-trainer2" element={<RoundingGame/>}/>
            </Route>
        </Routes>
    );
}
