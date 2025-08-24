import {Route, Routes} from "react-router";
import MultiplicationTrainer from "./pages/MultiplicationTrainer.tsx";
import Menu from "./pages/Menu.tsx";
import RabbitJumpX9 from "./pages/JumpingRabbit.tsx";

export default function App() {
    return (
        <>
            <Routes>
                <Route path="/" element={<Menu/>}/>
                <Route path="/about" element={<h1 className="text-2xl">About Page</h1>}/>
                <Route path="/game1" element={<MultiplicationTrainer/>}/>
                <Route path="/game2" element={<RabbitJumpX9/>}/>
            </Routes>
        </>
    );
}
