# lex-flow-backend/src/models/tenant.py

from src import db  
import datetime

class Tenant(db.Model):
    __tablename__ = 'tenants'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Relacionamentos
    users = db.relationship('User', back_populates='tenant')
    projects = db.relationship('Project', backref='tenant', lazy='dynamic')
    subscription = db.relationship('Subscription', back_populates='tenant', uselist=False, cascade="all, delete-orphan")

class Plan(db.Model):
    __tablename__ = 'plans'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    price = db.Column(db.Float, nullable=False)
    project_limit = db.Column(db.Integer, nullable=False)
    user_limit = db.Column(db.Integer, nullable=False)

class Subscription(db.Model):
    __tablename__ = 'subscriptions'
    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenants.id'), nullable=False, unique=True)
    plan_id = db.Column(db.Integer, db.ForeignKey('plans.id'), nullable=False)
    stripe_subscription_id = db.Column(db.String(100), unique=True, nullable=True)
    status = db.Column(db.String(50), nullable=False, default='active')
    current_period_end = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    tenant = db.relationship('Tenant', back_populates='subscription')
    plan = db.relationship('Plan')