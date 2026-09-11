export default async function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método não permitido" });
    }
  
    const tokenRecebido = req.headers["asaas-access-token"];
    if (tokenRecebido !== process.env.ASAAS_WEBHOOK_TOKEN) {
      return res.status(401).json({ error: "Token inválido" });
    }
  
    const evento = req.body;
    const eventosAceitos = ["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"];
    if (!eventosAceitos.includes(evento.event)) {
      return res.status(200).json({ ignorado: true });
    }
  
    const codigo = evento.payment?.externalReference;
    if (!codigo) {
      return res.status(200).json({ ignorado: "sem referência" });
    }
  
    const SUPABASE_URL = "https://rciwpagstiiyuxuswezk.supabase.co";
    const SUPABASE_KEY = "sb_publishable_pNyC4tblU9tz_R6WVTXQsQ_8TBL-uyg";
    const STORAGE_KEY = "tlc-socios-v4";
  
    try {
      const leituraResp = await fetch(
        `${SUPABASE_URL}/rest/v1/kv_store?key=eq.${STORAGE_KEY}&select=value`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
      );
      const linhas = await leituraResp.json();
      if (!linhas || linhas.length === 0) {
        return res.status(200).json({ ignorado: "sem dados" });
      }
  
      const dados = JSON.parse(linhas[0].value);
      const hoje = new Date();
      const mesChave = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
  
      let encontrado = false;
      dados.socios = dados.socios.map((s) => {
        if (s.codigo === codigo) {
          encontrado = true;
          return { ...s, pagamentos: { ...s.pagamentos, [mesChave]: true } };
        }
        return s;
      });
  
      if (!encontrado) {
        return res.status(200).json({ ignorado: "sócio não encontrado" });
      }
  
      await fetch(`${SUPABASE_URL}/rest/v1/kv_store?key=eq.${STORAGE_KEY}`, {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ value: JSON.stringify(dados) }),
      });
  
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao processar webhook" });
    }
  }