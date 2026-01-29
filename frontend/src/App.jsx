import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";

import Landing from "./pages/Landing";
import UserDashboard from "./pages/UserDashboard";
import DeliveryDashboard from "./pages/deliveryDashboard";
import IntroAnimation from "./pages/IntroAnimation";

function App() {
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 6500); // 6–7 seconds intro

    return () => clearTimeout(timer);
  }, []);

  // 🔥 Show animation FIRST
  if (showIntro) {
    return <IntroAnimation />;
  }

  // 🔥 Then load full app with routing
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/user-dashboard" element={<UserDashboard />} />
        <Route path="/delivery-dashboard" element={<DeliveryDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
