const export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { nome, cpf, telefone, valor, diaVencimento, codigo, metodoPagamento } =
    req.body;

  const tipoCobranca = metodoPagamento === "cartao" ? "CREDIT_CARD" : "PIX";

  const tipoCobranca = metodoPagamento === "cartao" ? "CREDIT_CARD" : "PIX";

  if (!nome || !cpf || !valor || !codigo) {
    return res.status(400).json({ error: "Dados incompletos" });
  }

  const ASAAS_URL = "https://sandbox.asaas.com/api/v3";
  const headers = {
    "Content-Type": "application/json",
    access_token: process.env.ASAAS_API_KEY,
  };

  try {
    const cpfLimpo = cpf.replace(/\D/g, "");
    const buscaResp = await fetch(
      `${ASAAS_URL}/customers?cpfCnpj=${cpfLimpo}`,
      { headers }
    );
    const busca = await buscaResp.json();

    let clienteId;
    if (busca.data && busca.data.length > 0) {
      clienteId = busca.data[0].id;
    } else {
      const clienteResp = await fetch(`${ASAAS_URL}/customers`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: nome,
          cpfCnpj: cpfLimpo,
          mobilePhone: telefone ? telefone.replace(/\D/g, "") : undefined,
          externalReference: codigo,
        }),
      });
      const cliente = await clienteResp.json();
      if (!clienteResp.ok) {
        return res
          .status(400)
          .json({ error: cliente.errors || "Erro ao criar cliente" });
      }
      clienteId = cliente.id;
    }

    const hoje = new Date();
    const dia = Math.min(
      diaVencimento || 5,
      new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate()
    );
    let vencimento = new Date(hoje.getFullYear(), hoje.getMonth(), dia);
    if (vencimento < hoje) {
      vencimento = new Date(hoje.getFullYear(), hoje.getMonth() + 1, dia);
    }
    const vencimentoStr = vencimento.toISOString().slice(0, 10);

    const cobrancaResp = await fetch(`${ASAAS_URL}/payments`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        customer: clienteId,
        billingType: tipoCobranca,
        value: valor,
        dueDate: vencimentoStr,
        description: "Contribuição TLC",
        externalReference: codigo,
      }),
    });
    const cobranca = await cobrancaResp.json();
    if (!cobrancaResp.ok) {
      return res
        .status(400)
        .json({ error: cobranca.errors || "Erro ao criar cobrança" });
    }

    return res
      .status(200)
      .json({ link: cobranca.invoiceUrl, vencimento: vencimentoStr });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Erro interno ao conectar com o Asaas" });
  }
}
