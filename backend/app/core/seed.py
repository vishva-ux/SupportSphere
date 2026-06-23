from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models.models import Department, User, TicketCategory, Asset, KnowledgeBaseArticle
from app.core.security import get_password_hash

def seed_database(db: Session):
    # 1. Departments
    if db.query(Department).count() == 0:
        it_dept = Department(name="Information Technology")
        hr_dept = Department(name="Human Resources")
        fn_dept = Department(name="Finance")
        db.add_all([it_dept, hr_dept, fn_dept])
        db.commit()

    # Get departments
    it_dept = db.query(Department).filter(Department.name == "Information Technology").first()
    hr_dept = db.query(Department).filter(Department.name == "Human Resources").first()
    
    # 2. Users (Admin, Engineer, Employee)
    if db.query(User).count() == 0:
        admin = User(
            email="admin@supportsphere.com",
            password_hash=get_password_hash("AdminSphere2026!"),
            full_name="Administrator User",
            role="Administrator",
            department_id=it_dept.id if it_dept else None,
            is_active=True
        )
        engineer = User(
            email="engineer@supportsphere.com",
            password_hash=get_password_hash("EngineerSphere2026!"),
            full_name="Support Engineer Alice",
            role="Support Engineer",
            department_id=it_dept.id if it_dept else None,
            is_active=True
        )
        employee = User(
            email="employee@supportsphere.com",
            password_hash=get_password_hash("EmployeeSphere2026!"),
            full_name="John Doe",
            role="Employee",
            department_id=hr_dept.id if hr_dept else None,
            is_active=True
        )
        db.add_all([admin, engineer, employee])
        db.commit()

    # Get users for relationships
    admin_user = db.query(User).filter(User.role == "Administrator").first()
    employee_user = db.query(User).filter(User.role == "Employee").first()

    # 3. Ticket Categories & SLA limits
    if db.query(TicketCategory).count() == 0:
        categories = [
            TicketCategory(name="VPN Issue", sla_target_hours=4),
            TicketCategory(name="DNS Issue", sla_target_hours=8),
            TicketCategory(name="Wi-Fi Issue", sla_target_hours=4),
            TicketCategory(name="Blue Screen", sla_target_hours=2),
            TicketCategory(name="Outlook Error", sla_target_hours=12),
            TicketCategory(name="Microsoft Teams Login", sla_target_hours=6),
            TicketCategory(name="Windows Update Failure", sla_target_hours=24),
            TicketCategory(name="Printer Offline", sla_target_hours=12)
        ]
        db.add_all(categories)
        db.commit()

    # 4. Assets
    if db.query(Asset).count() == 0:
        assets = [
            Asset(
                asset_tag="AST-00001",
                employee_id=employee_user.id if employee_user else None,
                hostname="JDOE-LAPTOP",
                operating_system="Windows 11 Enterprise",
                ip_address="192.168.10.45",
                ram="16 GB",
                storage="512 GB NVMe SSD",
                cpu="Intel Core i7-12700H",
                warranty_expiry=datetime.utcnow() + timedelta(days=365 * 2),
                status="Active"
            ),
            Asset(
                asset_tag="AST-00002",
                employee_id=None,
                hostname="IT-STANDBY-01",
                operating_system="macOS Sonoma",
                ip_address="192.168.10.99",
                ram="32 GB",
                storage="1 TB NVMe SSD",
                cpu="Apple M3 Pro",
                warranty_expiry=datetime.utcnow() + timedelta(days=365 * 3),
                status="Active"
            )
        ]
        db.add_all(assets)
        db.commit()

    # 5. Knowledge Base Articles
    if db.query(KnowledgeBaseArticle).count() == 0:
        vpn_cat = db.query(TicketCategory).filter(TicketCategory.name == "VPN Issue").first()
        wifi_cat = db.query(TicketCategory).filter(TicketCategory.name == "Wi-Fi Issue").first()
        teams_cat = db.query(TicketCategory).filter(TicketCategory.name == "Microsoft Teams Login").first()

        kb_articles = []
        if vpn_cat and admin_user:
            kb_articles.append(KnowledgeBaseArticle(
                title="How to Connect to Enterprise VPN",
                content="""### Troubleshooting Enterprise VPN
1. Open the Cisco Secure Client application on your machine.
2. Ensure you are typing the correct portal URL: **vpn.supportsphere.com**.
3. Enter your SupportSphere corporate email and password.
4. Approve the Push authentication notification sent to your MFA device.
5. If the connection fails, verify you have a stable local internet connection or restart the VPN agent service.
""",
                category_id=vpn_cat.id,
                created_by_id=admin_user.id
            ))
        if wifi_cat and admin_user:
            kb_articles.append(KnowledgeBaseArticle(
                title="Connecting to Corporate Wi-Fi Network",
                content="""### Wi-Fi Connectivity Guide
- **SSID**: SupportSphere-Secure
- **Authentication**: WPA3 Enterprise (802.1X)
- **Username**: Your full corporate email address
- **Password**: Your active directory password
- If your device is prompted with a certificate verification warning, check that the certificate is issued by **SupportSphere Enterprise CA** and click "Trust".
""",
                category_id=wifi_cat.id,
                created_by_id=admin_user.id
            ))
        if teams_cat and admin_user:
            kb_articles.append(KnowledgeBaseArticle(
                title="Fixing Microsoft Teams Login Failures",
                content="""### Resolving Teams MFA Loops
1. Log out completely from all Microsoft apps (Outlook, Word, Teams).
2. Clean your MS Teams cache:
   - On Windows: Delete `%appdata%\\Microsoft\\Teams` folder.
   - On Mac: Remove `~/Library/Application Support/Microsoft/Teams`.
3. Restart Microsoft Teams.
4. Try logging in again. When prompted, complete your MFA verification.
""",
                category_id=teams_cat.id,
                created_by_id=admin_user.id
            ))
        
        if kb_articles:
            db.add_all(kb_articles)
            db.commit()
