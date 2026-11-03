import { useState } from "react";

// ─────────────────────────────────────────────
// EXEMPLO 1 — Contador (número)
// ─────────────────────────────────────────────
function ExemploContador() {
  const [contador, setContador] = useState(0);

  return (
    <div style={s.demo}>
      <div style={{ ...s.bigNumber, color: contador < 0 ? "#E24B4A" : contador > 0 ? "#1D9E75" : "#888780" }}>
        {contador}
      </div>
      <div style={s.row}>
        <button style={s.btn} onClick={() => setContador(contador - 1)}>− Diminuir</button>
        <button style={s.btn} onClick={() => setContador(0)}>Zerar</button>
        <button style={s.btn} onClick={() => setContador(contador + 1)}>+ Aumentar</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// EXEMPLO 2 — Liga / Desliga (boolean)
// ─────────────────────────────────────────────
function ExemploToggle() {
  const [ligado, setLigado] = useState(false);

  return (
    <div style={s.demo}>
      <div style={{
        width: 90, height: 90, borderRadius: "50%",
        background: ligado ? "#5DCAA5" : "#D3D1C7",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 38, margin: "0 auto 16px",
        transition: "background 0.3s",
      }}>
        {ligado ? "💡" : "🌑"}
      </div>
      <p style={{ textAlign: "center", margin: "0 0 14px", color: "#5F5E5A", fontSize: 14 }}>
        Estado: <strong style={{ color: ligado ? "#1D9E75" : "#888780" }}>
          {ligado ? "LIGADO" : "DESLIGADO"}
        </strong>
      </p>
      <button
        style={{ ...s.btn, width: "100%", background: ligado ? "#9FE1CB" : "#D3D1C7", color: ligado ? "#085041" : "#444441" }}
        onClick={() => setLigado(!ligado)}
      >
        {ligado ? "Desligar" : "Ligar"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// EXEMPLO 3 — Campo de texto (string)
// ─────────────────────────────────────────────
function ExemploTexto() {
  const [nome, setNome] = useState("");

  return (
    <div style={s.demo}>
      <input
        style={s.input}
        type="text"
        placeholder="Digite seu nome..."
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />
      <div style={{ marginTop: 12, minHeight: 40, textAlign: "center" }}>
        {nome ? (
          <p style={{ fontSize: 18, fontWeight: 500, color: "#534AB7" }}>Olá, {nome}! 👋</p>
        ) : (
          <p style={{ color: "#B4B2A9", fontSize: 14 }}>Esperando você digitar...</p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// EXEMPLO 4 — Lista dinâmica (array)
// ─────────────────────────────────────────────
function ExemploLista() {
  const [itens, setItens] = useState(["Aprender useState"]);
  const [texto, setTexto] = useState("");

  const adicionar = () => {
    if (texto.trim()) {
      setItens([...itens, texto.trim()]);
      setTexto("");
    }
  };

  return (
    <div style={s.demo}>
      <div style={s.row}>
        <input
          style={{ ...s.input, flex: 1, marginBottom: 0 }}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && adicionar()}
          placeholder="Nova tarefa..."
        />
        <button style={{ ...s.btn, marginLeft: 8 }} onClick={adicionar}>+ Add</button>
      </div>
      <div style={{ marginTop: 12, maxHeight: 150, overflowY: "auto" }}>
        {itens.length === 0 ? (
          <p style={{ color: "#B4B2A9", fontSize: 14, textAlign: "center" }}>Nenhum item ainda.</p>
        ) : (
          itens.map((item, i) => (
            <div key={i} style={s.listItem}>
              <span style={{ fontSize: 13 }}>✔ {item}</span>
              <button
                style={s.removeBtn}
                onClick={() => setItens(itens.filter((_, idx) => idx !== i))}
              >✕</button>
            </div>
          ))
        )}
      </div>
      <p style={{ fontSize: 12, color: "#B4B2A9", marginTop: 8 }}>{itens.length} item(s)</p>
    </div>
  );
}

// ─────────────────────────────────────────────
// EXEMPLO 5 — Objeto no estado
// ─────────────────────────────────────────────
function ExemploObjeto() {
  const [form, setForm] = useState({ nome: "", idade: "" });

  return (
    <div style={s.demo}>
      <input
        style={s.input}
        placeholder="Nome"
        value={form.nome}
        onChange={(e) => setForm({ ...form, nome: e.target.value })}
      />
      <input
        style={s.input}
        placeholder="Idade"
        type="number"
        value={form.idade}
        onChange={(e) => setForm({ ...form, idade: e.target.value })}
      />
      {(form.nome || form.idade) ? (
        <div style={s.card}>
          <p style={{ margin: 0, fontWeight: 500, color: "#534AB7" }}>Ficha do aluno</p>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#5F5E5A" }}>
            Nome: <strong>{form.nome || "—"}</strong> · Idade: <strong>{form.idade || "—"}</strong>
          </p>
        </div>
      ) : (
        <p style={{ color: "#B4B2A9", fontSize: 13, textAlign: "center" }}>Preencha os campos acima...</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// EXEMPLO 6 — Sortear Par ou Ímpar (boolean)
// ─────────────────────────────────────────────
function ExemploParImpar() {
  const [ePar, setEPar] = useState(null);
  const [total, setTotal] = useState(0);

  const sortear = () => {
    const resultado = Math.random() >= 0.5;
    setEPar(resultado);
    setTotal((t) => t + 1);
  };

  return (
    <div style={s.demo}>
      <div style={{
        fontSize: 22, fontWeight: 500, textAlign: "center",
        padding: "18px 20px", borderRadius: 10, marginBottom: 14,
        transition: "all 0.25s",
        background: ePar === null ? "#F1EFE8" : ePar ? "#E6F1FB" : "#FAECE7",
        color: ePar === null ? "#888780" : ePar ? "#185FA5" : "#993C1D",
        border: `0.5px solid ${ePar === null ? "#D3D1C7" : ePar ? "#85B7EB" : "#F0997B"}`,
      }}>
        {ePar === null ? "Clique para sortear!" : ePar ? "PAR" : "ÍMPAR"}
      </div>
      <button style={{ ...s.btn, width: "100%", fontSize: 15, padding: "10px 0" }} onClick={sortear}>
        🎲 Sortear
      </button>
      <div style={{ ...s.row, marginTop: 12, gap: 8 }}>
        <div style={s.statBox}>
          <p style={s.statLabel}>ePar (estado)</p>
          <code style={{ fontWeight: 500, color: ePar === null ? "#888780" : ePar ? "#185FA5" : "#993C1D" }}>
            {ePar === null ? "—" : ePar ? "true" : "false"}
          </code>
        </div>
        <div style={s.statBox}>
          <p style={s.statLabel}>total sorteios</p>
          <code style={{ fontWeight: 500, color: "#2C2C2A" }}>{total}</code>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// EXEMPLO 7 — Ficha RPG (número + texto + boolean)
// ─────────────────────────────────────────────
const CLASSES = [
  { nome: "Mago", emoji: "🧙" },
  { nome: "Guerreiro", emoji: "⚔️" },
  { nome: "Arqueiro", emoji: "🏹" },
  { nome: "Curandeiro", emoji: "✚" },
];

function ExemploRPG() {
  const [nome, setNome] = useState("");
  const [hp, setHp] = useState(100);
  const [vivo, setVivo] = useState(true);
  const [classe, setClasse] = useState(CLASSES[0]);

  const receberDano = () => {
    const novoHp = Math.max(0, hp - 10);
    setHp(novoHp);
    setVivo(novoHp > 0);
  };

  const curar = () => {
    setHp(100);
    setVivo(true);
  };

  const pct = hp / 100;
  const corBarra = pct > 0.5 ? "#5DCAA5" : pct > 0.25 ? "#EF9F27" : "#E24B4A";

  return (
    <div style={s.demo}>
      {/* Avatar + nome */}
      <div style={{ ...s.row, marginBottom: 16 }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: vivo ? "#EEEDFE" : "#FCEBEB",
          border: `2px solid ${vivo ? "#AFA9EC" : "#F09595"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26, flexShrink: 0, transition: "all 0.3s",
        }}>
          {vivo ? classe.emoji : "💀"}
        </div>
        <input
          style={{ ...s.input, flex: 1, marginBottom: 0 }}
          placeholder="Nome do herói..."
          maxLength={20}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
      </div>

      {/* Status vivo/morto */}
      <div style={{ ...s.row, justifyContent: "space-between", background: "#F1EFE8", borderRadius: 8, padding: "10px 14px", marginBottom: 14, border: "0.5px solid #D3D1C7" }}>
        <div>
          <p style={{ fontSize: 11, color: "#888780", marginBottom: 2 }}>Status</p>
          <span style={{
            display: "inline-block", fontSize: 11, fontWeight: 500,
            padding: "3px 10px", borderRadius: 20,
            background: vivo ? "#EAF3DE" : "#FCEBEB",
            color: vivo ? "#3B6D11" : "#A32D2D",
          }}>
            {vivo ? "VIVO" : "MORTO"}
          </span>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 11, color: "#888780", marginBottom: 2 }}>vivo (boolean)</p>
          <code style={{ fontSize: 13, fontWeight: 500, color: vivo ? "#3B6D11" : "#A32D2D" }}>
            {vivo ? "true" : "false"}
          </code>
        </div>
      </div>

      {/* HP */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ ...s.row, justifyContent: "space-between", marginBottom: 6 }}>
          <p style={{ fontSize: 13, color: "#5F5E5A" }}>Pontos de Vida (HP)</p>
          <code style={{ fontSize: 13, fontWeight: 500 }}>{hp} / 100</code>
        </div>
        <div style={{ background: "#D3D1C7", borderRadius: 20, height: 12, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct * 100}%`, borderRadius: 20, background: corBarra, transition: "all 0.4s" }} />
        </div>
        <div style={{ ...s.row, marginTop: 10 }}>
          <button
            style={{ ...s.btn, flex: 1, background: "#FAECE7", color: "#993C1D", borderColor: "#F0997B", opacity: vivo ? 1 : 0.4 }}
            onClick={receberDano}
            disabled={!vivo}
          >⚔ Receber dano</button>
          <button
            style={{ ...s.btn, flex: 1, background: "#EAF3DE", color: "#3B6D11", borderColor: "#97C459" }}
            onClick={curar}
          >✚ Curar</button>
        </div>
      </div>

      {/* Classe */}
      <div>
        <p style={{ fontSize: 13, color: "#5F5E5A", marginBottom: 8 }}>Classe do herói</p>
        <div style={{ ...s.row, flexWrap: "wrap" }}>
          {CLASSES.map((cl) => (
            <button
              key={cl.nome}
              style={{
                ...s.btn,
                background: classe.nome === cl.nome ? "#EEEDFE" : "#F1EFE8",
                borderColor: classe.nome === cl.nome ? "#7F77DD" : "#D3D1C7",
                color: classe.nome === cl.nome ? "#3C3489" : "#5F5E5A",
                fontWeight: classe.nome === cl.nome ? 600 : 400,
              }}
              onClick={() => setClasse(cl)}
            >
              {cl.emoji} {cl.nome}
            </button>
          ))}
        </div>
      </div>

      {/* Debugger */}
      <div style={{ marginTop: 16, background: "#2C2C2A", borderRadius: 10, padding: "12px 16px" }}>
        <p style={{ fontSize: 11, color: "#888780", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Estados agora</p>
        {[
          { key: "nome", val: `"${nome || ""}"`, color: "#FAB387" },
          { key: "hp", val: hp, color: "#89DCEB" },
          { key: "vivo", val: String(vivo), color: vivo ? "#5DCAA5" : "#F09595" },
          { key: "classe", val: `"${classe.nome}"`, color: "#CBA6F7" },
        ].map(({ key, val, color }) => (
          <div key={key} style={{ ...s.row, justifyContent: "space-between", marginBottom: 6 }}>
            <code style={{ fontSize: 12, color: "#9FE1CB" }}>{key}</code>
            <code style={{ fontSize: 12, color }}>{val}</code>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
const EXEMPLOS = [
  { id: "counter",  icon: "🔢", title: "Contador",        desc: "O exemplo mais clássico: um número que muda ao clicar.",                       Component: ExemploContador  },
  { id: "toggle",   icon: "💡", title: "Liga / Desliga",   desc: "Um booleano (true/false) que alterna com uma única função.",                   Component: ExemploToggle    },
  { id: "text",     icon: "✏️", title: "Campo de texto",   desc: "Capturar o que o usuário digita e armazenar no estado.",                       Component: ExemploTexto     },
  { id: "list",     icon: "📋", title: "Lista dinâmica",   desc: "Estado como array: adicionar e remover itens com spread operator.",            Component: ExemploLista     },
  { id: "object",   icon: "🧩", title: "Objeto no estado", desc: "O estado pode ser um objeto. Use spread (...) para não perder outros campos.", Component: ExemploObjeto    },
  { id: "parimpar", icon: "🎲", title: "Par ou Ímpar",     desc: "Sorteia true ou false com Math.random() e exibe Par ou Ímpar.",               Component: ExemploParImpar  },
  { id: "rpg",      icon: "🧙", title: "Ficha RPG",        desc: "Número + texto + boolean juntos: HP, nome e status de vida do herói.",         Component: ExemploRPG       },
];

const CODIGOS = {
  counter: `const [contador, setContador] = useState(0);

setContador(contador + 1); // aumentar
setContador(contador - 1); // diminuir
setContador(0);            // zerar`,

  toggle: `const [ligado, setLigado] = useState(false);

// Alternar (inverte o valor atual):
setLigado(!ligado);`,

  text: `const [nome, setNome] = useState("");

// Atualizar ao digitar:
setNome(evento.target.value);

// Usar no JSX:
<p>Olá, {nome}!</p>`,

  list: `const [itens, setItens] = useState([]);

// Adicionar (spread mantém os antigos):
setItens([...itens, novoItem]);

// Remover por índice:
setItens(itens.filter((_, i) => i !== index));`,

  object: `const [form, setForm] = useState(
  { nome: "", idade: "" }
);

// Atualizar UM campo (spread mantém os outros):
setForm({ ...form, nome: "Ana" });
setForm({ ...form, idade: 20 });`,

  parimpar: `const [ePar, setEPar] = useState(null);

// Sortear true ou false:
const resultado = Math.random() >= 0.5;
setEPar(resultado);

// Usar no JSX:
<p>{ePar ? "PAR" : "ÍMPAR"}</p>`,

  rpg: `// texto
const [nome, setNome] = useState("");

// número
const [hp, setHp] = useState(100);

// boolean
const [vivo, setVivo] = useState(true);

// receber dano — atualiza número E boolean:
const novoHp = Math.max(0, hp - 10);
setHp(novoHp);
setVivo(novoHp > 0);

// curar:
setHp(100);
setVivo(true);`,
};

export default function UseStateCompleto() {
  const [ativo, setAtivo] = useState("counter");
  const exemplo = EXEMPLOS.find((e) => e.id === ativo);
  const Componente = exemplo.Component;

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 760, margin: "0 auto", padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 4px" }}>useState — Guia Interativo</h1>
        <p style={{ color: "#888780", margin: 0, fontSize: 14 }}>
          Clique em cada exemplo e veja o estado mudando em tempo real.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {EXEMPLOS.map((ex) => (
          <button
            key={ex.id}
            onClick={() => setAtivo(ex.id)}
            style={{
              padding: "8px 14px", borderRadius: 8, border: "0.5px solid",
              borderColor: ativo === ex.id ? "#7F77DD" : "#D3D1C7",
              background: ativo === ex.id ? "#EEEDFE" : "#fff",
              color: ativo === ex.id ? "#3C3489" : "#5F5E5A",
              cursor: "pointer", fontWeight: ativo === ex.id ? 600 : 400,
              fontSize: 13, transition: "all 0.15s",
            }}
          >
            {ex.icon} {ex.title}
          </button>
        ))}
      </div>

      {/* Painéis */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "#fff", border: "0.5px solid #D3D1C7", borderRadius: 12, padding: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#888780", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 1 }}>
            O que acontece
          </p>
          <p style={{ fontSize: 14, color: "#2C2C2A", margin: "0 0 16px", lineHeight: 1.6 }}>{exemplo.desc}</p>
          <Componente />
        </div>

        <div style={{ background: "#2C2C2A", borderRadius: 12, padding: 20, overflow: "auto" }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#888780", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: 1 }}>
            O código
          </p>
          <pre style={{ margin: 0, fontSize: 13, color: "#9FE1CB", fontFamily: "monospace", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
            {CODIGOS[ativo]}
          </pre>
        </div>
      </div>

      {/* Dica */}
      <div style={{ marginTop: 20, background: "#EAF3DE", borderRadius: 10, padding: "14px 18px", border: "0.5px solid #97C459" }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: "#3B6D11" }}>💡 Regra de ouro do useState</p>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: "#3B6D11", lineHeight: 1.6 }}>
          Você <strong>nunca modifica o estado diretamente</strong> (ex: <code>contador = 5</code>).
          Sempre use a função setter (<code>setContador(5)</code>) — só assim o React sabe que
          precisa re-renderizar o componente.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ESTILOS COMPARTILHADOS
// ─────────────────────────────────────────────
const s = {
  btn: {
    padding: "8px 16px", borderRadius: 8, border: "0.5px solid #D3D1C7",
    background: "#F1EFE8", cursor: "pointer", fontWeight: 500, fontSize: 13,
    color: "#2C2C2A", transition: "background 0.2s",
  },
  row: { display: "flex", gap: 8, alignItems: "center" },
  bigNumber: { fontSize: 72, fontWeight: 700, textAlign: "center", lineHeight: 1, marginBottom: 20 },
  demo: { padding: "4px 0" },
  input: {
    width: "100%", padding: "8px 12px", borderRadius: 8,
    border: "0.5px solid #D3D1C7", fontSize: 14, marginBottom: 12,
    background: "#FAFAFA", boxSizing: "border-box", outline: "none",
  },
  listItem: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "7px 10px", borderRadius: 8, background: "#F1EFE8",
    marginBottom: 6,
  },
  removeBtn: {
    background: "none", border: "none", cursor: "pointer",
    color: "#E24B4A", fontWeight: 700, fontSize: 14, padding: "0 4px",
  },
  card: {
    background: "#EEEDFE", borderRadius: 8, padding: "10px 14px",
    border: "0.5px solid #AFA9EC", marginTop: 4,
  },
  statBox: {
    flex: 1, background: "#F1EFE8", borderRadius: 8,
    padding: "8px 12px", border: "0.5px solid #D3D1C7",
  },
  statLabel: { fontSize: 11, color: "#888780", marginBottom: 2 },
};