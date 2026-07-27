from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import date, datetime
from app.models.users import CS2Role

class PermissionBase(BaseModel):
    name: str
    description: Optional[str] = None

class PermissionResponse(PermissionBase):
    id: int
    class Config:
        from_attributes = True

class RoleBase(BaseModel):
    name: str

class RoleCreate(RoleBase):
    permission_ids: List[int] = []

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    permission_ids: Optional[List[int]] = None

class RoleResponse(RoleBase):
    id: int
    is_deleted: bool = False
    permissions: List[PermissionResponse] = []
    class Config:
        from_attributes = True

class UserAdminResponse(BaseModel):
    id: int
    email: str
    is_deleted: bool = False
    role: Optional[RoleBase] = None

    class Config:
        from_attributes = True

class ReportOverview(BaseModel):
    total_players: int
    total_teams: int
    active_contracts: int

class RoleDistribution(BaseModel):
    name: str
    value: int

class AgeDistribution(BaseModel):
    age: int
    count: int

class TeamFinance(BaseModel):
    team_name: str
    avg_salary: float
    total_market_value: float

class AdminReportResponse(BaseModel):
    overview: ReportOverview
    roles_distribution: List[RoleDistribution]
    age_distribution: List[AgeDistribution]
    team_finances: List[TeamFinance]


# --- New schemas for Full User Edit ---

class AdminProProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    nickname: Optional[str] = None
    country: Optional[str] = None
    birth_date: Optional[date] = None
    roles_in_game: Optional[List[CS2Role]] = None

class AdminContractUpdate(BaseModel):
    salary: Optional[float] = None
    duration_months: Optional[int] = None
    buyout_clause: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class AdminFullUserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    profile: Optional[AdminProProfileUpdate] = None
    contract: Optional[AdminContractUpdate] = None

class AdminFullUserResponse(BaseModel):
    user: UserAdminResponse
    profile: Optional[dict] = None
    contract: Optional[dict] = None

    class Config:
        from_attributes = True
