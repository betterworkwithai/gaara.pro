import json
import re
import base64
from typing import List, Dict, Any, Optional
import anthropic
from app.core.config import settings


def get_client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)


def extract_transactions_from_pdf(pdf_bytes: bytes, document_type: str) -> List[Dict]:
    """Use Claude's PDF vision to extract transactions directly from PDF bytes."""
    client = get_client()
    doc_label = "fatura de cartão de crédito" if document_type == "credit_card" else "extrato bancário"
    pdf_b64 = base64.standard_b64encode(pdf_bytes).decode("utf-8")

    prompt = f"""Você é um assistente financeiro brasileiro especializado em análise de extratos bancários.
Analise este {doc_label} e extraia TODAS as transações encontradas.

Retorne APENAS um JSON válido com uma lista de objetos no seguinte formato (sem markdown, sem texto extra):
[
  {{
    "date": "YYYY-MM-DD",
    "description": "descrição da transação",
    "amount": 123.45,
    "type": "expense"
  }}
]

Regras:
- Para cartão de crédito: todas as compras são "expense", pagamentos/créditos são "income"
- Para extrato bancário: depósitos/transferências recebidas são "income", saques/compras/débitos são "expense"
- O campo "amount" deve ser sempre positivo (número, não string)
- O campo "date" deve estar no formato YYYY-MM-DD
- Se a data estiver incompleta, use o mês/ano do extrato
- Ignore linhas de saldo, totais e cabeçalhos
- Se não encontrar transações, retorne []"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "document",
                    "source": {
                        "type": "base64",
                        "media_type": "application/pdf",
                        "data": pdf_b64,
                    },
                },
                {
                    "type": "text",
                    "text": prompt,
                },
            ],
        }],
    )

    response_text = message.content[0].text.strip()

    # Extract JSON from response
    json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group())
        except json.JSONDecodeError:
            pass

    return []


def categorize_transactions(transactions: List[Dict], categories: List[Dict]) -> List[Dict]:
    if not transactions or not categories:
        return transactions

    client = get_client()
    categories_str = json.dumps(
        [{"id": c["id"], "name": c["name"], "type": c["type"]} for c in categories],
        ensure_ascii=False,
    )
    transactions_str = json.dumps(
        [{"index": i, "description": t["description"], "type": t["type"]}
         for i, t in enumerate(transactions)],
        ensure_ascii=False,
    )

    prompt = f"""Você é um assistente financeiro brasileiro. Categorize cada transação nas categorias disponíveis.

Categorias disponíveis:
{categories_str}

Transações para categorizar:
{transactions_str}

Retorne APENAS um JSON válido (sem markdown, sem texto extra) com a lista de categorizações:
[
  {{
    "index": 0,
    "category_id": 1,
    "confidence": "high"
  }}
]

- Use a categoria mais adequada para cada transação
- Se não houver categoria adequada, use null para category_id
- confidence pode ser "high", "medium" ou "low"
- Mantenha o mesmo "index" de cada transação"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )

    response_text = message.content[0].text.strip()
    json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
    if json_match:
        try:
            categorizations = json.loads(json_match.group())
            cat_map = {c["index"]: c for c in categorizations}
            for i, t in enumerate(transactions):
                if i in cat_map:
                    t["category_id"] = cat_map[i].get("category_id")
                    cat_id = t.get("category_id")
                    if cat_id:
                        cat = next((c for c in categories if c["id"] == cat_id), None)
                        if cat:
                            t["category_name"] = cat["name"]
        except (json.JSONDecodeError, KeyError):
            pass

    return transactions


def generate_insights(financial_data: Dict[str, Any]) -> Dict[str, Any]:
    client = get_client()
    health_score = financial_data.get("health_score", 0)
    income = financial_data.get("income", 0)
    expenses = financial_data.get("expenses", 0)
    savings_rate = financial_data.get("savings_rate", 0)
    total_debt = financial_data.get("total_debt", 0)
    total_investments = financial_data.get("total_investments", 0)
    top_categories = financial_data.get("top_categories", [])

    top_cat_str = ""
    if top_categories:
        top_cat_str = "\n".join(
            f"- {c['name']}: R$ {c['amount']:.2f}" for c in top_categories[:5]
        )

    prompt = f"""Você é um consultor financeiro brasileiro especializado em finanças pessoais.
Analise os dados financeiros abaixo e forneça 5 sugestões práticas e específicas de melhoria em português brasileiro.

DADOS FINANCEIROS:
- Renda mensal: R$ {income:.2f}
- Despesas mensais: R$ {expenses:.2f}
- Taxa de poupança: {savings_rate:.1f}%
- Dívidas totais: R$ {total_debt:.2f}
- Total investido: R$ {total_investments:.2f}
- Score de saúde financeira: {health_score}/100

MAIORES CATEGORIAS DE GASTOS:
{top_cat_str if top_cat_str else "Nenhum dado disponível"}

Retorne APENAS um JSON válido (sem markdown, sem texto extra):
{{
  "suggestions": [
    {{
      "titulo": "Título curto e direto",
      "descricao": "Descrição detalhada e prática com valores em reais quando possível",
      "impacto_estimado": "Descrição do impacto esperado",
      "prioridade": "alta"
    }}
  ],
  "resumo": "Um parágrafo resumindo a situação financeira atual",
  "estatisticas": {{
    "meta_poupanca": "Sugestão de meta de poupança mensal em reais",
    "prazo_quitacao_dividas": "Estimativa em meses para quitar dívidas com pagamentos atuais",
    "projecao_patrimonio_5anos": "Estimativa do patrimônio líquido em 5 anos"
  }}
}}

Prioridade deve ser: "alta", "media" ou "baixa"
Seja específico com valores em R$ e porcentagens."""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )

    response_text = message.content[0].text.strip()
    json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group())
        except json.JSONDecodeError:
            pass

    return {
        "suggestions": [],
        "resumo": "Não foi possível gerar insights no momento.",
        "estatisticas": {},
    }
