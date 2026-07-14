from fastapi import APIRouter, Depends, Form, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import or_, and_
from typing import List, Optional
from pydantic import BaseModel

from app.api.deps import get_db, get_current_user
from app.models.users import User, ProProfile
from app.models.esports import Team, Contract, ContractState, TransferOffer, TransferOfferState
from app.schemas.esports import TeamResponse, ContractOffer, TransferOfferCreate, ContractResponse, TransferOfferResponse
from app.schemas.user import ProProfileResponse

router = APIRouter()

class MarketPlayerResponse(BaseModel):
    pro: ProProfileResponse
    team: Optional[TeamResponse] = None

    class Config:
        from_attributes = True

@router.get("/players", response_model=List[MarketPlayerResponse])
async def get_market_players(
    search: Optional[str] = None,
    filter_status: Optional[str] = None, # "free", "team", "all"
    db: AsyncSession = Depends(get_db)
):
    query = select(ProProfile).options(
        selectinload(ProProfile.user)
    )
    
    if search:
        query = query.where(
            or_(
                ProProfile.nickname.ilike(f"%{search}%"),
                ProProfile.full_name.ilike(f"%{search}%")
            )
        )
        
    result = await db.execute(query)
    pros = result.scalars().all()
    
    response_list = []
    for pro in pros:
        contract_result = await db.execute(
            select(Contract).options(selectinload(Contract.team).selectinload(Team.owner))
            .where(Contract.pro_id == pro.id, Contract.status == ContractState.ACTIVE)
        )
        active_contract = contract_result.scalars().first()
        
        has_team = active_contract is not None
        if filter_status == "free" and has_team:
            continue
        if filter_status == "team" and not has_team:
            continue
            
        team_data = active_contract.team if active_contract else None
        response_list.append(MarketPlayerResponse(pro=pro, team=team_data))
        
    return response_list

