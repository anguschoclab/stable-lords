import { Swords } from "lucide-react";

export default function WaxSeal() {
  return (
    <div className="relative flex items-center justify-center w-20 h-20 mx-auto" aria-hidden="true">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, rgba(201, 151, 42, 0.5), rgba(201, 151, 42, 0.15), rgba(201, 151, 42, 0.5), rgba(201, 151, 42, 0.15), rgba(201, 151, 42, 0.5))",
          padding: "1px",
        }}
      >
        <div className="w-full h-full rounded-full" style={{ background: "#0C0806" }} />
      </div>
      <div
        className="relative z-10 flex items-center justify-center w-14 h-14 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at 35% 35%, rgba(160, 40, 48, 0.95) 0%, #872228 55%, rgba(100, 20, 26, 0.9) 100%)",
          boxShadow:
            "0 4px 16px rgba(135, 34, 40, 0.5), inset 0 1px 0 rgba(255, 200, 200, 0.15), inset 0 -1px 0 rgba(0,0,0,0.3)",
        }}
      >
        <Swords className="h-6 w-6 text-[#F2D5B8]" strokeWidth={1.5} />
      </div>
      {[0, 72, 144, 216, 288].map((deg) => (
        <div
          key={deg}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: "rgba(201, 151, 42, 0.6)",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) rotate(${deg}deg) translateX(36px)`,
          }}
        />
      ))}
    </div>
  );
}
