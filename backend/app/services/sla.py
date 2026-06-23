from datetime import datetime, timedelta
from app.models.models import TicketCategory

def calculate_sla_due_time(created_at: datetime, category: TicketCategory, priority: str) -> datetime:
    # Default target hours from the ticket category
    base_hours = category.sla_target_hours if category else 24
    
    # Adjust target based on priority
    if priority == "P1 Critical":
        target_hours = min(2, base_hours)
    elif priority == "P2 High":
        target_hours = min(6, base_hours)
    elif priority == "P3 Medium":
        target_hours = min(12, base_hours)
    else:  # P4 Low
        target_hours = base_hours
        
    return created_at + timedelta(hours=target_hours)
