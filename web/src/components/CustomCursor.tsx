"use client";

import { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";

export default function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    // Hide default cursor
    document.body.style.cursor = "none";

    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName.toLowerCase() === "button" ||
        target.tagName.toLowerCase() === "a" ||
        target.closest("button") ||
        target.closest("a")
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener("mousemove", updateMousePosition);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
      window.removeEventListener("mouseover", handleMouseOver);
      document.body.style.cursor = "auto";
    };
  }, []);

  const variants: Variants = {
    default: {
      x: mousePosition.x - 8,
      y: mousePosition.y - 8,
      transition: {
        type: "tween",
        ease: "backOut",
        duration: 0.1,
      },
    },
    hover: {
      height: 64,
      width: 64,
      x: mousePosition.x - 32,
      y: mousePosition.y - 32,
      backgroundColor: "rgba(59, 130, 246, 0.2)",
      border: "1px solid rgba(59, 130, 246, 0.5)",
      transition: {
        type: "tween",
        ease: "backOut",
        duration: 0.2,
      },
    },
  };

  const dotVariants: Variants = {
    default: {
      x: mousePosition.x - 4,
      y: mousePosition.y - 4,
      transition: {
        type: "tween",
        ease: "linear",
        duration: 0,
      },
    },
    hover: {
      x: mousePosition.x - 4,
      y: mousePosition.y - 4,
      opacity: 0,
      transition: {
        type: "tween",
        ease: "linear",
        duration: 0,
      },
    },
  };

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-4 h-4 rounded-full border border-primary-500 pointer-events-none z-[9999]"
        variants={variants}
        animate={isHovering ? "hover" : "default"}
      />
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 bg-primary-400 rounded-full pointer-events-none z-[9999]"
        variants={dotVariants}
        animate={isHovering ? "hover" : "default"}
      />
    </>
  );
}
