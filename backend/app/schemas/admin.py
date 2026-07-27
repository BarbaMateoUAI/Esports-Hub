from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import date, datetime
from app.models.users import CS2Role
from app.models.esports import ContractState

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
    roles: List[RoleResponse] = []
    specific_permissions: List[PermissionResponse] = []
    all_permissions: List[PermissionResponse] = []

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

class UserPermissionsUpdate(BaseModel):
    permission_ids: List[int]


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

# --- New schemas for Contracts Timeline ---

class AdminPlayerListResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    nickname: str
    
    class Config:
        from_attributes = True

class AdminTeamSimpleResponse(BaseModel):
    id: int
    name: str
    logo_url: Optional[str] = None
    
    class Config:
        from_attributes = True

class AdminContractResponse(BaseModel):
    id: int
    team_id: int
    pro_id: int
    salary: float
    duration_months: int
    buyout_clause: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: ContractState
    is_renegotiation: bool = False
    is_deleted: bool = False
    team: AdminTeamSimpleResponse
    
    class Config:
        from_attributes = True

class AdminContractTimelineUpdate(BaseModel):
    salary: Optional[float] = None
    duration_months: Optional[int] = None
    buyout_clause: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[ContractState] = None
    is_deleted: Optional[bool] = None
