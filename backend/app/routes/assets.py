from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import Asset, User
from app.schemas.schemas import AssetOut, AssetCreate, AssetUpdate
from app.routes.auth import get_current_user, check_role

router = APIRouter(prefix="/assets", tags=["Assets"])

@router.get("", response_model=List[AssetOut])
def get_assets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "Employee":
        return db.query(Asset).filter(Asset.employee_id == current_user.id).all()
    return db.query(Asset).all()

@router.post("", response_model=AssetOut, status_code=status.HTTP_201_CREATED)
def create_asset(
    asset_in: AssetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["Administrator"]))
):
    existing = db.query(Asset).filter(Asset.asset_tag == asset_in.asset_tag).first()
    if existing:
        raise HTTPException(status_code=400, detail="Asset tag already exists")

    if asset_in.employee_id:
        emp = db.query(User).filter(User.id == asset_in.employee_id).first()
        if not emp:
            raise HTTPException(status_code=400, detail="Employee user not found")

    db_asset = Asset(**asset_in.model_dump())
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return db_asset

@router.get("/{asset_id}", response_model=AssetOut)
def get_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    if current_user.role == "Employee" and asset.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied to this asset details")
        
    return asset

@router.put("/{asset_id}", response_model=AssetOut)
def update_asset(
    asset_id: int,
    asset_in: AssetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["Administrator", "Support Engineer"]))
):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    updates = asset_in.model_dump(exclude_unset=True)
    if "employee_id" in updates and updates["employee_id"]:
        emp = db.query(User).filter(User.id == updates["employee_id"]).first()
        if not emp:
            raise HTTPException(status_code=400, detail="Employee user not found")

    for field, value in updates.items():
        setattr(asset, field, value)

    db.commit()
    db.refresh(asset)
    return asset

@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["Administrator"]))
):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    db.delete(asset)
    db.commit()
    return None
