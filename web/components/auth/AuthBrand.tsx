export function AuthBrand() {
  return (
    <div className="flex items-center gap-3 -ml-1">
      <img
        alt="Inkly"
        className="h-20 w-auto object-contain"
        src="/brand/1.png"
        style={{ width: 'auto' }}
      />

      <p className="text-[9px] font-bold uppercase tracking-[0.05em] text-[#8b94a1] border-l border-[#5b626d] pl-3 py-1 -translate-y-[4px]">
        Create / Review / Publish
      </p>
    </div>
  );
}
