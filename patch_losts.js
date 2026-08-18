var fs = require('fs');
var c = fs.readFileSync('src/components/losts-client.tsx', 'utf8');

// 1) Add state
c = c.replace(
  'const [dragging, setDragging] = useState<string | null>(null);',
  'const [dragging, setDragging] = useState<string | null>(null);\n  const [campanhas, setCampanhas] = useState([]);\n  const [activeTab, setActiveTab] = useState("board");'
);

// 2) Load from localStorage
c = c.replace(
  "setGroups(data.groups || DEFAULT_GROUPS);\n        setAbordagens(data.abordagens || {});",
  "setGroups(data.groups || DEFAULT_GROUPS);\n        setAbordagens(data.abordagens || {});\n        setCampanhas(data.campanhas || []);"
);

// 3) Save
c = c.replace(
  'const data = { groups, abordagens };',
  'const data = { groups, abordagens, campanhas };'
);

// 4) Add tabs + conditional panel AFTER back button, BEFORE Main Header
// The back button div closes with </button></div>
// We insert tabs and conditional after that, then wrap the rest of the board content in <>
c = c.replace(
  "<\\/button>\\n      <\\/div>",
  "<\\/button>\\n      <\\/div>\\n\\n      {/* Tabs */}\\n      <div style={{ maxWidth: 1280, margin: \"0 auto 16px\", display: \"flex\", gap: 4 }}>\\n        <button onClick={() => setActiveTab(\"board\")} style={{ padding: \"8px 20px\", borderRadius: \"8px 8px 0 0\", border: \"none\", borderBottom: activeTab === \"board\" ? `2px solid ${C.blue}` : \"2px solid transparent\", background: activeTab === \"board\" ? \"#fff\" : \"#e2e8f0\", color: activeTab === \"board\" ? C.blue : \"#64748b\", fontWeight: activeTab === \"board\" ? 600 : 400, fontSize: 13, cursor: \"pointer\" }}>Board de Lost<\\/button>\\n        <button onClick={() => setActiveTab(\"campanhas\")} style={{ padding: \"8px 20px\", borderRadius: \"8px 8px 0 0\", border: \"none\", borderBottom: activeTab === \"campanhas\" ? `2px solid ${C.blue}` : \"2px solid transparent\", background: activeTab === \"campanhas\" ? \"#fff\" : \"#e2e8f0\", color: activeTab === \"campanhas\" ? C.blue : \"#64748b\", fontWeight: activeTab === \"campanhas\" ? 600 : 400, fontSize: 13, cursor: \"pointer\" }}>Campanhas{campanhas.length > 0 ? <span style={{ marginLeft: 6, background: C.blueSoft, color: C.blue, borderRadius: 99, padding: \"1px 7px\", fontSize: 11, fontWeight: 700 }}>{campanhas.length}<\\/span> : null}<\\/button>\\n      <\\/div>\\n\\n      {activeTab === \"campanhas\" ? (\\n        <CampanhasPanel campanhas={campanhas} onChange={setCampanhas} />\\n      ) : (\\n        <>"
);

fs.writeFileSync('src/components/losts-client.tsx', c);
console.log('Patched. Lines:', c.split('\n').length);
