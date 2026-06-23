import os
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import shutil

from app.core.database import get_db
from app.models.models import User, Ticket, TicketCategory, Asset, Comment, Attachment, Notification
from app.schemas.schemas import TicketOut, TicketCreate, TicketUpdate, CommentOut, CommentCreate, AttachmentOut
from app.routes.auth import get_current_user, check_role
from app.services.sla import calculate_sla_due_time
from app.services.notifications import create_user_notification

router = APIRouter(prefix="/tickets", tags=["Tickets"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("", response_model=List[TicketOut])
def list_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "Employee":
        return db.query(Ticket).filter(Ticket.created_by_id == current_user.id).order_by(Ticket.created_at.desc()).all()
    return db.query(Ticket).order_by(Ticket.created_at.desc()).all()

@router.post("", response_model=TicketOut, status_code=status.HTTP_201_CREATED)
def create_ticket(
    ticket_in: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    category = db.query(TicketCategory).filter(TicketCategory.id == ticket_in.category_id).first()
    if not category:
        raise HTTPException(status_code=400, detail="Ticket Category not found")

    if ticket_in.asset_id:
        asset = db.query(Asset).filter(Asset.id == ticket_in.asset_id).first()
        if not asset:
            raise HTTPException(status_code=400, detail="Associated Asset not found")

    now = datetime.utcnow()
    sla_due = calculate_sla_due_time(now, category, ticket_in.priority)

    db_ticket = Ticket(
        title=ticket_in.title,
        description=ticket_in.description,
        priority=ticket_in.priority,
        status="Open",
        created_by_id=current_user.id,
        category_id=ticket_in.category_id,
        asset_id=ticket_in.asset_id,
        created_at=now,
        sla_due_at=sla_due
    )
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)

    # Notify Admins and Engineers
    staff_members = db.query(User).filter(User.role.in_(["Support Engineer", "Administrator"])).all()
    for staff in staff_members:
        create_user_notification(db, staff.id, f"New ticket '{db_ticket.title}' raised by {current_user.full_name}")

    return db_ticket

@router.get("/{ticket_id}", response_model=TicketOut)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    if current_user.role == "Employee" and ticket.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this ticket")
        
    return ticket

@router.put("/{ticket_id}", response_model=TicketOut)
def update_ticket(
    ticket_id: int,
    ticket_in: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Access checks
    if current_user.role == "Employee":
        if ticket.created_by_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to edit this ticket")
        # Employees can only close/resolve or add information (no status reassign, no engineer assign)
        if ticket_in.status and ticket_in.status not in ["Resolved", "Closed"]:
            raise HTTPException(status_code=403, detail="Employees can only set status to Resolved or Closed")
        if ticket_in.assigned_to_id:
            raise HTTPException(status_code=403, detail="Employees cannot assign tickets")

    prev_status = ticket.status
    prev_assignee = ticket.assigned_to_id

    # Apply updates
    updates = ticket_in.model_dump(exclude_unset=True)
    for field, value in updates.items():
        if field == "status" and value == "Resolved":
            ticket.resolved_at = datetime.utcnow()
        setattr(ticket, field, value)

    db.commit()
    db.refresh(ticket)

    # Notifications on state changes
    if prev_status != ticket.status:
        create_user_notification(
            db, 
            ticket.created_by_id, 
            f"Your ticket '{ticket.title}' status updated to {ticket.status}"
        )
    if ticket_in.assigned_to_id and prev_assignee != ticket.assigned_to_id:
        create_user_notification(
            db, 
            ticket.assigned_to_id, 
            f"Ticket '{ticket.title}' has been assigned to you"
        )

    return ticket


# COMMENTS SUB-ROUTER
@router.post("/{ticket_id}/comments", response_model=CommentOut)
def add_comment(
    ticket_id: int,
    comment_in: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role == "Employee":
        if ticket.created_by_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to comment on this ticket")
        if comment_in.is_internal:
            raise HTTPException(status_code=403, detail="Employees cannot write internal comments")

    comment = Comment(
        ticket_id=ticket.id,
        author_id=current_user.id,
        content=comment_in.content,
        is_internal=comment_in.is_internal
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    # Notify users
    if current_user.id == ticket.created_by_id:
        # Notify support engineer if assigned
        if ticket.assigned_to_id:
            create_user_notification(
                db, 
                ticket.assigned_to_id, 
                f"New comment on assigned ticket '{ticket.title}' from reporter"
            )
    else:
        # Notify reporter
        create_user_notification(
            db, 
            ticket.created_by_id, 
            f"New comment on ticket '{ticket.title}' from support team"
        )

    return comment

@router.get("/{ticket_id}/comments", response_model=List[CommentOut])
def get_comments(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role == "Employee":
        if ticket.created_by_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view comments")
        # Employees cannot view internal comments
        return db.query(Comment).filter(Comment.ticket_id == ticket_id, Comment.is_internal == False).order_by(Comment.created_at.asc()).all()

    return db.query(Comment).filter(Comment.ticket_id == ticket_id).order_by(Comment.created_at.asc()).all()


# ATTACHMENTS SUB-ROUTER
@router.post("/{ticket_id}/attachments", response_model=AttachmentOut)
def upload_attachment(
    ticket_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role == "Employee" and ticket.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this ticket")

    # Save file physically
    file_uuid_name = f"{ticket_id}_{int(datetime.utcnow().timestamp())}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, file_uuid_name)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    attachment = Attachment(
        ticket_id=ticket.id,
        uploaded_by_id=current_user.id,
        file_name=file.filename,
        file_path=file_path
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    return attachment

@router.get("/{ticket_id}/attachments", response_model=List[AttachmentOut])
def get_attachments(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role == "Employee" and ticket.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return db.query(Attachment).filter(Attachment.ticket_id == ticket_id).all()


# Categories Endpoints (For select list/admin config)
from app.schemas.schemas import TicketCategoryOut, TicketCategoryCreate

@router.get("/categories/all", response_model=List[TicketCategoryOut])
def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(TicketCategory).all()

@router.post("/categories/all", response_model=TicketCategoryOut)
def create_category(
    category_in: TicketCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["Administrator"]))
):
    existing = db.query(TicketCategory).filter(TicketCategory.name == category_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    
    db_cat = TicketCategory(name=category_in.name, sla_target_hours=category_in.sla_target_hours)
    db.add(db_cat)
    db.commit()
    db.refresh(db_cat)
    return db_cat
