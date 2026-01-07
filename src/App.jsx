import "./App.css";
import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useDataStore } from "../stores/DataStore";

import MatchCenter from "./pages/match/MatchCenter";
import MainHome from "./pages/home/MainHome";
import Setting from "./pages/setting/setting";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Signin from "./pages/auth/Signin";
import Waiting from "./pages/commentary/Waiting";
import Request from "./pages/commentary/Request";

function App() {
  const setTimeFromDate = useDataStore((s) => s.setTimeFromDate);
  useEffect(() => {
    const id = setInterval(() => {
      setTimeFromDate(new Date());
    }, 1000);

    return () => clearInterval(id);
  }, [setTimeFromDate]);

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
        <Route path="/request" element={<Request />} />
      </Routes>
    </div>
  );
}

export default App;