@router.post("/offer/contract")
async def offer_contract(
    offer: ContractOffer,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user.owner_profile:
        raise HTTPException(status_code=403, detail="Only team owners can offer contracts")
        
    team_result = await db.execute(select(Team).where(Team.owner_id == current_user.owner_profile.id))
    team = team_result.scalars().first()
    if not team:
        raise HTTPException(status_code=400, detail="You don't have a team yet")
        
    new_contract = Contract(
        team_id=team.id,
        pro_id=offer.pro_id,
        salary=offer.salary,
        duration_months=offer.duration_months,
        buyout_clause=offer.buyout_clause,
        start_date=offer.start_date,
        end_date=offer.end_date,
        status=ContractState.PENDING
    )
    db.add(new_contract)
    await db.commit()
    return {"message": "Contract offer sent to player."}

@router.post("/offer/transfer")
async def offer_transfer(
    offer: TransferOfferCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user.owner_profile:
        raise HTTPException(status_code=403, detail="Only team owners can make transfer offers")
        
    team_result = await db.execute(select(Team).where(Team.owner_id == current_user.owner_profile.id))
    team = team_result.scalars().first()
    if not team:
        raise HTTPException(status_code=400, detail="You don't have a team")
        
    if team.id == offer.to_team_id:
        raise HTTPException(status_code=400, detail="Cannot transfer to your own team")
        
    new_offer = TransferOffer(
        from_team_id=team.id,
        to_team_id=offer.to_team_id,
        pro_id=offer.pro_id,
        amount=offer.amount,
        status=TransferOfferState.PENDING
    )
    db.add(new_offer)
    await db.commit()
    return {"message": "Transfer offer sent to team owner."}

@router.get("/my-offers")
async def get_my_offers(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result_dict = {"transfers": [], "contracts": []}
    
    if current_user.owner_profile:
        team_result = await db.execute(select(Team).where(Team.owner_id == current_user.owner_profile.id))
        team = team_result.scalars().first()
        if team:
            transfers_result = await db.execute(
                select(TransferOffer)
                .options(selectinload(TransferOffer.pro), selectinload(TransferOffer.from_team), selectinload(TransferOffer.to_team))
                .where(or_(TransferOffer.from_team_id == team.id, TransferOffer.to_team_id == team.id))
            )
            result_dict["transfers"] = transfers_result.scalars().all()
            
            contracts_result = await db.execute(
                select(Contract)
                .options(selectinload(Contract.pro), selectinload(Contract.team).selectinload(Team.owner))
                .where(Contract.team_id == team.id)
            )
            result_dict["contracts"] = contracts_result.scalars().all()
            
    if current_user.pro_profile:
        contracts_result = await db.execute(
            select(Contract)
            .options(selectinload(Contract.team).selectinload(Team.owner), selectinload(Contract.pro))
            .where(Contract.pro_id == current_user.pro_profile.id)
        )
        result_dict["contracts"] = contracts_result.scalars().all()
        
    return result_dict

@router.put("/offer/transfer/{offer_id}")
async def update_transfer_offer(
    offer_id: int,
    status: TransferOfferState,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user.owner_profile:
        raise HTTPException(status_code=403, detail="Only team owners can update transfer offers")
        
    team_result = await db.execute(select(Team).where(Team.owner_id == current_user.owner_profile.id))
    team = team_result.scalars().first()
    if not team:
        raise HTTPException(status_code=400, detail="You don't have a team")
        
    offer_result = await db.execute(select(TransferOffer).where(TransferOffer.id == offer_id))
    offer = offer_result.scalars().first()
    
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
        
    if offer.to_team_id != team.id:
        raise HTTPException(status_code=403, detail="Not your offer to accept/reject")
        
    offer.status = status
    
    if status == TransferOfferState.ACCEPTED:
        new_contract = Contract(
            team_id=offer.from_team_id,
            pro_id=offer.pro_id,
            salary=float(offer.amount) * 0.10,
            duration_months=6,
            buyout_clause=float(offer.amount) * 2,
            status=ContractState.PENDING
        )
        db.add(new_contract)
        
    await db.commit()
    return {"message": f"Transfer offer {status.value}"}

@router.put("/offer/contract/{offer_id}")
async def update_contract_offer(
    offer_id: int,
    status: ContractState,
    salary: Optional[float] = Form(None),
    duration_months: Optional[int] = Form(None),
    buyout_clause: Optional[float] = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user.pro_profile and not current_user.owner_profile:
        raise HTTPException(status_code=403, detail="You must be a pro or an owner to update contracts")
        
    offer_result = await db.execute(
        select(Contract).options(selectinload(Contract.team)).where(Contract.id == offer_id)
    )
    offer = offer_result.scalars().first()
    
    if not offer:
        raise HTTPException(status_code=404, detail="Contract not found")
        
    is_my_pro_contract = current_user.pro_profile and offer.pro_id == current_user.pro_profile.id
    is_my_team_contract = current_user.owner_profile and offer.team and offer.team.owner_id == current_user.owner_profile.id

    if not is_my_pro_contract and not is_my_team_contract:
        raise HTTPException(status_code=403, detail="Not your contract")
        
    offer.status = status
    if status == ContractState.COUNTER_OFFER:
        if salary is not None:
            offer.salary = salary
        if duration_months is not None:
            offer.duration_months = duration_months
        if buyout_clause is not None:
            offer.buyout_clause = buyout_clause
        
    if status == ContractState.ACTIVE:
        other_contracts = await db.execute(
            select(Contract)
            .where(
                Contract.pro_id == offer.pro_id, 
                Contract.status == ContractState.ACTIVE,
                Contract.id != offer.id
            )
        )
        for c in other_contracts.scalars().all():
            c.status = ContractState.FINISHED
            
        import datetime
        from dateutil.relativedelta import relativedelta
        offer.start_date = datetime.datetime.utcnow()
        offer.end_date = offer.start_date + relativedelta(months=offer.duration_months)
            
    await db.commit()
    return {"message": f"Contract offer {status.value}"}
