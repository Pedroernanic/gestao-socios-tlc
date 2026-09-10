import { useState, useEffect, useMemo } from "react";
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  Store,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

const STORAGE_KEY = "tlc-socios-v1";

const PLANOS = [
  { valor: 20, desconto: 5 },
  { valor: 35, desconto: 10 },
  { valor: 50, desconto: 15 },
];

function mesAtualKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMes(key) {
  if (!key) return "—";
  const [ano, mes] = key.split("-");
  const nomes = [
    "jan", "fev", "mar", "abr", "mai", "jun",
    "jul", "ago", "set", "out", "nov", "dez",
  ];
  return `${nomes[parseInt(mes, 10) - 1]}/${ano}`;
}

function statusDe(socio) {
  const chave = mesAtualKey();
  return socio.pagamentos && socio.pagamentos[chave]
    ? "adimplente"
    : "inadimplente";
}

function ultimoPagamento(socio) {
  const chaves = Object.keys(socio.pagamentos || {}).sort();
  return chaves.length ? chaves[chaves.length - 1] : null;
}

const EXEMPLOS = [
  { nome: "Ana Paula Ferreira", codigo: "0231", plano: 35, pagoEsteMes: true },
  { nome: "Bruno Cavalcante Lima", codigo: "0184", plano: 20, pagoEsteMes: false },
  { nome: "Carla Rejane Nunes", codigo: "0097", plano: 50, pagoEsteMes: true },
];

