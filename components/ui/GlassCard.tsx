"use client";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export default function GlassCard({ children, className = "", style, onClick }: Props) {
  return (
    <div
      className={`glass ${className}`}
      style={{ padding: "20px 24px", ...style }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
