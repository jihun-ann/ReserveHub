import {Routes, Route} from "react-router-dom";
import TestHomeView from "./views/TestHomeView.jsx";
import UserView from "./views/user/UserView.jsx";
import SuperView from "./views/super/SuperView.jsx";


export default function App() {
    return (
        <>
            <Routes>
                <Route path="/" element={<TestHomeView/>}/>
                <Route path="/user" element={<UserView/>}/>
                <Route path="/subsup" element={<SuperView/>}/>
            </Routes>
        </>
    )
}