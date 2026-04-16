export default function ColomseumArch() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
      <div
        className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-60 torch-flicker"
        style={{
          background: "radial-gradient(ellipse at center, rgba(200, 140, 20, 0.18) 0%, rgba(180, 100, 10, 0.08) 50%, transparent 70%)",
        }}
      />
      <div
        className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-40 torch-flicker"
        style={{
          background: "radial-gradient(ellipse at center, rgba(200, 130, 20, 0.14) 0%, transparent 70%)",
          animationDelay: "1.4s",
        }}
      />
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/5 h-48 opacity-25"
        style={{
          background: "radial-gradient(ellipse at center bottom, rgba(135, 34, 40, 0.3) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(201, 151, 42, 0.25) 30%, rgba(201, 151, 42, 0.5) 50%, rgba(201, 151, 42, 0.25) 70%, transparent 100%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(201, 151, 42, 0.15) 30%, rgba(201, 151, 42, 0.3) 50%, rgba(201, 151, 42, 0.15) 70%, transparent 100%)",
        }}
      />
    </div>
  );
}
