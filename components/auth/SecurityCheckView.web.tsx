import React, { useEffect, useRef } from "react";
import type { SecurityCheckViewProps } from "./SecurityCheckView.types";

export default function SecurityCheckView({ url, onMessage }: SecurityCheckViewProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const origin = new URL(url).origin;
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.origin === origin && event.source === frame.current?.contentWindow) {
        onMessage(event.data);
      }
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [onMessage, origin]);

  return React.createElement("iframe", {
    ref: frame,
    src: url,
    title: "Security check",
    style: { border: 0, width: "100%", height: 185, backgroundColor: "#0b1524" },
  });
}
