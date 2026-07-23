from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import date
from app.models.users import CS2Role

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class PersonBase(BaseModel):
    full_name: str
    photo_url: Optional[str] = None
    country: Optional[str] = None

class ProProfileCreate(PersonBase):
    nickname: str
    birth_date: date
    roles_in_game: List[CS2Role] = []

class OwnerProfileCreate(PersonBase):
    pass

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

class ProProfileResponse(PersonBase):
    id: int
    nickname: str
    birth_date: date
    roles_in_game: List[CS2Role] = []
    class Config:
        from_attributes = True

class OwnerProfileResponse(PersonBase):
    id: int
    class Config:
        from_attributes = True

class UserProfileResponse(UserBase):
    id: int
    role_id: Optional[int]
    pro_profile: Optional[ProProfileResponse] = None
    owner_profile: Optional[OwnerProfileResponse] = None
    class Config:
        from_attributes = True
