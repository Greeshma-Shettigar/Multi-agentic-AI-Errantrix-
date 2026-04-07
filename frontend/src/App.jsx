import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Landing from "./pages/Landing";
import UserDashboard from "./pages/UserDashboard";
import DeliveryDashboard from "./pages/deliveryDashboard";
import IntroAnimation from "./pages/IntroAnimation";

function App() {
  const token = localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>
        {/* Default route */}
        <Route path="/" element={token ? <Landing /> : <IntroAnimation />} />

        {/* After intro finishes it navigates to /login */}
        <Route path="/login" element={<Landing />} />

        {/* Protected routes */}
        <Route
          path="/user-dashboard"
          element={ <UserDashboard />}
        />

        <Route
          path="/delivery-dashboard"
          element={<DeliveryDashboard /> }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
