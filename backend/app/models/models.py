from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.core.database import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    
    users = relationship("User", back_populates="department")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # Employee, Support Engineer, Administrator
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    is_active = Column(Boolean, default=True)

    department = relationship("Department", back_populates="users")
    created_tickets = relationship("Ticket", back_populates="created_by", foreign_keys="[Ticket.created_by_id]")
    assigned_tickets = relationship("Ticket", back_populates="assigned_to", foreign_keys="[Ticket.assigned_to_id]")
    comments = relationship("Comment", back_populates="author")
    attachments = relationship("Attachment", back_populates="uploaded_by")
    assets = relationship("Asset", back_populates="employee")
    notifications = relationship("Notification", back_populates="user")


class TicketCategory(Base):
    __tablename__ = "ticket_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    sla_target_hours = Column(Integer, nullable=False)  # SLA limit in hours

    tickets = relationship("Ticket", back_populates="category")
    kb_articles = relationship("KnowledgeBaseArticle", back_populates="category")


class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    asset_tag = Column(String, unique=True, index=True, nullable=False)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    hostname = Column(String, nullable=False)
    operating_system = Column(String, nullable=False)
    ip_address = Column(String, nullable=False)
    ram = Column(String, nullable=False)
    storage = Column(String, nullable=False)
    cpu = Column(String, nullable=False)
    warranty_expiry = Column(DateTime, nullable=False)
    status = Column(String, nullable=False)  # Active, In Repair, Decommissioned

    employee = relationship("User", back_populates="assets")
    tickets = relationship("Ticket", back_populates="asset")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    priority = Column(String, nullable=False)  # P1 Critical, P2 High, P3 Medium, P4 Low
    status = Column(String, nullable=False, default="Open")  # Open, Assigned, In Progress, Resolved, Closed
    
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    category_id = Column(Integer, ForeignKey("ticket_categories.id"), nullable=False)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    sla_due_at = Column(DateTime, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    created_by = relationship("User", back_populates="created_tickets", foreign_keys=[created_by_id])
    assigned_to = relationship("User", back_populates="assigned_tickets", foreign_keys=[assigned_to_id])
    category = relationship("TicketCategory", back_populates="tickets")
    asset = relationship("Asset", back_populates="tickets")
    comments = relationship("Comment", back_populates="ticket", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="ticket", cascade="all, delete-orphan")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(String, nullable=False)
    is_internal = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("Ticket", back_populates="comments")
    author = relationship("User", back_populates="comments")


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("Ticket", back_populates="attachments")
    uploaded_by = relationship("User", back_populates="attachments")


class KnowledgeBaseArticle(Base):
    __tablename__ = "kb_articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    category_id = Column(Integer, ForeignKey("ticket_categories.id"), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("TicketCategory", back_populates="kb_articles")
    created_by = relationship("User")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
