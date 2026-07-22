from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func
from typing import List

from app.api.deps import get_db, get_current_admin_user
from app.models.users import User, Role, Permission, ProProfile
from app.models.esports import Team, Contract, ContractState
from app.schemas.admin import UserAdminResponse, RoleResponse, PermissionResponse, RoleCreate, RoleUpdate, AdminReportResponse

router = APIRouter()


@router.get("/users", response_model=List[UserAdminResponse])
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    result = await db.execute(select(User).options(selectinload(User.role)))
    return result.scalars().all()

@router.put("/users/{user_id}/role", response_model=UserAdminResponse)
async def update_user_role(
    user_id: int,
    role_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    role_result = await db.execute(select(Role).where(Role.id == role_id))
    role = role_result.scalars().first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    user.role_id = role.id
    await db.commit()
    await db.refresh(user)
    
    final_result = await db.execute(select(User).where(User.id == user_id).options(selectinload(User.role)))
    return final_result.scalars().first()

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo")
        
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_deleted = True
    await db.commit()
    return None

@router.post("/users/{user_id}/recover", response_model=UserAdminResponse)
async def recover_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    user_result = await db.execute(select(User).where(User.id == user_id).options(selectinload(User.role)))
    user = user_result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_deleted = False
    await db.commit()
    await db.refresh(user)
    return user

@router.delete("/users/{user_id}/permanent", status_code=status.HTTP_204_NO_CONTENT)
async def permanent_delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo")
        
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    await db.delete(user)
    await db.commit()
    return None


@router.get("/roles", response_model=List[RoleResponse])
async def get_all_roles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    result = await db.execute(select(Role).options(selectinload(Role.permissions)))
    return result.scalars().all()

@router.post("/roles", response_model=RoleResponse)
async def create_role(
    role_in: RoleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    result = await db.execute(select(Role).where(Role.name == role_in.name))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="El rol ya existe")
        
    new_role = Role(name=role_in.name)
    
    if role_in.permission_ids:
        perms_result = await db.execute(select(Permission).where(Permission.id.in_(role_in.permission_ids)))
        new_role.permissions = list(perms_result.scalars().all())
        
    db.add(new_role)
    await db.commit()
    
    final_result = await db.execute(select(Role).where(Role.id == new_role.id).options(selectinload(Role.permissions)))
    return final_result.scalars().first()

@router.put("/roles/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: int,
    role_in: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    result = await db.execute(select(Role).where(Role.id == role_id).options(selectinload(Role.permissions)))
    role = result.scalars().first()
    
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    if role_in.name is not None:
        role.name = role_in.name
        
    if role_in.permission_ids is not None:
        perms_result = await db.execute(select(Permission).where(Permission.id.in_(role_in.permission_ids)))
        role.permissions = list(perms_result.scalars().all())
        
    await db.commit()
    
    final_result = await db.execute(select(Role).where(Role.id == role.id).options(selectinload(Role.permissions)))
    return final_result.scalars().first()

@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(
    role_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalars().first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    role.is_deleted = True
    await db.commit()
    return None

@router.post("/roles/{role_id}/recover", response_model=RoleResponse)
async def recover_role(
    role_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    result = await db.execute(select(Role).where(Role.id == role_id).options(selectinload(Role.permissions)))
    role = result.scalars().first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    role.is_deleted = False
    await db.commit()
    await db.refresh(role)
    return role

@router.delete("/roles/{role_id}/permanent", status_code=status.HTTP_204_NO_CONTENT)
async def permanent_delete_role(
    role_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalars().first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    await db.delete(role)
    await db.commit()
    return None


@router.get("/permissions", response_model=List[PermissionResponse])
async def get_all_permissions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    result = await db.execute(select(Permission))
    return result.scalars().all()


@router.get("/reports", response_model=AdminReportResponse)
async def get_admin_reports(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    total_players = (await db.execute(select(func.count(ProProfile.id)))).scalar() or 0
    total_teams = (await db.execute(select(func.count(Team.id)))).scalar() or 0
    active_contracts = (await db.execute(select(func.count(Contract.id)).where(Contract.status == ContractState.ACTIVE))).scalar() or 0
    
    profiles = (await db.execute(select(ProProfile.roles_in_game))).scalars().all()
    roles_count = {}
    for roles in profiles:
        for r in roles:
            roles_count[r] = roles_count.get(r, 0) + 1
    roles_distribution = [{"name": k, "value": v} for k, v in roles_count.items()]
    
    from datetime import date
    profiles_dates = (await db.execute(select(ProProfile.birth_date))).scalars().all()
    today = date.today()
    age_count = {}
    for bdate in profiles_dates:
        if bdate:
            age = today.year - bdate.year - ((today.month, today.day) < (bdate.month, bdate.day))
            age_count[age] = age_count.get(age, 0) + 1
            
    age_distribution = [{"age": k, "count": v} for k, v in age_count.items()]
    age_distribution.sort(key=lambda x: x["age"])
    
    team_query = (
        select(
            Team.name,
            func.avg(Contract.salary).label("avg_salary"),
            func.sum(Contract.buyout_clause).label("total_market_value")
        )
        .select_from(Team)
        .join(Contract, Contract.team_id == Team.id)
        .where(Contract.status == ContractState.ACTIVE)
        .group_by(Team.name)
    )
    team_finances_data = (await db.execute(team_query)).all()
    
    team_finances = [
        {
            "team_name": row.name,
            "avg_salary": float(row.avg_salary or 0),
            "total_market_value": float(row.total_market_value or 0)
        }
        for row in team_finances_data
    ]
    
    return {
        "overview": {
            "total_players": total_players,
            "total_teams": total_teams,
            "active_contracts": active_contracts
        },
        "roles_distribution": roles_distribution,
        "age_distribution": age_distribution,
        "team_finances": team_finances
    }
