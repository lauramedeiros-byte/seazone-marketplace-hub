with open("src/components/losts-client.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Find the line with "Main board component" and add CampanhasPanel before it
result = []
campanha_added = False
for i, line in enumerate(lines):
    if "// ─── Main board component" in line and not campanha_added:
        # Add CampanhasPanel component + state + tabs BEFORE this line
        campanha_code = """// ─── Campanhas ─────────────────────────────────────────────────────────────────
interface Campanha {
  id: string;
  link: string;
  contexto: string;
  criadoEm: string;
}

function CampanhasPanel({ campanhas, onChange }: {
  campanhas: Campanha[];
  onChange: (c: Campanha[]) => void;
}) {
  const [link, setLink] = useState("");
  const [contexto, setContexto] = useState("");
  const ctr = useRef(Date.now());

  const adicionar = () => {
    if (!link.trim()) return;
    onChange([{ id: `camp_${ctr.current++}`, link: link.trim(), contexto: contexto.trim(), criadoEm: new Date().toISOString() }, ...campanhas]);
    setLink("");
    setContexto("");
  };

  const remover = (id: string) => onChange(campanhas.filter((c) => c.id !== id));

  const formatarData = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <span style={{ fontSize: 18 }}>📣</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>Nova Campanha</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>Registre o link do conteúdo e o contexto da ação</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Link do conteúdo</label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Cole aqui o link do conteúdo, artefato ou página..."
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Contexto da ação</label>
            <textarea
              value={contexto}
              onChange={(e) => setContexto(e.target.value)}
              placeholder="Ex: Campanha de repescagem para leads que perderam oportunidade no Batel Spot, enviada por e-mail no dia 01/06..."
              rows={3}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.5 }}
            />
          </div>
          <button
            onClick={adicionar}
            disabled={!link.trim()}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              background: link.trim() ? C.blue : "#cbd5e1",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: link.trim() ? "pointer" : "not-allowed",
              alignSelf: "flex-start",
            }}
          >
            + Adicionar campanha
          </button>
        </div>
      </div>
      {campanhas.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📣</div>
          <div style={{ fontSize: 13 }}>Nenhuma campanha registrada ainda.</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>Use o formulário acima para adicionar.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {campanhas.map((camp) => (
            <div key={camp.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  {camp.link && (
                    <a href={camp.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: C.blue, textDecoration: "none", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                      🔗 {camp.link.length > 70 ? camp.link.substring(0, 70) + "..." : camp.link}
                    </a>
                  )}
                  {camp.contexto && <p style={{ fontSize: 12, color: "#475569", marginTop: 6, lineHeight: 1.5 }}>{camp.contexto}</p>}
                  <span style={{ fontSize: 10, color: "#94a3b8", marginTop: 4, display: "block" }}>Registrado em {formatarData(camp.criadoEm)}</span>
                </div>
                <button
                  onClick={() => remover(camp.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#cbd5e1", fontSize: 18, flexShrink: 0, padding: "0 2px" }}
                  title="Remover"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"""
        result.append(campanha_code)
        campanha_added = True
    result.append(line)

with open("src/components/losts-client.tsx", "w", encoding="utf-8") as f:
    f.writelines(result)

print("Done! Campanhas component added.")
