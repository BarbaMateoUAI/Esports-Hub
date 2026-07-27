from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func
from typing import List

from app.api.deps import get_db, get_current_admin_user
from app.models.users import User, Role, Permission, ProProfile, OwnerProfile
from app.models.esports import Team, Contract, ContractState
from app.schemas.admin import (
    UserAdminResponse, RoleResponse, PermissionResponse, RoleCreate, RoleUpdate, 
    AdminReportResponse, AdminFullUserResponse, AdminFullUserUpdate
)
from app.core.security import get_password_hash

router = APIRouter()

@router.get("/users", response_model=List[UserAdminResponse])
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    result = await db.execute(select(User).options(selectinload(User.role)))
    return result.scalars().all()

@router.get("/users/{user_id}/full", response_model=AdminFullUserResponse)
async def get_full_user_admin(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    user_result = await db.execute(select(User).options(selectinload(User.role)).where(User.id == user_id))
    user = user_result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    pro_result = await db.execute(select(ProProfile).where(ProProfile.user_id == user.id))
    pro = pro_result.scalars().first()
    
    contract_dict = None
    if pro:
        contract_result = await db.execute(
            select(Contract)
            .options(selectinload(Contract.team))
            .where((Contract.pro_id == pro.id) & (Contract.status == ContractState.ACTIVE))
        )
        contract = contract_result.scalars().first()
        if contract:
            contract_dict = {
                "id": contract.id,
                "salary": contract.salary,
                "duration_months": contract.duration_months,
                "buyout_clause": contract.buyout_clause,
                "start_date": contract.start_date,
                "end_date": contract.end_date,
                "team": {"name": contract.team.name} if contract.team else None
            }
            
    profile_dict = None
    if pro:
        profile_dict = {
            "id": pro.id,
            "full_name": pro.full_name,
            "nickname": pro.nickname,
            "country": pro.country,
            "birth_date": pro.birth_date,
            "bio": getattr(pro, 'bio', ''),
            "roles_in_game": pro.roles_in_game
        }
    
    return {
        "user": user,
        "profile": profile_dict,
        "contract": contract_dict
    }

@router.put("/users/{user_id}/full", response_model=AdminFullUserResponse)
async def update_full_user_admin(
    user_id: int,
    update_data: AdminFullUserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    user_result = await db.execute(select(User).options(selectinload(User.role)).where(User.id == user_id))
    user = user_result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if update_data.email:
        user.email = update_data.email
    if update_data.password:
        user.hashed_password = get_password_hash(update_data.password)
        
    if update_data.profile:
        pro_result = await db.execute(select(ProProfile).where(ProProfile.user_id == user.id))
        pro = pro_result.scalars().first()
        if pro:
            p_data = update_data.profile
            if p_data.full_name is not None: pro.full_name = p_data.full_name
            if p_data.nickname is not None: pro.nickname = p_data.nickname
            if p_data.country is not None: pro.country = p_data.country
            if p_data.birth_date is not None: pro.birth_date = p_data.birth_date
            if p_data.roles_in_game is not None: pro.roles_in_game = p_data.roles_in_game

    if update_data.contract:
        pro_result = await db.execute(select(ProProfile).where(ProProfile.user_id == user.id))
        pro = pro_result.scalars().first()
        if pro:
            contract_result = await db.execute(
                select(Contract)
                .where((Contract.pro_id == pro.id) & (Contract.status == ContractState.ACTIVE))
            )
            contract = contract_result.scalars().first()
            if contract:
                c_data = update_data.contract
                if c_data.salary is not None: contract.salary = c_data.salary
                if c_data.duration_months is not None: contract.duration_months = c_data.duration_months
                if c_data.buyout_clause is not None: contract.buyout_clause = c_data.buyout_clause
                if c_data.start_date is not None: contract.start_date = c_data.start_date
                if c_data.end_date is not None: contract.end_date = c_data.end_date

    await db.commit()
    
    return await get_full_user_admin(user_id=user_id, db=db, current_user=current_user)

@router.put("/users/{user_id}/role", response_model=UserAdminResponse)
async def update_user_role(
    user_id: int,
    role_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    user_result = await db.execute(select(User).options(selectinload(User.role)).where(User.id == user_id))
    user = user_result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role and user.role.name == "Admin":
        raise HTTPException(status_code=403, detail="No se puede modificar el rol del Administrador principal")

    role_result = await db.execute(select(Role).where(Role.id == role_id))
    role = role_result.scalars().first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    if role.name == "Admin":
        raise HTTPException(status_code=403, detail="No se puede asignar el rol de Admin a otros usuarios")

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

    user_result = await db.execute(select(User).options(selectinload(User.role)).where(User.id == user_id))
    user = user_result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role and user.role.name == "Admin":
        raise HTTPException(status_code=403, detail="No se puede dar de baja al Administrador principal")

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

    if user.role and user.role.name == "Admin":
        raise HTTPException(status_code=403, detail="El Administrador principal no puede ser modificado")

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

    user_result = await db.execute(select(User).options(selectinload(User.role)).where(User.id == user_id))
    user = user_result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role and user.role.name == "Admin":
        raise HTTPException(status_code=403, detail="No se puede eliminar permanentemente al Administrador principal")

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
