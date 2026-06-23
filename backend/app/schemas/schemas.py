from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None


# Department Schemas
class DepartmentBase(BaseModel):
    name: str

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentOut(DepartmentBase):
    id: int
    class Config:
        from_attributes = True


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str  # Employee, Support Engineer, Administrator
    department_id: Optional[int] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    department_id: Optional[int] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

class UserOut(UserBase):
    id: int
    department: Optional[DepartmentOut] = None

    class Config:
        from_attributes = True


# Asset Schemas
class AssetBase(BaseModel):
    asset_tag: str
    hostname: str
    operating_system: str
    ip_address: str
    ram: str
    storage: str
    cpu: str
    warranty_expiry: datetime
    status: str  # Active, In Repair, Decommissioned
    employee_id: Optional[int] = None

class AssetCreate(AssetBase):
    pass

class AssetUpdate(BaseModel):
    asset_tag: Optional[str] = None
    hostname: Optional[str] = None
    operating_system: Optional[str] = None
    ip_address: Optional[str] = None
    ram: Optional[str] = None
    storage: Optional[str] = None
    cpu: Optional[str] = None
    warranty_expiry: Optional[datetime] = None
    status: Optional[str] = None
    employee_id: Optional[int] = None

class AssetOut(AssetBase):
    id: int
    employee: Optional[UserOut] = None

    class Config:
        from_attributes = True


# Ticket Category Schemas
class TicketCategoryBase(BaseModel):
    name: str
    sla_target_hours: int

class TicketCategoryCreate(TicketCategoryBase):
    pass

class TicketCategoryOut(TicketCategoryBase):
    id: int
    class Config:
        from_attributes = True


# Comment Schemas
class CommentBase(BaseModel):
    content: str
    is_internal: bool = False

class CommentCreate(CommentBase):
    pass

class CommentOut(CommentBase):
    id: int
    ticket_id: int
    author_id: int
    created_at: datetime
    author: UserOut

    class Config:
        from_attributes = True


# Attachment Schemas
class AttachmentOut(BaseModel):
    id: int
    ticket_id: int
    uploaded_by_id: int
    file_name: str
    file_path: str
    created_at: datetime

    class Config:
        from_attributes = True


# Ticket Schemas
class TicketBase(BaseModel):
    title: str
    description: str
    priority: str  # P1 Critical, P2 High, P3 Medium, P4 Low
    category_id: int
    asset_id: Optional[int] = None

class TicketCreate(TicketBase):
    pass

class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None  # Open, Assigned, In Progress, Resolved, Closed
    assigned_to_id: Optional[int] = None
    category_id: Optional[int] = None
    asset_id: Optional[int] = None

class TicketOut(TicketBase):
    id: int
    status: str
    created_by_id: int
    assigned_to_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    sla_due_at: datetime
    resolved_at: Optional[datetime] = None
    
    created_by: UserOut
    assigned_to: Optional[UserOut] = None
    category: TicketCategoryOut
    asset: Optional[AssetOut] = None

    class Config:
        from_attributes = True


# Knowledge Base Schemas
class KBArticleBase(BaseModel):
    title: str
    content: str
    category_id: int

class KBArticleCreate(KBArticleBase):
    pass

class KBArticleOut(KBArticleBase):
    id: int
    created_by_id: int
    created_at: datetime
    updated_at: datetime
    category: TicketCategoryOut
    created_by: UserOut

    class Config:
        from_attributes = True


# Notification Schemas
class NotificationOut(BaseModel):
    id: int
    user_id: int
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Analytics Dashboard Schemas
class SLAStatusCount(BaseModel):
    met: int
    breached: int

class TopCategory(BaseModel):
    category: str
    count: int

class EngineerPerf(BaseModel):
    name: str
    resolved_count: int
    avg_resolution_time_hrs: float

class TicketTrendPoint(BaseModel):
    date: str
    open_count: int
    closed_count: int

class AnalyticsSummary(BaseModel):
    open_tickets: int
    closed_tickets: int
    avg_resolution_time_hrs: float
    sla_violations: int
    top_categories: List[TopCategory]
    ticket_trends: List[TicketTrendPoint]
    engineer_performance: List[EngineerPerf]
