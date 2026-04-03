import {Routes, Route} from "react-router-dom";
import TestHomeView from "./views/TestHomeView.jsx";
import UserView from "./views/user/UserView.jsx";
import TutorView_back from "./views/tutor/TutorView_back.jsx";
import SubsupView from "./views/subsup/SubsupView.jsx";
// import SuperView from "./views/super/SuperView.jsx";


export default function App() {
    return (
        <>
            <nav>

            </nav>
            <Routes>
                <Route path="/" element={<TestHomeView/>}/>
                <Route path="/user" element={<UserView/>}/>
                <Route path="/tutor" element={<TutorView_back/>}/>
                <Route path="/subsup" element={<SubsupView/>}/>
                {/*<Route path="/super" element={<SuperView/>}/>*/}
            </Routes>
        </>
    )
}
