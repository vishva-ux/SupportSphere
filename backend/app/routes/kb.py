from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.models import KnowledgeBaseArticle, User, TicketCategory
from app.schemas.schemas import KBArticleOut, KBArticleCreate
from app.routes.auth import get_current_user, check_role

router = APIRouter(prefix="/kb", tags=["Knowledge Base"])

@router.get("/articles", response_model=List[KBArticleOut])
def list_articles(
    q: Optional[str] = Query(None, description="Search query in titles/content"),
    category_id: Optional[int] = Query(None, description="Filter articles by category"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(KnowledgeBaseArticle)
    
    if category_id:
        query = query.filter(KnowledgeBaseArticle.category_id == category_id)
        
    if q:
        search = f"%{q}%"
        query = query.filter(
            (KnowledgeBaseArticle.title.ilike(search)) | 
            (KnowledgeBaseArticle.content.ilike(search))
        )
        
    return query.order_by(KnowledgeBaseArticle.updated_at.desc()).all()

@router.post("/articles", response_model=KBArticleOut, status_code=status.HTTP_201_CREATED)
def create_article(
    article_in: KBArticleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["Administrator", "Support Engineer"]))
):
    category = db.query(TicketCategory).filter(TicketCategory.id == article_in.category_id).first()
    if not category:
        raise HTTPException(status_code=400, detail="Ticket Category not found")

    article = KnowledgeBaseArticle(
        title=article_in.title,
        content=article_in.content,
        category_id=article_in.category_id,
        created_by_id=current_user.id
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    return article

@router.get("/articles/{article_id}", response_model=KBArticleOut)
def get_article(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    article = db.query(KnowledgeBaseArticle).filter(KnowledgeBaseArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article

@router.put("/articles/{article_id}", response_model=KBArticleOut)
def update_article(
    article_id: int,
    article_in: KBArticleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["Administrator", "Support Engineer"]))
):
    article = db.query(KnowledgeBaseArticle).filter(KnowledgeBaseArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    category = db.query(TicketCategory).filter(TicketCategory.id == article_in.category_id).first()
    if not category:
        raise HTTPException(status_code=400, detail="Category not found")

    article.title = article_in.title
    article.content = article_in.content
    article.category_id = article_in.category_id

    db.commit()
    db.refresh(article)
    return article

@router.delete("/articles/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_article(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["Administrator", "Support Engineer"]))
):
    article = db.query(KnowledgeBaseArticle).filter(KnowledgeBaseArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    db.delete(article)
    db.commit()
    return None
