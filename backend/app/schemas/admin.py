from pydantic import BaseModel
from typing import List, Optional

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
