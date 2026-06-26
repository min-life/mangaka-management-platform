export function AuthBrand() {
  return (
    <div className="flex items-center gap-4">
      <img
        src="/brand/1.png"
        alt="Inkly"
        className="h-20 w-auto object-contain"
      />

      <div>
        <h1 className="text-3xl font-bold text-[#FFD369]">
          Inkly
        </h1>

        <p className="text-xs text-[#9CA3AF]">
          Create • Review • Publish
        </p>
      </div>
    </div>
  );
}
