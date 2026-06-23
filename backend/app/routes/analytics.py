from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
from typing import List

from app.core.database import get_db
from app.models.models import Ticket, TicketCategory, User
from app.schemas.schemas import AnalyticsSummary, TopCategory, TicketTrendPoint, EngineerPerf
from app.routes.auth import check_role

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/summary", response_model=AnalyticsSummary)
def get_analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["Administrator", "Support Engineer"]))
):
    now = datetime.utcnow()
    
    # 1. Ticket Counts
    open_tickets = db.query(Ticket).filter(Ticket.status.notin_(["Resolved", "Closed"])).count()
    closed_tickets = db.query(Ticket).filter(Ticket.status.in_(["Resolved", "Closed"])).count()

    # 2. Average Resolution Time
    resolved_tickets = db.query(Ticket).filter(Ticket.resolved_at.isnot(None)).all()
    avg_resolution_time = 0.0
    if resolved_tickets:
        total_time_hours = sum((t.resolved_at - t.created_at).total_seconds() / 3600.0 for t in resolved_tickets)
        avg_resolution_time = round(total_time_hours / len(resolved_tickets), 2)

    # 3. SLA Violations
    sla_violations = db.query(Ticket).filter(
        ((Ticket.resolved_at.isnot(None)) & (Ticket.resolved_at > Ticket.sla_due_at)) |
        ((Ticket.resolved_at.is_(None)) & (Ticket.sla_due_at < now))
    ).count()

    # 4. Top Categories
    category_counts = db.query(
        TicketCategory.name, 
        func.count(Ticket.id)
    ).join(Ticket, Ticket.category_id == TicketCategory.id, isouter=True)\
     .group_by(TicketCategory.name)\
     .order_by(func.count(Ticket.id).desc())\
     .all()
    
    top_categories = [TopCategory(category=cat[0], count=cat[1]) for cat in category_counts]

    # 5. Ticket Trends (Last 7 Days)
    ticket_trends = []
    for i in range(6, -1, -1):
        target_date = (now - timedelta(days=i)).date()
        date_str = target_date.strftime("%Y-%m-%d")
        
        # Count tickets created on target date
        day_open = db.query(Ticket).filter(
            func.date(Ticket.created_at) == target_date
        ).count()
        
        # Count tickets resolved/closed on target date
        day_closed = db.query(Ticket).filter(
            func.date(Ticket.resolved_at) == target_date
        ).count()
        
        ticket_trends.append(TicketTrendPoint(date=date_str, open_count=day_open, closed_count=day_closed))

    # 6. Engineer Performance
    engineers = db.query(User).filter(User.role == "Support Engineer").all()
    engineer_perf = []
    for eng in engineers:
        resolved_eng_tickets = db.query(Ticket).filter(
            Ticket.assigned_to_id == eng.id,
            Ticket.resolved_at.isnot(None)
        ).all()
        
        eng_resolved_count = len(resolved_eng_tickets)
        eng_avg_time = 0.0
        if eng_resolved_count:
            eng_total_time = sum((t.resolved_at - t.created_at).total_seconds() / 3600.0 for t in resolved_eng_tickets)
            eng_avg_time = round(eng_total_time / eng_resolved_count, 2)
            
        engineer_perf.append(EngineerPerf(
            name=eng.full_name,
            resolved_count=eng_resolved_count,
            avg_resolution_time_hrs=eng_avg_time
        ))

    return AnalyticsSummary(
        open_tickets=open_tickets,
        closed_tickets=closed_tickets,
        avg_resolution_time_hrs=avg_resolution_time,
        sla_violations=sla_violations,
        top_categories=top_categories,
        ticket_trends=ticket_trends,
        engineer_performance=engineer_perf
    )
