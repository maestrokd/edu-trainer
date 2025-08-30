import {Route, Routes} from "react-router";
import MultiplicationTrainer1 from "./pages/MultiplicationTrainer1.tsx";
import Menu from "./pages/Menu.tsx";
import RabbitJumpX9 from "./pages/JumpingRabbit.tsx";
import MultiplicationTrainer2 from "@/pages/multiplication-trainer/MultiplicationTrainer2.tsx";

export default function App() {
    return (
        <>
            <Routes>
                <Route path="/" element={<Menu/>}/>
                <Route path="/about" element={<h1 className="text-2xl">About Page</h1>}/>
                <Route path="/multiplication-trainer1" element={<MultiplicationTrainer1/>}/>
                <Route path="/multiplication-trainer2" element={<MultiplicationTrainer2/>}/>
                <Route path="/multiplication-rabbit" element={<RabbitJumpX9/>}/>
            </Routes>
        </>
    );
}
