import {Routes, Route} from "react-router-dom";
import TestHomeView from "./views/TestHomeView.jsx";
import UserView from "./views/user/UserView.jsx";
import SuperView from "./views/super/SuperView.jsx";
import TutorView from "./views/tutor/TutorView.jsx";


export default function App() {
    return (
        <>
            <nav>

            </nav>
            <Routes>
                <Route path="/" element={<TestHomeView/>}/>
                <Route path="/user" element={<UserView/>}/>
                <Route path="/tutor" element={<TutorView/>}/>
                <Route path="/subsup" element={<SuperView/>}/>
            </Routes>
        </>
    )
}