export default function GestaoSociosTLC() {
  const [socios, setSocios] = useState(null);
  const [aba, setAba] = useState("admin");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState("");
  const [buscaParceiro, setBuscaParceiro] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [novo, setNovo] = useState({ nome: "", codigo: "", plano: 20 });

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY, true);
        setSocios(res ? JSON.parse(res.value) : []);
      } catch {
        setSocios([]);
      } finally {
        setCarregando(false);
      }
    })();
  }, []);

  async function salvar(lista) {
    setSocios(lista);
    try {
      const res = await window.storage.set(STORAGE_KEY, JSON.stringify(lista), true);
      if (!res) setErro("Não foi possível salvar. Tente novamente.");
      else setErro(null);
    } catch {
      setErro("Não foi possível salvar. Tente novamente.");
    }
  }

  function carregarExemplos() {
    const chave = mesAtualKey();
    const lista = EXEMPLOS.map((e, i) => ({
      id: `${Date.now()}-${i}`,
      nome: e.nome,
      codigo: e.codigo,
      plano: e.plano,
      pagamentos: e.pagoEsteMes ? { [chave]: true } : {},
    }));
    salvar(lista);
  }

  function adicionarSocio(ev) {
    ev.preventDefault();
    if (!novo.nome.trim() || !novo.codigo.trim()) return;
    const item = {
      id: `${Date.now()}`,
      nome: novo.nome.trim(),
      codigo: novo.codigo.trim(),
      plano: Number(novo.plano),
      pagamentos: {},
    };
    salvar([...(socios || []), item]);
    setNovo({ nome: "", codigo: "", plano: 20 });
    setMostrarForm(false);
  }

  function marcarPagamento(id) {
    const chave = mesAtualKey();
    const lista = (socios || []).map((s) =>
      s.id === id
        ? { ...s, pagamentos: { ...s.pagamentos, [chave]: true } }
        : s
    );
    salvar(lista);
  }

  function removerSocio(id) {
    salvar((socios || []).filter((s) => s.id !== id));
  }

  const listaFiltrada = useMemo(() => {
    if (!socios) return [];
    const termo = busca.trim().toLowerCase();
    if (!termo) return socios;
    return socios.filter(
      (s) =>
        s.nome.toLowerCase().includes(termo) || s.codigo.includes(termo)
    );
  }, [socios, busca]);

  const resultadoParceiro = useMemo(() => {
    if (!socios || !buscaParceiro.trim()) return null;
    const termo = buscaParceiro.trim().toLowerCase();
    return (
      socios.find(
        (s) =>
          s.codigo.toLowerCase() === termo ||
          s.nome.toLowerCase() === termo
      ) || "nao-encontrado"
    );
  }, [socios, buscaParceiro]);

  const totalAdimplentes = (socios || []).filter(
    (s) => statusDe(s) === "adimplente"
  ).length;

  return (
    <div className="tlc-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

        .tlc-root {
          --bg: #FAFAF8;
          --surface: #FFFFFF;
          --ink: #1C2B2D;
          --ink-soft: #5B6B69;
          --primary: #114B3F;
          --primary-tint: #E4EFE9;
          --accent: #B8862B;
          --accent-tint: #F5ECD9;
          --danger: #A23B2E;
          --danger-tint: #F5E7E4;
          --border: #E4E1D8;

          font-family: 'IBM Plex Sans', sans-serif;
          color: var(--ink);
          background: var(--bg);
          min-height: 100%;
          padding: 32px 24px 48px;
        }
        .tlc-header {
          max-width: 880px;
          margin: 0 auto 24px;
        }
        .tlc-wordmark {
          font-family: 'Lora', serif;
          font-size: 22px;
          font-weight: 600;
          letter-spacing: 0.2px;
        }
        .tlc-sub {
          color: var(--ink-soft);
          font-size: 14px;
          margin-top: 2px;
        }
        .tlc-tabs {
          display: flex;
          gap: 4px;
          margin-top: 20px;
          border-bottom: 1px solid var(--border);
        }
        .tlc-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 500;
          color: var(--ink-soft);
          border-bottom: 2px solid transparent;
          cursor: pointer;
          background: none;
          border-left: none;
          border-right: none;
          border-top: none;
        }
        .tlc-tab.active {
          color: var(--primary);
          border-bottom-color: var(--primary);
        }
        .tlc-card {
          max-width: 880px;
          margin: 20px auto 0;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 20px;
        }
        .tlc-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .tlc-search {
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 8px 12px;
          background: var(--bg);
          flex: 1;
          min-width: 200px;
        }
        .tlc-search input {
          border: none;
          background: none;
          outline: none;
          font-size: 14px;
          width: 100%;
          color: var(--ink);
        }
        .tlc-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 500;
          padding: 9px 14px;
          border-radius: 8px;
          cursor: pointer;
          border: 1px solid transparent;
        }
        .tlc-btn-primary {
          background: var(--primary);
          color: white;
        }
        .tlc-btn-ghost {
          background: none;
          border-color: var(--border);
          color: var(--ink);
        }
        .tlc-form {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr auto;
          gap: 10px;
          margin-top: 16px;
          align-items: end;
        }
        .tlc-field label {
          display: block;
          font-size: 12px;
          color: var(--ink-soft);
          margin-bottom: 4px;
        }
        .tlc-field input, .tlc-field select {
          width: 100%;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 14px;
          background: var(--surface);
          color: var(--ink);
        }
        .tlc-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 16px;
          font-size: 14px;
        }
        .tlc-table th {
          text-align: left;
          color: var(--ink-soft);
          font-weight: 500;
          font-size: 12px;
          padding: 8px 10px;
          border-bottom: 1px solid var(--border);
        }
        .tlc-table td {
          padding: 10px 10px;
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
        }
        .tlc-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 500;
          padding: 4px 9px;
          border-radius: 999px;
        }
        .tlc-badge-ok {
          background: var(--primary-tint);
          color: var(--primary);
        }
        .tlc-badge-no {
          background: var(--danger-tint);
          color: var(--danger);
        }
        .tlc-icon-btn {
          border: none;
          background: none;
          cursor: pointer;
          color: var(--ink-soft);
          padding: 4px;
          border-radius: 6px;
        }
        .tlc-icon-btn:hover {
          background: var(--bg);
        }
        .tlc-empty {
          text-align: center;
          padding: 40px 20px;
          color: var(--ink-soft);
        }
        .tlc-partner-box {
          max-width: 460px;
          margin: 40px auto 0;
        }
        .tlc-partner-search {
          display: flex;
          gap: 8px;
        }
        .tlc-partner-search input {
          flex: 1;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 12px 14px;
          font-size: 15px;
          outline: none;
        }
        .tlc-partner-search input:focus {
          border-color: var(--primary);
        }
        .tlc-result {
          margin-top: 20px;
          border-radius: 10px;
          padding: 20px;
          border: 1px solid var(--border);
        }
        .tlc-result.ok {
          background: var(--primary-tint);
          border-color: var(--primary);
        }
        .tlc-result.no {
          background: var(--danger-tint);
          border-color: var(--danger);
        }
        .tlc-result-name {
          font-family: 'Lora', serif;
          font-size: 18px;
          margin-bottom: 4px;
        }
        .tlc-error {
          color: var(--danger);
          font-size: 13px;
          margin-top: 10px;
        }
        .tlc-note {
          font-size: 12px;
          color: var(--ink-soft);
          margin-top: 14px;
        }
      `}</style>

      <div className="tlc-header">
        <div className="tlc-wordmark">TLC · Sócios contribuintes</div>
        <div className="tlc-sub">
          {carregando
            ? "Carregando dados..."
            : `${(socios || []).length} sócios cadastrados · ${totalAdimplentes} em dia este mês`}
        </div>
        <div className="tlc-tabs">
          <button
            className={`tlc-tab ${aba === "admin" ? "active" : ""}`}
            onClick={() => setAba("admin")}
          >
            <Users size={15} /> Painel administrativo
          </button>
          <button
            className={`tlc-tab ${aba === "parceiro" ? "active" : ""}`}
            onClick={() => setAba("parceiro")}
          >
            <Store size={15} /> Consulta de parceiros
          </button>
        </div>
      </div>

      {aba === "admin" && (
        <div className="tlc-card">
          <div className="tlc-row">
            <div className="tlc-search">
              <Search size={15} color="var(--ink-soft)" />
              <input
                placeholder="Buscar por nome ou código"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <button
              className="tlc-btn tlc-btn-primary"
              onClick={() => setMostrarForm((v) => !v)}
            >
              <UserPlus size={15} /> Novo sócio
            </button>
          </div>

          {mostrarForm && (
            <form className="tlc-form" onSubmit={adicionarSocio}>
              <div className="tlc-field">
                <label>Nome</label>
                <input
                  value={novo.nome}
                  onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
                  placeholder="Nome completo"
                  required
                />
              </div>
              <div className="tlc-field">
                <label>Código / matrícula</label>
                <input
                  value={novo.codigo}
                  onChange={(e) => setNovo({ ...novo, codigo: e.target.value })}
                  placeholder="0123"
                  required
                />
              </div>
              <div className="tlc-field">
                <label>Plano</label>
                <select
                  value={novo.plano}
                  onChange={(e) => setNovo({ ...novo, plano: e.target.value })}
                >
                  {PLANOS.map((p) => (
                    <option key={p.valor} value={p.valor}>
                      R$ {p.valor}
                    </option>
                  ))}
                </select>
              </div>
              <button className="tlc-btn tlc-btn-primary" type="submit">
                Adicionar
              </button>
            </form>
          )}

          {!carregando && (socios || []).length === 0 && (
            <div className="tlc-empty">
              Nenhum sócio cadastrado ainda.
              <div style={{ marginTop: 12 }}>
                <button className="tlc-btn tlc-btn-ghost" onClick={carregarExemplos}>
                  <RefreshCw size={14} /> Carregar sócios de exemplo
                </button>
              </div>
            </div>
          )}

          {!carregando && listaFiltrada.length > 0 && (
            <table className="tlc-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Código</th>
                  <th>Plano</th>
                  <th>Último pagamento</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {listaFiltrada.map((s) => {
                  const status = statusDe(s);
                  return (
                    <tr key={s.id}>
                      <td>{s.nome}</td>
                      <td>{s.codigo}</td>
                      <td>R$ {s.plano}</td>
                      <td>{formatMes(ultimoPagamento(s))}</td>
                      <td>
                        {status === "adimplente" ? (
                          <span className="tlc-badge tlc-badge-ok">
                            <CheckCircle2 size={12} /> Adimplente
                          </span>
                        ) : (
                          <span className="tlc-badge tlc-badge-no">
                            <XCircle size={12} /> Inadimplente
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                          {status !== "adimplente" && (
                            <button
                              className="tlc-btn tlc-btn-ghost"
                              onClick={() => marcarPagamento(s.id)}
                              title="Marcar pagamento deste mês"
                            >
                              Marcar pago
                            </button>
                          )}
                          <button
                            className="tlc-icon-btn"
                            onClick={() => removerSocio(s.id)}
                            title="Remover sócio"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {erro && <div className="tlc-error">{erro}</div>}
          <div className="tlc-note">
            Este painel é visível para qualquer pessoa que abrir este link — não há login separado
            para administrador. Em produção, restrinja o painel administrativo a um backend com
            autenticação, e mantenha a consulta de parceiros aberta apenas à leitura.
          </div>
        </div>
      )}

      {aba === "parceiro" && (
        <div className="tlc-partner-box">
          <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 8 }}>
            Consulte pelo nome ou código do sócio para conceder o desconto de parceiro.
          </div>
          <div className="tlc-partner-search">
            <input
              placeholder="Nome completo ou código"
              value={buscaParceiro}
              onChange={(e) => setBuscaParceiro(e.target.value)}
            />
          </div>

          {resultadoParceiro === "nao-encontrado" && (
            <div className="tlc-result no">
              <div className="tlc-result-name">Sócio não encontrado</div>
              <div>Confira o nome ou o código informado.</div>
            </div>
          )}

          {resultadoParceiro && resultadoParceiro !== "nao-encontrado" && (
            <div
              className={`tlc-result ${
                statusDe(resultadoParceiro) === "adimplente" ? "ok" : "no"
              }`}
            >
              <div className="tlc-result-name">{resultadoParceiro.nome}</div>
              {statusDe(resultadoParceiro) === "adimplente" ? (
                <>
                  <div className="tlc-badge tlc-badge-ok" style={{ marginBottom: 8 }}>
                    <ShieldCheck size={13} /> Sócio adimplente
                  </div>
                  <div>
                    Desconto de parceiro aplicável:{" "}
                    <strong>
                      {PLANOS.find((p) => p.valor === resultadoParceiro.plano)?.desconto ?? 0}%
                    </strong>
                  </div>
                </>
              ) : (
                <div>Sócio inadimplente — desconto de parceiro não aplicável no momento.</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
