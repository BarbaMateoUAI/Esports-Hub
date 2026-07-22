from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.api.deps import get_db, get_current_user
from app.models.users import User
from app.models.esports import Team, Contract, ContractState
from app.schemas.esports import TeamResponse, ContractResponse
import os
import shutil
import uuid

router = APIRouter()

@router.get("", response_model=list[TeamResponse])
async def get_all_teams(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Team).options(selectinload(Team.owner)))
    return result.scalars().all()

@router.get("/mine", response_model=TeamResponse)
async def get_my_team(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    team = None
    
    if current_user.owner_profile:
        result = await db.execute(
            select(Team)
            .options(selectinload(Team.owner))
            .where(Team.owner_id == current_user.owner_profile.id)
        )
        team = result.scalars().first()
    elif current_user.pro_profile:
        from app.models.esports import Contract, ContractState
        from app.models.users import OwnerProfile
        contract_result = await db.execute(
            select(Contract)
            .options(selectinload(Contract.team).selectinload(Team.owner))
            .where(Contract.pro_id == current_user.pro_profile.id, Contract.status == ContractState.ACTIVE)
        )
        active_contract = contract_result.scalars().first()
        if active_contract:
            team = active_contract.team
    else:
        raise HTTPException(status_code=403, detail="Only team owners or pro players can access this")
    
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    return team

@router.get("/{team_id}/roster", response_model=list[ContractResponse])
async def get_team_roster(
    team_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Contract)
        .options(selectinload(Contract.pro), selectinload(Contract.team).selectinload(Team.owner))
        .where(Contract.team_id == team_id, Contract.status == ContractState.ACTIVE)
    )
    return result.scalars().all()

@router.post("/", response_model=TeamResponse, status_code=201)
async def create_team(
    name: str = Form(...),
    country: str = Form(...),
    logo: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user.owner_profile:
        raise HTTPException(status_code=403, detail="Only team owners can create a team")
        
    result = await db.execute(select(Team).where(Team.owner_id == current_user.owner_profile.id))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="You already have a team")
        
    logo_url = None
    if logo and logo.filename:
        os.makedirs("uploads", exist_ok=True)
        file_ext = logo.filename.split('.')[-1]
        file_name = f"team_{uuid.uuid4()}.{file_ext}"
        file_path = os.path.join("uploads", file_name)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(logo.file, buffer)
        logo_url = f"http://localhost:8000/uploads/{file_name}"
        
    new_team = Team(
        name=name,
        country=country,
        logo_url=logo_url,
        owner_id=current_user.owner_profile.id
    )
    db.add(new_team)
    await db.commit()
    
    result = await db.execute(
        select(Team)
        .options(selectinload(Team.owner))
        .where(Team.id == new_team.id)
    )
    return result.scalars().first()

@router.put("/mine", response_model=TeamResponse)
async def update_my_team(
    name: Optional[str] = Form(None),
    country: Optional[str] = Form(None),
    logo: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    with open("teams_debug.txt", "a") as f:
        f.write(f"update_my_team called! name={name}, country={country}, logo={'yes' if logo else 'no'}\n")
    if not current_user.owner_profile:
        raise HTTPException(status_code=403, detail="Only team owners can update their team")
        
    result = await db.execute(
        select(Team)
        .options(selectinload(Team.owner))
        .where(Team.owner_id == current_user.owner_profile.id)
    )
    team = result.scalars().first()
    
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    if name is not None:
        team.name = name
    if country is not None:
        team.country = country
        
    if logo and logo.filename:
        os.makedirs("uploads", exist_ok=True)
        file_ext = logo.filename.split('.')[-1]
        file_name = f"team_{uuid.uuid4()}.{file_ext}"
        file_path = os.path.join("uploads", file_name)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(logo.file, buffer)
        team.logo_url = f"http://localhost:8000/uploads/{file_name}"
        
    await db.commit()
    
    result = await db.execute(
        select(Team)
        .options(selectinload(Team.owner))
        .where(Team.id == team.id)
    )
    return result.scalars().first()
