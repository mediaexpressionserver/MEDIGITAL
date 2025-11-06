"use client";
import { useEffect } from "react";
import BackButton from "@/components/BackButton";

export default function BackButtonClient() {
  const handleClick = () => {
    // Set a flag before going back
    sessionStorage.setItem("scrollAfterBack", "true");
    window.history.back();
  };

  // Run after the component mounts to handle scroll after back navigation
  useEffect(() => {
    if (sessionStorage.getItem("scrollAfterBack") === "true") {
      sessionStorage.removeItem("scrollAfterBack");
      window.scrollBy(0, 10);
    }
  }, []);

  return (
    <div onClick={handleClick} style={{ display: "inline-block", cursor: "pointer" }}>
      <BackButton />
    </div>
  );
}