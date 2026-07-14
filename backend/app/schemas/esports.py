from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.models.esports import ContractState, TransferOfferState
from app.schemas.user import OwnerProfileResponse, ProProfileResponse

class TeamBase(BaseModel):
    name: str
    country: str
    logo_url: Optional[str] = None

class TeamCreate(TeamBase):
    pass

class TeamResponse(TeamBase):
    id: int
    owner_id: int
    owner: Optional[OwnerProfileResponse] = None

    class Config:
        from_attributes = True

class ContractBase(BaseModel):
    salary: float
    duration_months: int
    buyout_clause: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class ContractOffer(ContractBase):
    pro_id: int

class ContractResponse(ContractBase):
    id: int
    team_id: int
    pro_id: int
    status: ContractState
    team: Optional[TeamResponse] = None
    pro: Optional[ProProfileResponse] = None

    class Config:
        from_attributes = True

class ContractUpdate(BaseModel):
    status: ContractState
    salary: Optional[float] = None # For counter offers
    duration_months: Optional[int] = None
    buyout_clause: Optional[float] = None

class TransferOfferBase(BaseModel):
    amount: float
    pro_id: int
    to_team_id: int

class TransferOfferCreate(TransferOfferBase):
    pass

class TransferOfferResponse(TransferOfferBase):
    id: int
    from_team_id: int
    status: TransferOfferState
    from_team: Optional[TeamResponse] = None
    to_team: Optional[TeamResponse] = None
    pro: Optional[ProProfileResponse] = None

    class Config:
        from_attributes = True

class TransferOfferUpdate(BaseModel):
    status: TransferOfferState
