"use client";
import BackButton from "@/components/BackButton";

export default function BackButtonClient() {
  const handleClick = () => {
    window.history.back();
  };

  return (
    <div onClick={handleClick} style={{ display: "inline-block", cursor: "pointer" }}>
      <BackButton />
    </div>
  );
}