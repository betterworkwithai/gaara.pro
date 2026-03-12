from sqlalchemy.orm import Session
from app.models.category import Category, CategoryKeyword


DEFAULT_CATEGORIES = [
    # Despesas
    {"name": "Moradia", "type": "expense", "color": "#F97316", "icon": "🏠", "keywords": ["aluguel", "condominio", "iptu", "agua", "luz", "energia", "gas", "internet", "telefone"]},
    {"name": "Alimentação", "type": "expense", "color": "#EF4444", "icon": "🍽️", "keywords": ["supermercado", "mercado", "restaurante", "ifood", "rappi", "uber eats", "padaria", "acougue", "hortifruti", "lanchonete"]},
    {"name": "Transporte", "type": "expense", "color": "#F59E0B", "icon": "🚗", "keywords": ["uber", "99", "gasolina", "combustivel", "posto", "estacionamento", "onibus", "metro", "passagem", "pedagio", "ipva", "seguro auto"]},
    {"name": "Saúde", "type": "expense", "color": "#10B981", "icon": "❤️", "keywords": ["farmacia", "drogaria", "medico", "consulta", "exame", "hospital", "clinica", "plano de saude", "dentista", "laboratorio"]},
    {"name": "Educação", "type": "expense", "color": "#3B82F6", "icon": "📚", "keywords": ["faculdade", "escola", "curso", "mensalidade", "livro", "material escolar", "udemy", "alura", "coursera"]},
    {"name": "Lazer", "type": "expense", "color": "#8B5CF6", "icon": "🎉", "keywords": ["cinema", "teatro", "show", "netflix", "spotify", "amazon prime", "disney", "viagem", "hotel", "passagem aerea", "jogo", "academia"]},
    {"name": "Vestuário", "type": "expense", "color": "#EC4899", "icon": "👗", "keywords": ["roupa", "calçado", "sapato", "tenis", "zara", "renner", "c&a", "americanas", "shopee", "amazon moda"]},
    {"name": "Assinaturas", "type": "expense", "color": "#6366F1", "icon": "📱", "keywords": ["netflix", "spotify", "amazon", "disney", "globoplay", "youtube premium", "apple", "microsoft", "adobe", "assinatura"]},
    {"name": "Utilidades", "type": "expense", "color": "#64748B", "icon": "🔧", "keywords": ["agua", "luz", "gas", "internet", "telefone", "celular", "tim", "vivo", "claro", "oi"]},
    {"name": "Cartão de Crédito", "type": "expense", "color": "#DC2626", "icon": "💳", "keywords": ["fatura", "cartao", "nubank", "itau", "bradesco", "santander", "bb", "caixa", "inter"]},
    {"name": "Outros Gastos", "type": "expense", "color": "#6B7280", "icon": "💸", "keywords": []},
    # Receitas
    {"name": "Salário", "type": "income", "color": "#22C55E", "icon": "💼", "keywords": ["salario", "pagamento", "remuneracao", "vencimento", "folha"]},
    {"name": "Freelance", "type": "income", "color": "#16A34A", "icon": "💻", "keywords": ["freelance", "consultoria", "projeto", "servico prestado", "honorarios"]},
    {"name": "Dividendos", "type": "income", "color": "#15803D", "icon": "📈", "keywords": ["dividendo", "jcp", "rendimento", "lucro distribuido"]},
    {"name": "Aluguel Recebido", "type": "income", "color": "#166534", "icon": "🏘️", "keywords": ["aluguel recebido", "locacao", "renda imovel"]},
    {"name": "Outros Rendimentos", "type": "income", "color": "#14532D", "icon": "💰", "keywords": ["transferencia recebida", "pix recebido", "deposito", "credito"]},
    # Investimentos
    {"name": "Renda Variável", "type": "investment", "color": "#0EA5E9", "icon": "📊", "keywords": ["acao", "etf", "bdr", "bovespa", "b3"]},
    {"name": "Renda Fixa", "type": "investment", "color": "#0284C7", "icon": "🏦", "keywords": ["cdb", "lci", "lca", "tesouro", "debenture", "poupanca"]},
    {"name": "FIIs", "type": "investment", "color": "#0369A1", "icon": "🏢", "keywords": ["fii", "fundo imobiliario", "ifix"]},
    {"name": "Criptomoedas", "type": "investment", "color": "#7C3AED", "icon": "₿", "keywords": ["bitcoin", "ethereum", "crypto", "binance", "cripto"]},
]


def seed_user_categories(db: Session, user_id: int):
    existing = db.query(Category).filter(Category.user_id == user_id).count()
    if existing > 0:
        return

    for cat_data in DEFAULT_CATEGORIES:
        keywords = cat_data.pop("keywords", [])
        cat = Category(
            user_id=user_id,
            is_default=True,
            **cat_data,
        )
        db.add(cat)
        db.flush()

        for kw in keywords:
            db.add(CategoryKeyword(category_id=cat.id, keyword=kw.lower()))

    db.commit()


if __name__ == "__main__":
    import sys
    sys.path.insert(0, ".")
    from app.database import SessionLocal, create_tables
    create_tables()
    db = SessionLocal()
    print("Categorias padrão disponíveis para seeding ao registrar usuários.")
    db.close()
