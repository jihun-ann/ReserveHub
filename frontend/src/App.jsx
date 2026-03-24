import {Routes, Route} from "react-router-dom";
import TestHomeView from "./views/TestHomeView.jsx";
import UserView from "./views/user/UserView.jsx";
import UserViewNav from "./nav/user/UserViewNav.jsx";


export default function App() {
    return (
        <>
            <Routes>
                <Route path="/" element={<TestHomeView/>}/>
                <Route path="/user" element={<UserView/>}/>
            </Routes>
        </>
    )
}