import "./App.css";
import { Routes, Route } from "react-router-dom";
import MatchCenter from "./pages/match/MatchCenter";
import MainHome from "./pages/home/MainHome";
import Setting from "./pages/setting/setting";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Signin from "./pages/auth/Signin";
import Waiting from "./pages/commentary/Waiting";

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<MainHome />} />
        <Route path="/match-center" element={<MatchCenter />} />
        <Route path="/setting" element={<Setting />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/waiting" element={<Waiting />} />
      </Routes>
    </div>
  );
}

export default App;
