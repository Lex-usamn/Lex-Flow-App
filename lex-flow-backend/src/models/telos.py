# /src/models/telos.py

from datetime import datetime, date # IMPORTANTE: Adicionado 'date' para o tipo de coluna correto
from sqlalchemy.types import JSON
from sqlalchemy import UniqueConstraint, Date # IMPORTANTE: Adicionado 'Date' do SQLAlchemy

# Importa a instância 'db' centralizada do seu __init__.py
from src import db  

# -------------------------------------------------
# Modelo para o Framework TELOS (A Constituição Pessoal)
# -------------------------------------------------
class TelosFramework(db.Model):
    """
    Armazena a 'constituição pessoal' de cada usuário, que serve como base
    para as revisões e análises de IA. Cada usuário tem apenas um framework.
    """
    __tablename__ = 'telos_frameworks'
    
    id = db.Column(db.Integer, primary_key=True)
    # Garante que cada usuário tenha apenas um framework (unique=True)
    # e que, se o usuário for deletado, seu framework também seja (ondelete='CASCADE')
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True)
    content = db.Column(JSON, nullable=False) # Armazena as respostas em formato JSON (ex: {'problemas': '...', 'missoes': '...'})
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamento com o usuário. Permite acessar o usuário a partir do framework (framework.user)
    user = db.relationship('User', back_populates='telos_framework')
    __table_args__ = {'extend_existing': True}

    def __init__(self, user_id, content):
        """Construtor da classe."""
        self.user_id = user_id
        self.content = content

    def to_dict(self):
        """
        Converte o objeto do modelo em um dicionário, que pode ser
        facilmente convertido para JSON para ser enviado pela API.
        """
        return {
            'id': self.id,
            'user_id': self.user_id,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


# -------------------------------------------------
# Modelo para as Revisões TELOS (O Journaling Diário)
# -------------------------------------------------
class TelosReview(db.Model):
    """
    Armazena as revisões diárias de um usuário, baseadas nas perguntas do TELOS.
    Um usuário pode ter várias revisões, uma para cada dia.
    """
    __tablename__ = 'telos_reviews'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    # === MELHORIA APLICADA ===
    # Usar o tipo `Date` em vez de `String` é mais robusto e eficiente.
    # - Garante que o banco de dados armazene a data em um formato otimizado.
    # - Evita erros de ordenação (ex: "10-01-2024" vindo antes de "2-01-2024").
    # - Simplifica queries de data no banco de dados.
    review_date = db.Column(Date, nullable=False) 
    
    content = db.Column(JSON, nullable=False) # Armazena as respostas do dia (ex: {'vision': '...', 'purpose': '...'})
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Adiciona uma restrição única para garantir que um usuário só possa ter uma revisão por data.
    # Isso evita entradas duplicadas para o mesmo dia e mantém a integridade dos dados.
    __table_args__ = (UniqueConstraint('user_id', 'review_date', name='_user_review_date_uc'), {'extend_existing': True})
    
    # Relacionamento com o usuário. Se o usuário for deletado, suas revisões também serão.
    user = db.relationship('User', back_populates='telos_reviews')

    def __init__(self, user_id, review_date, content):
        """
        Construtor da classe.
        
        === MELHORIA APLICADA ===
        Adiciona lógica para converter a string de data (enviada pelo frontend, ex: '2024-05-21')
        em um objeto `date` do Python antes de salvar no banco.
        """
        self.user_id = user_id
        if isinstance(review_date, str):
            self.review_date = date.fromisoformat(review_date)
        else:
            self.review_date = review_date
        self.content = content

    def to_dict(self):
        """
        Converte o objeto do modelo em um dicionário para ser usado na API.
        
        === MELHORIA APLICADA ===
        Converte o objeto `date` de volta para uma string no formato ISO ('YYYY-MM-DD'),
        que é o formato padrão e mais fácil de ser consumido pelo JavaScript no frontend.
        """
        return {
            'id': self.id,
            'user_id': self.user_id,
            'review_date': self.review_date.isoformat() if self.review_date else None,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }