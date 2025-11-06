"use client";
import { useEffect } from "react";

export default function ScrollAfterBack() {
  useEffect(() => {
    if (sessionStorage.getItem("scrollAfterBack") === "true") {
      sessionStorage.removeItem("scrollAfterBack");
      window.scrollBy(0, 10);
    }
  }, []);
  return null;
}