import React from "react";
import "../styles/IntroAnimation.css";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import earth from "../assets/earth.png";
import scooter from "../assets/scooter.png";

function IntroAnimation() {
  
  return (
    <div className="intro-container">
      {/* 🌍 Earth */}
      <img src={earth} className="earth" alt="" />

      {/* 📝 Brand */}
      <div className="brand">
        ERRANTRI<span className="x">X</span>
      </div>

      {/* 🛵 Scooter + Smoke */}
      <div className="scooter-wrapper">
        <img src={scooter} className="scooter" alt="" draggable="false" />

        {/* 💨 Smoke */}
        <div className="smoke">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
}

export default IntroAnimation;
