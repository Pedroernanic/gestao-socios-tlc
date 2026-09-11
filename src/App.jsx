import { useState, useEffect, useMemo } from "react";
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Trash2,
  Store,
  RefreshCw,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  BarChart3,
  CreditCard,
  Sparkles,
  Bell,
  Phone,
  Pencil,
  Download,
  Cake,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

const STORAGE_KEY = "tlc-socios-v4";
const MESES_PARA_INATIVAR = 4;

const COLOR_PRIMARY = "#16305C";
const COLOR_ACCENT = "#F5B301";
const COLOR_DANGER = "#A23B2E";
const COLOR_MUTED = "#8FA39C";
const COLOR_INATIVO = "#7A7A72";
const PALETA = [COLOR_PRIMARY, COLOR_ACCENT, COLOR_DANGER, COLOR_MUTED];

const PLANOS = [
  { valor: 20, desconto: 10 },
  { valor: 35, desconto: 15 },
  { valor: 50, desconto: 20 },
];

const METODOS = [
  { valor: "pix", label: "PIX recorrente" },
  { valor: "boleto", label: "Boleto" },
  { valor: "cartao", label: "Cartão de crédito" },
];

function metodoLabel(valor) {
  return METODOS.find((m) => m.valor === valor)?.label || valor;
}

function mesAtualKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMes(key) {
  if (!key) return "—";
  const [ano, mes] = key.split("-");
  const nomes = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${nomes[parseInt(mes, 10) - 1]}/${ano}`;
}

function formatData(iso) {
  if (!iso) return "—";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function diasNoMes(ano, mesIndex) {
  return new Date(ano, mesIndex + 1, 0).getDate();
}

function diaVencimentoEfetivo(ano, mesIndex, diaEscolhido) {
  const dias = diasNoMes(ano, mesIndex);
  return Math.min(diaEscolhido || 1, dias);
}

function proximoVencimento(socio) {
  const hoje = new Date();
  const dia = diaVencimentoEfetivo(hoje.getFullYear(), hoje.getMonth(), socio.diaVencimento || 1);
  return new Date(hoje.getFullYear(), hoje.getMonth(), dia);
}

function mesesEmAtraso(socio) {
  let atraso = 0;
  const hoje = new Date();
  const cursor = new Date();
  for (let i = 0; i < 60; i++) {
    const ano = cursor.getFullYear();
    const mes = cursor.getMonth();
    const key = `${ano}-${String(mes + 1).padStart(2, "0")}`;
    if (socio.pagamentos && socio.pagamentos[key]) break;
    if (i === 0) {
      const diaVenc = diaVencimentoEfetivo(ano, mes, socio.diaVencimento || 1);
      const vencimento = new Date(ano, mes, diaVenc);
      if (hoje < vencimento) {
        cursor.setMonth(cursor.getMonth() - 1);
        continue;
      }
    }
    atraso++;
    cursor.setMonth(cursor.getMonth() - 1);
  }
  return atraso;
}

function statusDe(socio) {
  const atraso = mesesEmAtraso(socio);
  if (atraso === 0) return "adimplente";
  if (atraso >= MESES_PARA_INATIVAR) return "inativo";
  return "inadimplente";
}

function ultimoPagamento(socio) {
  const chaves = Object.keys(socio.pagamentos || {}).sort();
  return chaves.length ? chaves[chaves.length - 1] : null;
}

function ultimosMeses(n) {
  const arr = [];
  const agora = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    arr.push({ key, label: formatMes(key) });
  }
  return arr;
}

function mesKeyRelativo(i) {
  const meses = ultimosMeses(6);
  return meses[meses.length - 1 - i]?.key;
}

function mesesPagosRecentes(socio, n = 6) {
  const meses = ultimosMeses(n);
  return meses.filter((m) => socio.pagamentos && socio.pagamentos[m.key]).length;
}

function ehContribuinteRegular(socio) {
  return mesesPagosRecentes(socio, 6) >= 3;
}

const NOVO_VAZIO = {
  nome: "", tlc: "", cpf: "", telefone: "", nascimento: "",
  metodoPagamento: "pix", plano: 20, diaVencimento: 5, observacao: "",
};

const EXEMPLOS = [
  { nome: "Ana Paula Ferreira", tlc: "TLC 42 - Maceió", cpf: "123.456.789-00", telefone: "(82) 99911-2233", nascimento: "1994-03-12", metodoPagamento: "pix", plano: 35, diaVencimento: 5, pagoMeses: [0, 1] },
  { nome: "Bruno Cavalcante Lima", tlc: "TLC 40 - Maceió", cpf: "987.654.321-00", telefone: "(82) 98822-1144", nascimento: "1990-07-25", metodoPagamento: "boleto", plano: 20, diaVencimento: 10, pagoMeses: [1] },
  { nome: "Carla Rejane Nunes", tlc: "TLC 45 - Maceió", cpf: "456.789.123-00", telefone: "(82) 97733-5566", nascimento: "1988-11-02", metodoPagamento: "cartao", plano: 50, diaVencimento: 15, pagoMeses: [0, 1, 2] },
  { nome: "Diego Alves Barbosa", tlc: "TLC 41 - Maceió", cpf: "321.654.987-00", telefone: "(82) 96644-7788", nascimento: "1996-01-19", metodoPagamento: "pix", plano: 20, diaVencimento: 20, pagoMeses: [] },
  { nome: "Elisângela Rocha Melo", tlc: "TLC 45 - Maceió", cpf: "654.321.987-00", telefone: "(82) 95533-9900", nascimento: "1992-09-08", metodoPagamento: "pix", plano: 50, diaVencimento: 30, pagoMeses: [0, 1, 2] },
  { nome: "Fábio Henrique Souza", tlc: "TLC 38 - Maceió", cpf: "159.753.486-00", telefone: "(82) 94411-3322", nascimento: "1985-05-30", metodoPagamento: "boleto", plano: 35, diaVencimento: 30, pagoMeses: [] },
];

export default function GestaoSociosTLC() {
  const [dados, setDados] = useState(null);
  const [aba, setAba] = useState("admin");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroPlano, setFiltroPlano] = useState("todos");
  const [filtroMetodo, setFiltroMetodo] = useState("todos");
  const [buscaParceiro, setBuscaParceiro] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [novo, setNovo] = useState(NOVO_VAZIO);
  const [editandoId, setEditandoId] = useState(null);
  const [erroForm, setErroForm] = useState(null);
  const [expandidos, setExpandidos] = useState({});
  const [socioSelecionadoNft, setSocioSelecionadoNft] = useState("");

  const socios = dados?.socios || [];

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY, true);
        setDados(res ? JSON.parse(res.value) : { contador: 1, socios: [] });
      } catch {
        setDados({ contador: 1, socios: [] });
      } finally {
        setCarregando(false);
      }
    })();
  }, []);

  async function salvar(novosDados) {
    setDados(novosDados);
    try {
      const res = await window.storage.set(STORAGE_KEY, JSON.stringify(novosDados), true);
      if (!res) setErro("Não foi possível salvar. Tente novamente.");
      else setErro(null);
    } catch {
      setErro("Não foi possível salvar. Tente novamente.");
    }
  }

  function carregarExemplos() {
    const lista = EXEMPLOS.map((e, i) => {
      const pagamentos = {};
      e.pagoMeses.forEach((offset) => {
        const key = mesKeyRelativo(offset);
        if (key) pagamentos[key] = true;
      });
      return {
        id: `${Date.now()}-${i}`,
        codigo: String(i + 1).padStart(4, "0"),
        nome: e.nome, tlc: e.tlc, cpf: e.cpf, telefone: e.telefone,
        nascimento: e.nascimento, metodoPagamento: e.metodoPagamento, plano: e.plano,
        diaVencimento: e.diaVencimento, pagamentos,
      };
    });
    salvar({ contador: EXEMPLOS.length + 1, socios: lista });
  }

  function abrirNovoCadastro() {
    setNovo(NOVO_VAZIO);
    setEditandoId(null);
    setErroForm(null);
    setMostrarForm(true);
  }

  function iniciarEdicao(s) {
    setNovo({
      nome: s.nome, tlc: s.tlc || "", cpf: s.cpf || "", telefone: s.telefone || "",
      nascimento: s.nascimento || "", metodoPagamento: s.metodoPagamento || "pix",
      plano: s.plano, diaVencimento: s.diaVencimento || 1, observacao: s.observacao || "",
    });
    setEditandoId(s.id);
    setErroForm(null);
    setMostrarForm(true);
  }

  function cancelarForm() {
    setNovo(NOVO_VAZIO);
    setEditandoId(null);
    setErroForm(null);
    setMostrarForm(false);
  }

  function salvarSocio(ev) {
    ev.preventDefault();
    if (!novo.nome.trim() || !novo.cpf.trim()) return;
    const cpfNormalizado = novo.cpf.trim();
    const cpfDuplicado = socios.some((s) => s.cpf.trim() === cpfNormalizado && s.id !== editandoId);
    if (cpfDuplicado) {
      setErroForm("Já existe um sócio cadastrado com esse CPF.");
      return;
    }

    if (editandoId) {
      const lista = socios.map((s) =>
        s.id === editandoId
          ? {
              ...s,
              nome: novo.nome.trim(), tlc: novo.tlc.trim(), cpf: cpfNormalizado,
              telefone: novo.telefone.trim(), nascimento: novo.nascimento,
              metodoPagamento: novo.metodoPagamento, plano: Number(novo.plano),
              diaVencimento: Number(novo.diaVencimento) || 1, observacao: novo.observacao.trim(),
            }
          : s
      );
      salvar({ ...dados, socios: lista });
    } else {
      const contadorAtual = dados?.contador || 1;
      const item = {
        id: `${Date.now()}`,
        codigo: String(contadorAtual).padStart(4, "0"),
        nome: novo.nome.trim(), tlc: novo.tlc.trim(), cpf: cpfNormalizado,
        telefone: novo.telefone.trim(), nascimento: novo.nascimento,
        metodoPagamento: novo.metodoPagamento, plano: Number(novo.plano),
        diaVencimento: Number(novo.diaVencimento) || 1, observacao: novo.observacao.trim(),
        pagamentos: {},
      };
      salvar({ contador: contadorAtual + 1, socios: [...socios, item] });
    }
    cancelarForm();
  }

  function marcarPagamento(id) {
    const chave = mesAtualKey();
    const lista = socios.map((s) =>
      s.id === id ? { ...s, pagamentos: { ...s.pagamentos, [chave]: true } } : s
    );
    salvar({ ...dados, socios: lista });
  }

  function removerSocio(id) {
    const alvo = socios.find((s) => s.id === id);
    const nome = alvo ? alvo.nome : "este sócio";
    const confirmar = window.confirm(
      `Remover ${nome} do cadastro? O histórico de pagamentos dessa pessoa será apagado e isso não pode ser desfeito.`
    );
    if (!confirmar) return;
    salvar({ ...dados, socios: socios.filter((s) => s.id !== id) });
  }

  function exportarCSV(lista) {
    const cabecalho = [
      "Código", "Nome", "TLC que fez", "CPF", "Telefone", "Data de nascimento",
      "Método de pagamento", "Plano", "Desconto", "Dia de vencimento",
      "Último pagamento", "Status", "Observação",
    ];
    const linhas = lista.map((s) => [
      s.codigo, s.nome, s.tlc || "", s.cpf || "", s.telefone || "", formatData(s.nascimento),
      metodoLabel(s.metodoPagamento), `R$ ${s.plano}`,
      `${PLANOS.find((p) => p.valor === s.plano)?.desconto ?? 0}%`,
      `Dia ${s.diaVencimento || 1}`, formatMes(ultimoPagamento(s)), statusDe(s), s.observacao || "",
    ]);
    const csv = [cabecalho, ...linhas]
      .map((linha) => linha.map((campo) => `"${String(campo).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `socios-tlc-${mesAtualKey()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function toggleExpandido(id) {
    setExpandidos((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function gerarCarteirinha(id) {
    const lista = socios.map((s) =>
      s.id === id
        ? { ...s, nftTokenId: s.nftTokenId || `TLC-NFT-${s.codigo}`, nftEmitidoEm: s.nftEmitidoEm || new Date().toISOString().slice(0, 10) }
        : s
    );
    salvar({ ...dados, socios: lista });
  }

  async function gerarCobranca(socio) {
    try {
      const resp = await fetch("/api/criar-cobranca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: socio.nome,
          cpf: socio.cpf,
          telefone: socio.telefone,
          valor: socio.plano,
          diaVencimento: socio.diaVencimento,
          codigo: socio.codigo,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        alert("Não foi possível gerar a cobrança: " + JSON.stringify(data.error));
        return;
      }
      window.open(data.link, "_blank");
    } catch (err) {
      alert("Erro ao conectar com o servidor de cobrança.");
    }
  }

  function renderBadge(status) {
    if (status === "adimplente") return <span className="tlc-badge tlc-badge-ok"><CheckCircle2 size={12} /> Adimplente</span>;
    if (status === "inativo") return <span className="tlc-badge tlc-badge-inativo"><MinusCircle size={12} /> Inativo</span>;
    return <span className="tlc-badge tlc-badge-no"><XCircle size={12} /> Inadimplente</span>;
  }

  const listaFiltrada = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return socios.filter((s) => {
      if (termo && !(s.nome.toLowerCase().includes(termo) || s.codigo.includes(termo))) return false;
      if (filtroStatus !== "todos" && statusDe(s) !== filtroStatus) return false;
      if (filtroPlano !== "todos" && s.plano !== Number(filtroPlano)) return false;
      if (filtroMetodo !== "todos" && s.metodoPagamento !== filtroMetodo) return false;
      return true;
    });
  }, [socios, busca, filtroStatus, filtroPlano, filtroMetodo]);

  const resultadoParceiro = useMemo(() => {
    if (!buscaParceiro.trim()) return null;
    const termo = buscaParceiro.trim().toLowerCase();
    const termoDigits = buscaParceiro.replace(/\D/g, "");
    return (
      socios.find(
        (s) =>
          s.codigo.toLowerCase() === termo ||
          s.nome.toLowerCase() === termo ||
          (termoDigits.length >= 8 && s.telefone && s.telefone.replace(/\D/g, "") === termoDigits)
      ) || "nao-encontrado"
    );
  }, [socios, buscaParceiro]);

  const totalAdimplentes = socios.filter((s) => statusDe(s) === "adimplente").length;
  const totalInativos = socios.filter((s) => statusDe(s) === "inativo").length;
  const totalInadimplentes = socios.filter((s) => statusDe(s) === "inadimplente").length;
  const taxaAdimplencia = socios.length ? Math.round((totalAdimplentes / socios.length) * 100) : 0;
  const receitaMensal = socios.filter((s) => statusDe(s) === "adimplente").reduce((soma, s) => soma + s.plano, 0);

  const listaLembrete = useMemo(() => {
    return socios
      .map((s) => ({ ...s, semContribuir: mesesEmAtraso(s) }))
      .filter((s) => s.semContribuir > 0 && s.semContribuir < MESES_PARA_INATIVAR && ehContribuinteRegular(s))
      .sort((a, b) => b.semContribuir - a.semContribuir);
  }, [socios]);

  const listaInativosHistorico = useMemo(() => {
    return socios.filter((s) => statusDe(s) === "inativo");
  }, [socios]);

  const aniversariantesDoMes = useMemo(() => {
    const mesAtual = new Date().getMonth() + 1;
    return socios
      .filter((s) => s.nascimento)
      .map((s) => ({ ...s, diaAniversario: parseInt(s.nascimento.split("-")[2], 10) }))
      .filter((s) => parseInt(s.nascimento.split("-")[1], 10) === mesAtual)
      .sort((a, b) => a.diaAniversario - b.diaAniversario);
  }, [socios]);

  const dadosMensais = useMemo(() => {
    const meses = ultimosMeses(6);
    return meses.map((m) => ({
      label: m.label,
      adimplentes: socios.filter((s) => s.pagamentos && s.pagamentos[m.key]).length,
    }));
  }, [socios]);

  const dadosPlano = useMemo(
    () => PLANOS.map((p) => ({ nome: `R$ ${p.valor}`, valor: socios.filter((s) => s.plano === p.valor).length })),
    [socios]
  );

  const dadosPlanoAdimplentes = useMemo(
    () => PLANOS.map((p) => ({
      nome: `R$ ${p.valor}`,
      valor: socios.filter((s) => s.plano === p.valor && statusDe(s) === "adimplente").length,
    })),
    [socios]
  );

  const dadosMetodo = useMemo(
    () => METODOS.map((m) => ({ nome: m.label, valor: socios.filter((s) => s.metodoPagamento === m.valor).length })),
    [socios]
  );

  const dadosStatus = useMemo(() => ([
    { nome: "Adimplentes", valor: totalAdimplentes },
    { nome: "Inadimplentes", valor: totalInadimplentes },
    { nome: "Inativos", valor: totalInativos },
  ]), [totalAdimplentes, totalInadimplentes, totalInativos]);

  const socioNft = socios.find((s) => s.id === socioSelecionadoNft);
  const carteirinhasEmitidas = socios.filter((s) => s.nftTokenId);

  return (
    <div className="tlc-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

        .tlc-root {
          --bg: #FAFAF8; --surface: #FFFFFF; --ink: #1C2B2D; --ink-soft: #5B6B69;
          --primary: #16305C; --primary-tint: #E6EBF3; --accent: #F5B301; --accent-tint: #FFF6DD;
          --danger: #A23B2E; --danger-tint: #F5E7E4; --border: #E4E1D8;
          --inativo: #7A7A72; --inativo-tint: #EEEEEA;
          font-family: 'IBM Plex Sans', sans-serif; color: var(--ink); background: var(--bg);
          min-height: 100%; padding: 32px 24px 48px;
        }
        .tlc-header { max-width: 1080px; margin: 0 auto 24px; }
        .tlc-wordmark { font-family: 'Lora', serif; font-size: 22px; font-weight: 600; letter-spacing: 0.2px; }
        .tlc-sub { color: var(--ink-soft); font-size: 14px; margin-top: 2px; }
        .tlc-tabs { display: flex; gap: 4px; margin-top: 20px; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
        .tlc-tab { display: flex; align-items: center; gap: 6px; padding: 10px 16px; font-size: 14px; font-weight: 500; color: var(--ink-soft); border-bottom: 2px solid transparent; cursor: pointer; background: none; border-left: none; border-right: none; border-top: none; }
        .tlc-tab.active { color: var(--primary); border-bottom-color: var(--primary); }
        .tlc-tab .tlc-tab-count { background: var(--accent-tint); color: var(--accent); font-size: 11px; font-weight: 600; padding: 1px 6px; border-radius: 999px; }
        .tlc-card { max-width: 1080px; margin: 20px auto 0; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 20px; }
        .tlc-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .tlc-search { display: flex; align-items: center; gap: 8px; border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; background: var(--bg); flex: 1; min-width: 200px; }
        .tlc-search input { border: none; background: none; outline: none; font-size: 14px; width: 100%; color: var(--ink); }
        .tlc-btn { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 500; padding: 9px 14px; border-radius: 8px; cursor: pointer; border: 1px solid transparent; white-space: nowrap; }
        .tlc-btn-primary { background: var(--primary); color: white; }
        .tlc-btn-ghost { background: none; border-color: var(--border); color: var(--ink); }
        .tlc-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .tlc-form { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 16px; }
        .tlc-form-actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; }
        .tlc-field label { display: block; font-size: 12px; color: var(--ink-soft); margin-bottom: 4px; }
        .tlc-field input, .tlc-field select { width: 100%; border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; font-size: 14px; background: var(--surface); color: var(--ink); box-sizing: border-box; }
        .tlc-filtros { display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
        .tlc-filtros select { border: 1px solid var(--border); border-radius: 8px; padding: 7px 10px; font-size: 13px; background: var(--surface); color: var(--ink); }
        .tlc-table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; }
        .tlc-table th { text-align: left; color: var(--ink-soft); font-weight: 500; font-size: 12px; padding: 8px 10px; border-bottom: 1px solid var(--border); }
        .tlc-table td { padding: 10px 10px; border-bottom: 1px solid var(--border); vertical-align: middle; }
        .tlc-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 500; padding: 4px 9px; border-radius: 999px; }
        .tlc-badge-ok { background: var(--primary-tint); color: var(--primary); }
        .tlc-badge-no { background: var(--danger-tint); color: var(--danger); }
        .tlc-badge-inativo { background: var(--inativo-tint); color: var(--inativo); }
        .tlc-icon-btn { border: none; background: none; cursor: pointer; color: var(--ink-soft); padding: 4px; border-radius: 6px; }
        .tlc-icon-btn:hover { background: var(--bg); }
        .tlc-empty { text-align: center; padding: 40px 20px; color: var(--ink-soft); }
        .tlc-detail-row td { background: var(--bg); }
        .tlc-detail-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px 20px; font-size: 13px; padding: 6px 4px; }
        .tlc-detail-grid div span { display: block; color: var(--ink-soft); font-size: 11px; margin-bottom: 2px; }
        .tlc-partner-box { max-width: 460px; margin: 40px auto 0; }
        .tlc-partner-search { display: flex; gap: 8px; }
        .tlc-partner-search input { flex: 1; border: 1px solid var(--border); border-radius: 8px; padding: 12px 14px; font-size: 15px; outline: none; }
        .tlc-partner-search input:focus { border-color: var(--primary); }
        .tlc-result { margin-top: 20px; border-radius: 10px; padding: 20px; border: 1px solid var(--border); }
        .tlc-result.ok { background: var(--primary-tint); border-color: var(--primary); }
        .tlc-result.no { background: var(--danger-tint); border-color: var(--danger); }
        .tlc-result-name { font-family: 'Lora', serif; font-size: 18px; margin-bottom: 4px; }
        .tlc-error { color: var(--danger); font-size: 13px; margin-top: 10px; }
        .tlc-note { font-size: 12px; color: var(--ink-soft); margin-top: 14px; }
        .tlc-kpis { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 20px; }
        .tlc-kpi { border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; background: var(--bg); }
        .tlc-kpi-label { font-size: 12px; color: var(--ink-soft); }
        .tlc-kpi-value { font-family: 'Lora', serif; font-size: 24px; margin-top: 4px; color: var(--primary); }
        .tlc-kpi-value.alerta { color: var(--danger); }
        .tlc-charts { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .tlc-chart-box { border: 1px solid var(--border); border-radius: 10px; padding: 16px; }
        .tlc-chart-title { font-size: 13px; font-weight: 500; color: var(--ink-soft); margin-bottom: 10px; }
        .tlc-charts-secondary { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
        .tlc-nft-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
        .tlc-carteirinha {
          border-radius: 16px; padding: 22px; color: white; min-height: 190px;
          background: linear-gradient(135deg, var(--primary), #0B1B36);
          display: flex; flex-direction: column; justify-content: space-between;
          box-shadow: 0 8px 24px rgba(22,48,92,0.3);
        }
        .tlc-carteirinha-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .tlc-carteirinha-brand { font-family: 'Lora', serif; font-size: 15px; letter-spacing: 0.3px; }
        .tlc-carteirinha-nome { font-family: 'Lora', serif; font-size: 19px; margin-top: 18px; }
        .tlc-carteirinha-meta { font-size: 12px; opacity: 0.85; margin-top: 4px; }
        .tlc-carteirinha-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; font-size: 12px; }
        .tlc-carteirinha-token { font-family: monospace; font-size: 12px; opacity: 0.9; }
        .tlc-nft-list { border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
        .tlc-nft-list-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-bottom: 1px solid var(--border); font-size: 13px; }
        .tlc-nft-list-item:last-child { border-bottom: none; }
        .tlc-cobranca-item {
          display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto;
          align-items: center; gap: 10px; padding: 12px 10px; border-bottom: 1px solid var(--border); font-size: 14px;
        }
        .tlc-cobranca-item:last-child { border-bottom: none; }
        .tlc-cobranca-nome { font-weight: 500; }
        .tlc-cobranca-sub { font-size: 12px; color: var(--ink-soft); display: flex; align-items: center; gap: 4px; margin-top: 2px; }
        .tlc-cobranca-atraso { font-weight: 600; }
        .tlc-cobranca-header { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; font-size: 12px; color: var(--ink-soft); padding: 0 10px 8px; border-bottom: 1px solid var(--border); }
        .tlc-historico-list { border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
        .tlc-historico-item { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 14px; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
        .tlc-historico-item:last-child { border-bottom: none; }
        .tlc-historico-nome { font-weight: 500; font-size: 14px; min-width: 160px; }
        .tlc-historico-meses { display: flex; gap: 14px; }
        .tlc-historico-mes { display: flex; flex-direction: column; align-items: center; gap: 3px; font-size: 10px; color: var(--ink-soft); }
        .tlc-aniversario-list { border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
        .tlc-aniversario-item { display: flex; justify-content: space-between; padding: 10px 14px; border-bottom: 1px solid var(--border); font-size: 13px; }
        .tlc-aniversario-item:last-child { border-bottom: none; }
        .tlc-aniversario-dia { color: var(--accent); font-weight: 500; }
      `}</style>

      <div className="tlc-header">
        <div className="tlc-wordmark">TLC · Sócios contribuintes</div>
        <div className="tlc-sub">
          {carregando
            ? "Carregando dados..."
            : `${socios.length} sócios cadastrados · ${totalAdimplentes} em dia · ${totalInadimplentes} inadimplentes · ${totalInativos} inativos`}
        </div>
        <div className="tlc-tabs">
          <button className={`tlc-tab ${aba === "admin" ? "active" : ""}`} onClick={() => setAba("admin")}>
            <Users size={15} /> Painel administrativo
          </button>
          <button className={`tlc-tab ${aba === "cobranca" ? "active" : ""}`} onClick={() => setAba("cobranca")}>
            <Bell size={15} /> Contribuintes
            {listaLembrete.length > 0 && <span className="tlc-tab-count">{listaLembrete.length}</span>}
          </button>
          <button className={`tlc-tab ${aba === "indicadores" ? "active" : ""}`} onClick={() => setAba("indicadores")}>
            <BarChart3 size={15} /> Indicadores
          </button>
          <button className={`tlc-tab ${aba === "nft" ? "active" : ""}`} onClick={() => setAba("nft")}>
            <CreditCard size={15} /> Carteirinha NFT
          </button>
          <button className={`tlc-tab ${aba === "parceiro" ? "active" : ""}`} onClick={() => setAba("parceiro")}>
            <Store size={15} /> Consulta de parceiros
          </button>
        </div>
      </div>

      {aba === "admin" && (
        <div className="tlc-card">
          <div className="tlc-row">
            <div className="tlc-search">
              <Search size={15} color="var(--ink-soft)" />
              <input placeholder="Buscar por nome ou código" value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
            <button className="tlc-btn tlc-btn-ghost" onClick={() => exportarCSV(listaFiltrada)} disabled={listaFiltrada.length === 0}>
              <Download size={15} /> Exportar CSV
            </button>
            <button className="tlc-btn tlc-btn-primary" onClick={() => (mostrarForm ? cancelarForm() : abrirNovoCadastro())}>
              <UserPlus size={15} /> Novo sócio
            </button>
          </div>

          <div className="tlc-filtros">
            <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
              <option value="todos">Status: todos</option>
              <option value="adimplente">Adimplentes</option>
              <option value="inadimplente">Inadimplentes</option>
              <option value="inativo">Inativos</option>
            </select>
            <select value={filtroPlano} onChange={(e) => setFiltroPlano(e.target.value)}>
              <option value="todos">Plano: todos</option>
              {PLANOS.map((p) => (<option key={p.valor} value={p.valor}>R$ {p.valor}</option>))}
            </select>
            <select value={filtroMetodo} onChange={(e) => setFiltroMetodo(e.target.value)}>
              <option value="todos">Método: todos</option>
              {METODOS.map((m) => (<option key={m.valor} value={m.valor}>{m.label}</option>))}
            </select>
            {(filtroStatus !== "todos" || filtroPlano !== "todos" || filtroMetodo !== "todos") && (
              <button className="tlc-btn tlc-btn-ghost" onClick={() => { setFiltroStatus("todos"); setFiltroPlano("todos"); setFiltroMetodo("todos"); }}>
                Limpar filtros
              </button>
            )}
          </div>

          {mostrarForm && (
            <form className="tlc-form" onSubmit={salvarSocio}>
              <div className="tlc-field">
                <label>Nome completo</label>
                <input value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} placeholder="Nome completo" required />
              </div>
              <div className="tlc-field">
                <label>TLC que fez</label>
                <input value={novo.tlc} onChange={(e) => setNovo({ ...novo, tlc: e.target.value })} placeholder="Ex: TLC 45 - Maceió" />
              </div>
              <div className="tlc-field">
                <label>CPF</label>
                <input value={novo.cpf} onChange={(e) => setNovo({ ...novo, cpf: e.target.value })} placeholder="000.000.000-00" required />
              </div>
              <div className="tlc-field">
                <label>Telefone</label>
                <input value={novo.telefone} onChange={(e) => setNovo({ ...novo, telefone: e.target.value })} placeholder="(82) 90000-0000" />
              </div>
              <div className="tlc-field">
                <label>Data de nascimento</label>
                <input type="date" value={novo.nascimento} onChange={(e) => setNovo({ ...novo, nascimento: e.target.value })} />
              </div>
              <div className="tlc-field">
                <label>Método de pagamento</label>
                <select value={novo.metodoPagamento} onChange={(e) => setNovo({ ...novo, metodoPagamento: e.target.value })}>
                  {METODOS.map((m) => (<option key={m.valor} value={m.valor}>{m.label}</option>))}
                </select>
              </div>
              <div className="tlc-field">
                <label>Plano</label>
                <select value={novo.plano} onChange={(e) => setNovo({ ...novo, plano: e.target.value })}>
                  {PLANOS.map((p) => (<option key={p.valor} value={p.valor}>R$ {p.valor} · {p.desconto}% de desconto</option>))}
                </select>
              </div>
              <div className="tlc-field">
                <label>Dia de vencimento</label>
                <select value={novo.diaVencimento} onChange={(e) => setNovo({ ...novo, diaVencimento: e.target.value })}>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>Dia {d}</option>
                  ))}
                </select>
                <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 4 }}>
                  Em meses mais curtos (fevereiro, por exemplo), o vencimento cai automaticamente no último dia do mês.
                </div>
              </div>
              <div className="tlc-field">
                <label>Código / matrícula</label>
                <input
                  value={
                    editandoId
                      ? `${socios.find((s) => s.id === editandoId)?.codigo || ""} (não pode ser alterado)`
                      : `gerado automaticamente (${String(dados?.contador || 1).padStart(4, "0")})`
                  }
                  disabled
                />
              </div>
              <div className="tlc-field" style={{ gridColumn: "1 / -1" }}>
                <label>Observação (opcional)</label>
                <input
                  value={novo.observacao}
                  onChange={(e) => setNovo({ ...novo, observacao: e.target.value })}
                  placeholder="Ex: avisou que vai atrasar em outubro por viagem"
                />
              </div>
              {erroForm && <div className="tlc-error" style={{ gridColumn: "1 / -1" }}>{erroForm}</div>}
              <div className="tlc-form-actions">
                {editandoId && (
                  <button className="tlc-btn tlc-btn-ghost" type="button" onClick={cancelarForm} style={{ marginRight: 8 }}>
                    Cancelar
                  </button>
                )}
                <button className="tlc-btn tlc-btn-primary" type="submit">
                  {editandoId ? "Salvar alterações" : "Adicionar sócio"}
                </button>
              </div>
            </form>
          )}

          {!carregando && socios.length === 0 && (
            <div className="tlc-empty">
              Nenhum sócio cadastrado ainda.
              <div style={{ marginTop: 12 }}>
                <button className="tlc-btn tlc-btn-ghost" onClick={carregarExemplos}>
                  <RefreshCw size={14} /> Carregar sócios de exemplo
                </button>
              </div>
            </div>
          )}

          {!carregando && socios.length > 0 && listaFiltrada.length === 0 && (
            <div className="tlc-empty">Nenhum sócio corresponde a esses filtros.</div>
          )}

          {!carregando && listaFiltrada.length > 0 && (
            <table className="tlc-table">
              <thead>
                <tr>
                  <th></th><th>Nome</th><th>Código</th><th>Plano</th><th>Desconto</th>
                  <th>Vencimento</th><th>Último pagamento</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {listaFiltrada.map((s) => {
                  const status = statusDe(s);
                  const desconto = PLANOS.find((p) => p.valor === s.plano)?.desconto ?? 0;
                  const aberto = !!expandidos[s.id];
                  return (
                    <>
                      <tr key={s.id}>
                        <td>
                          <button className="tlc-icon-btn" onClick={() => toggleExpandido(s.id)} title="Ver detalhes">
                            {aberto ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </button>
                        </td>
                        <td>{s.nome}</td>
                        <td>{s.codigo}</td>
                        <td>R$ {s.plano}</td>
                        <td>{desconto}%</td>
                        <td>Dia {proximoVencimento(s).getDate()}</td>
                        <td>{formatMes(ultimoPagamento(s))}</td>
                        <td>{renderBadge(status)}</td>
                        <td>
                          <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", flexWrap: "wrap" }}>
                            {status !== "adimplente" && (
                              <button className="tlc-btn tlc-btn-ghost" onClick={() => marcarPagamento(s.id)} title="Marcar pagamento deste mês">
                                Marcar pago
                              </button>
                            )}
                            <button className="tlc-btn tlc-btn-ghost" onClick={() => gerarCobranca(s)} title="Gerar cobrança no Asaas">
                              Gerar cobrança
                            </button>
                            <button className="tlc-icon-btn" onClick={() => iniciarEdicao(s)} title="Editar sócio">
                              <Pencil size={15} />
                            </button>
                            <button className="tlc-icon-btn" onClick={() => removerSocio(s.id)} title="Remover sócio">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {aberto && (
                        <tr className="tlc-detail-row" key={`${s.id}-detalhe`}>
                          <td colSpan={9}>
                            <div className="tlc-detail-grid">
                              <div><span>TLC que fez</span>{s.tlc || "—"}</div>
                              <div><span>CPF</span>{s.cpf || "—"}</div>
                              <div><span>Telefone</span>{s.telefone || "—"}</div>
                              <div><span>Data de nascimento</span>{formatData(s.nascimento)}</div>
                              <div><span>Método de pagamento</span>{metodoLabel(s.metodoPagamento)}</div>
                              <div><span>Dia de vencimento escolhido</span>Dia {s.diaVencimento || 1}</div>
                              <div><span>Carteirinha NFT</span>{s.nftTokenId || "não emitida"}</div>
                              <div style={{ gridColumn: "1 / -1" }}><span>Observação</span>{s.observacao || "—"}</div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          )}

          {erro && <div className="tlc-error">{erro}</div>}
          <div className="tlc-note">
            Sócios com {MESES_PARA_INATIVAR} meses seguidos sem pagamento aparecem automaticamente como "Inativo" —
            voltam a "Adimplente" assim que um pagamento for marcado. Este painel é visível para qualquer pessoa que
            abrir este link — não há login separado para administrador; em produção, restrinja o acesso com autenticação.
          </div>
        </div>
      )}

      {aba === "cobranca" && (
        <div className="tlc-card">
          <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 18 }}>
            O TLC é um movimento sem fins lucrativos — ninguém é cobrado por ficar sem contribuir em algum mês.
            Esta lista serve só para lembrar, com carinho, quem contribui regularmente e ficou algum mês sem
            contribuir — pode ter sido só um esquecimento.
          </div>

          <div className="tlc-kpis" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            <div className="tlc-kpi">
              <div className="tlc-kpi-label">Contribuintes regulares sem contribuir este mês</div>
              <div className="tlc-kpi-value">{listaLembrete.length}</div>
            </div>
            <div className="tlc-kpi">
              <div className="tlc-kpi-label">Já catalogados como inativos</div>
              <div className="tlc-kpi-value">{totalInativos}</div>
            </div>
          </div>

          {listaLembrete.length === 0 ? (
            <div className="tlc-empty">Nenhum contribuinte regular precisa de lembrete no momento. 🎉</div>
          ) : (
            <>
              <div className="tlc-chart-title" style={{ marginBottom: 4 }}>
                Ordenado por quem está há mais tempo sem contribuir
              </div>
              <div className="tlc-cobranca-header">
                <span>Sócio</span><span>Plano</span><span>Meses sem contribuir</span><span>Status</span><span></span>
              </div>
              {listaLembrete.map((s) => (
                <div className="tlc-cobranca-item" key={s.id} style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr auto" }}>
                  <div>
                    <div className="tlc-cobranca-nome">{s.nome}</div>
                    <div className="tlc-cobranca-sub">
                      {s.telefone && (<><Phone size={11} /> {s.telefone} · </>)}
                      vence dia {proximoVencimento(s).getDate()}
                    </div>
                  </div>
                  <span>R$ {s.plano}</span>
                  <span className="tlc-cobranca-atraso">
                    {s.semContribuir} {s.semContribuir === 1 ? "mês" : "meses"}
                  </span>
                  <span>{renderBadge(statusDe(s))}</span>
                  <button className="tlc-btn tlc-btn-ghost" onClick={() => marcarPagamento(s.id)}>Registrar contribuição</button>
                </div>
              ))}
            </>
          )}

          <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
            <div className="tlc-chart-title" style={{ marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
              <Cake size={14} /> Aniversariantes do mês
            </div>
            {aniversariantesDoMes.length === 0 ? (
              <div className="tlc-empty" style={{ padding: 16 }}>Nenhum sócio faz aniversário este mês.</div>
            ) : (
              <div className="tlc-aniversario-list">
                {aniversariantesDoMes.map((s) => (
                  <div className="tlc-aniversario-item" key={s.id}>
                    <span>{s.nome}</span>
                    <span className="tlc-aniversario-dia">dia {s.diaAniversario}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
            <div className="tlc-chart-title" style={{ marginBottom: 4 }}>
              Histórico de inativos (4+ meses sem contribuir)
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 12 }}>
              Sem cobrança — apenas o registro de quais meses cada um contribuiu ou não, para consulta futura.
            </div>
            {listaInativosHistorico.length === 0 ? (
              <div className="tlc-empty">Nenhum sócio inativo no momento.</div>
            ) : (
              <div className="tlc-historico-list">
                {listaInativosHistorico.map((s) => (
                  <div className="tlc-historico-item" key={s.id}>
                    <div className="tlc-historico-nome">{s.nome}</div>
                    <div className="tlc-historico-meses">
                      {ultimosMeses(6).map((m) => {
                        const pago = s.pagamentos && s.pagamentos[m.key];
                        return (
                          <div className="tlc-historico-mes" key={m.key}>
                            <span>{m.label}</span>
                            {pago ? <CheckCircle2 size={14} color="var(--primary)" /> : <XCircle size={14} color="var(--border)" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {aba === "indicadores" && (
        <div className="tlc-card">
          {socios.length === 0 ? (
            <div className="tlc-empty">
              Cadastre sócios (ou carregue os de exemplo na aba "Painel administrativo") para ver os indicadores.
            </div>
          ) : (
            <>
              <div className="tlc-kpis">
                <div className="tlc-kpi">
                  <div className="tlc-kpi-label">Total de sócios</div>
                  <div className="tlc-kpi-value">{socios.length}</div>
                </div>
                <div className="tlc-kpi">
                  <div className="tlc-kpi-label">Adimplentes agora</div>
                  <div className="tlc-kpi-value">{totalAdimplentes}</div>
                </div>
                <div className="tlc-kpi">
                  <div className="tlc-kpi-label">Taxa de adimplência</div>
                  <div className="tlc-kpi-value">{taxaAdimplencia}%</div>
                </div>
                <div className="tlc-kpi">
                  <div className="tlc-kpi-label">Inativos</div>
                  <div className="tlc-kpi-value alerta">{totalInativos}</div>
                </div>
                <div className="tlc-kpi">
                  <div className="tlc-kpi-label">Receita confirmada no mês</div>
                  <div className="tlc-kpi-value">R$ {receitaMensal}</div>
                </div>
              </div>

              <div className="tlc-chart-box">
                <div className="tlc-chart-title">Sócios em dia por mês (últimos 6 meses)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={dadosMensais}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--ink-soft)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="adimplentes" name="Sócios em dia" fill={COLOR_PRIMARY} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="tlc-charts" style={{ marginTop: 20 }}>
                <div className="tlc-chart-box">
                  <div className="tlc-chart-title">Distribuição por plano — geral</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={dadosPlano} dataKey="valor" nameKey="nome" innerRadius={45} outerRadius={80} paddingAngle={2}>
                        {dadosPlano.map((_, i) => (<Cell key={i} fill={PALETA[i % PALETA.length]} />))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="tlc-chart-box">
                  <div className="tlc-chart-title">Distribuição por plano — só adimplentes</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={dadosPlanoAdimplentes} dataKey="valor" nameKey="nome" innerRadius={45} outerRadius={80} paddingAngle={2}>
                        {dadosPlanoAdimplentes.map((_, i) => (<Cell key={i} fill={PALETA[i % PALETA.length]} />))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="tlc-charts-secondary">
                <div className="tlc-chart-box">
                  <div className="tlc-chart-title">Sócios por método de pagamento</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={dadosMetodo} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="nome" tick={{ fontSize: 12, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} width={110} />
                      <Tooltip />
                      <Bar dataKey="valor" name="Sócios" fill={COLOR_ACCENT} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="tlc-chart-box">
                  <div className="tlc-chart-title">Adimplentes x inadimplentes x inativos</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={dadosStatus} dataKey="valor" nameKey="nome" innerRadius={45} outerRadius={80} paddingAngle={2}>
                        <Cell fill={COLOR_PRIMARY} />
                        <Cell fill={COLOR_DANGER} />
                        <Cell fill={COLOR_INATIVO} />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="tlc-note">
                "Sócios em dia por mês" conta, para cada mês, quantos sócios atualmente cadastrados têm pagamento
                registrado naquele mês. Sócios com {MESES_PARA_INATIVAR}+ meses seguidos sem pagar entram como "inativos".
              </div>
            </>
          )}
        </div>
      )}

      {aba === "nft" && (
        <div className="tlc-card">
          <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 16, display: "flex", gap: 8, alignItems: "flex-start" }}>
            <Sparkles size={16} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>
              Aqui a carteirinha NFT funciona como identidade digital do sócio — não como controle financeiro.
              O status "ativa/suspensa" continua vindo da adimplência real; o token abaixo é uma representação
              simbólica para teste, sem emissão em blockchain de fato.
            </span>
          </div>

          {socios.length === 0 ? (
            <div className="tlc-empty">Cadastre sócios para gerar carteirinhas.</div>
          ) : (
            <div className="tlc-nft-layout">
              <div>
                <div className="tlc-field" style={{ marginBottom: 14 }}>
                  <label>Selecionar sócio</label>
                  <select value={socioSelecionadoNft} onChange={(e) => setSocioSelecionadoNft(e.target.value)}>
                    <option value="">Escolha um sócio</option>
                    {socios.map((s) => (<option key={s.id} value={s.id}>{s.nome} · {s.codigo}</option>))}
                  </select>
                </div>

                {socioNft && (
                  <>
                    <div className="tlc-carteirinha">
                      <div className="tlc-carteirinha-top">
                        <div className="tlc-carteirinha-brand">TLC · Carteirinha de Sócio</div>
                        {statusDe(socioNft) === "adimplente" ? (
                          <span className="tlc-badge tlc-badge-ok" style={{ background: "rgba(255,255,255,0.18)", color: "white" }}>
                            <CheckCircle2 size={12} /> Ativa
                          </span>
                        ) : (
                          <span className="tlc-badge tlc-badge-no" style={{ background: "rgba(255,255,255,0.18)", color: "white" }}>
                            <XCircle size={12} /> Suspensa
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="tlc-carteirinha-nome">{socioNft.nome}</div>
                        <div className="tlc-carteirinha-meta">{socioNft.tlc || "Turma não informada"} · Plano R$ {socioNft.plano}</div>
                      </div>
                      <div className="tlc-carteirinha-footer">
                        <span className="tlc-carteirinha-token">{socioNft.nftTokenId || "token ainda não gerado"}</span>
                        <span>{socioNft.codigo}</span>
                      </div>
                    </div>
                    <div style={{ marginTop: 14 }}>
                      {socioNft.nftTokenId ? (
                        <div className="tlc-note" style={{ marginTop: 0 }}>
                          Carteirinha gerada em {formatData(socioNft.nftEmitidoEm)}.
                        </div>
                      ) : (
                        <button className="tlc-btn tlc-btn-primary" onClick={() => gerarCarteirinha(socioNft.id)}>
                          <CreditCard size={15} /> Gerar carteirinha
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div>
                <div className="tlc-chart-title">Carteirinhas já emitidas ({carteirinhasEmitidas.length})</div>
                {carteirinhasEmitidas.length === 0 ? (
                  <div className="tlc-empty" style={{ padding: 24 }}>Nenhuma carteirinha emitida ainda.</div>
                ) : (
                  <div className="tlc-nft-list">
                    {carteirinhasEmitidas.map((s) => (
                      <div className="tlc-nft-list-item" key={s.id}>
                        <span>{s.nome}</span>
                        <span className="tlc-carteirinha-token" style={{ color: "var(--ink-soft)" }}>{s.nftTokenId}</span>
                        {renderBadge(statusDe(s))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {aba === "parceiro" && (
        <div className="tlc-partner-box">
          <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 8 }}>
            Consulte pelo nome, código ou telefone do sócio para conceder o desconto de parceiro.
          </div>
          <div className="tlc-partner-search">
            <input placeholder="Nome completo, código ou telefone" value={buscaParceiro} onChange={(e) => setBuscaParceiro(e.target.value)} />
          </div>

          {resultadoParceiro === "nao-encontrado" && (
            <div className="tlc-result no">
              <div className="tlc-result-name">Sócio não encontrado</div>
              <div>Confira o nome ou o código informado.</div>
            </div>
          )}

          {resultadoParceiro && resultadoParceiro !== "nao-encontrado" && (
            <div className={`tlc-result ${statusDe(resultadoParceiro) === "adimplente" ? "ok" : "no"}`}>
              <div className="tlc-result-name">{resultadoParceiro.nome}</div>
              {statusDe(resultadoParceiro) === "adimplente" ? (
                <>
                  <div className="tlc-badge tlc-badge-ok" style={{ marginBottom: 8 }}>
                    <ShieldCheck size={13} /> Sócio adimplente
                  </div>
                  <div>
                    Desconto de parceiro aplicável:{" "}
                    <strong>{PLANOS.find((p) => p.valor === resultadoParceiro.plano)?.desconto ?? 0}%</strong>
                  </div>
                </>
              ) : (
                <div>Sócio {statusDe(resultadoParceiro) === "inativo" ? "inativo" : "inadimplente"} — desconto de parceiro não aplicável no momento.</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
