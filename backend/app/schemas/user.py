from pydantic import BaseModel, EmailStr
from typing import List, Optional
from app.models.users import CS2Role

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class ProProfileCreate(BaseModel):
    full_name: str
    nickname: str
    age: int
    photo_url: Optional[str] = None
    roles_in_game: List[CS2Role] = []

class OwnerProfileCreate(BaseModel):
    full_name: str
    photo_url: Optional[str] = None

class UserProRegistration(BaseModel):
    user: UserCreate
    profile: ProProfileCreate

class UserOwnerRegistration(BaseModel):
    user: UserCreate
    profile: OwnerProfileCreate

class UserResponse(UserBase):
    id: int
    role_id: Optional[int]

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class ProProfileResponse(BaseModel):
    id: int
    full_name: str
    nickname: str
    age: int
    photo_url: Optional[str] = None
    roles_in_game: List[CS2Role] = []
    class Config:
        from_attributes = True

class OwnerProfileResponse(BaseModel):
    id: int
    full_name: str
    photo_url: Optional[str] = None
    class Config:
        from_attributes = True

class UserProfileResponse(UserBase):
    id: int
    role_id: Optional[int]
    pro_profile: Optional[ProProfileResponse] = None
    owner_profile: Optional[OwnerProfileResponse] = None
    class Config:
        from_attributes = True
