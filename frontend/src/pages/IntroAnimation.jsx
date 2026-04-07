import React from "react";
import "../styles/IntroAnimation.css";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import earth from "../assets/earth.png";
import scooter from "../assets/scooter.png";

function IntroAnimation() {
  const navigate = useNavigate();

 // useEffect(() => {
    // 🔥 Check if intro already seen
    // const introSeen = localStorage.getItem("introSeen");
    // let userId = localStorage.getItem("userId");
    // if (introSeen) {
    //   console.log("Hello");
    //   userId?navigate("/user-dashboard"):navigate("/login"); // skip intro completely
    //   return;
    // }

    // ⏳ Show intro only first time
    if(!localStorage.getItem("userId")){
      console.log("Hello");
     setTimeout(() => {
      //localStorage.setItem("introSeen", "true"); // mark as seen
      navigate("/login");
    }, 6000); // adjust animation duration
  }
    //return () => clearTimeout(timer);
 // }, []);

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
