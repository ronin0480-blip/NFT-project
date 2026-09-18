const SAMPLES = [
  { id: "0", traits: "Coral Reef / Monochrome" },
  { id: "3", traits: "Dusk / Royal" },
  { id: "7", traits: "Mint Fog / Citrus" },
  { id: "12", traits: "Mint Fog / Glacier" },
  { id: "19", traits: "Void / Rose Gold" },
  { id: "22", traits: "Dawn / Sunset" },
  { id: "30", traits: "Ember / Botanic" },
  { id: "41", traits: "Deep Sea / Royal" },
  { id: "55", traits: "Mint Fog / Botanic" },
  { id: "63", traits: "Dusk / Sunset" },
  { id: "77", traits: "Coral Reef / Glacier" },
  { id: "88", traits: "Ember / Citrus" },
];

export default function GalleryGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-line border border-line">
      {SAMPLES.map((s) => (
        <div key={s.id} className="bg-ink p-4 group">
          <div className="aspect-square border border-line overflow-hidden">
            <img
              src={`/gallery/${s.id}.svg`}
              alt={`Fracture Bloom specimen ${s.id}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="mt-3 flex justify-between items-baseline">
            <span className="font-mono text-xs text-paper/60 plate-number">
              Plate {s.id.padStart(3, "0")}
            </span>
          </div>
          <p className="text-xs text-paper/40 font-sans mt-0.5">{s.traits}</p>
        </div>
      ))}
    </div>
  );
}
