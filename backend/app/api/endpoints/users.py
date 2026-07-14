from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from email_validator import validate_email as validate_email_dns, EmailNotValidError
from app.api.deps import get_db
from app.schemas.user import UserCreate, UserProRegistration, UserOwnerRegistration, UserResponse
from app.crud import user as crud_user

def ensure_real_email(email: str):
    try:
        validate_email_dns(email, check_deliverability=True)
    except EmailNotValidError as e:
        raise HTTPException(status_code=400, detail=str(e))

router = APIRouter()

@router.post("/register/user", response_model=UserResponse, status_code=201)
async def register_regular_user(
    data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    ensure_real_email(data.email)
    return await crud_user.create_regular_user(db, data)

@router.post("/register/pro", response_model=UserResponse, status_code=201)
async def register_pro_player(
    data: UserProRegistration,
    db: AsyncSession = Depends(get_db)
):
    ensure_real_email(data.user.email)
    return await crud_user.create_user_with_pro_profile(db, data.user, data.profile)

@router.post("/register/owner", response_model=UserResponse, status_code=201)
async def register_team_owner(
    data: UserOwnerRegistration,
    db: AsyncSession = Depends(get_db)
):
    ensure_real_email(data.user.email)
    return await crud_user.create_user_with_owner_profile(db, data.user, data.profile)

from fastapi.security import OAuth2PasswordRequestForm
from app.schemas.user import Token
from fastapi import HTTPException, status
from app.core.security import create_access_token

@router.post("/login", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    user = await crud_user.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    role_name = user.role.name if user.role else "Unknown"
    access_token = create_access_token(data={"sub": user.email, "role": role_name})
    return {"access_token": access_token, "token_type": "bearer", "role": role_name}

from app.api.deps import get_current_user
from app.schemas.user import UserProfileResponse
from sqlalchemy.orm import selectinload
from sqlalchemy.future import select
from app.models.users import User
from fastapi import UploadFile, File, Form
import os
import shutil
import uuid

@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(User)
        .options(selectinload(User.pro_profile), selectinload(User.owner_profile))
        .where(User.id == current_user.id)
    )
    user = result.scalars().first()
    return user

@router.put("/me/profile", response_model=UserProfileResponse)
async def update_my_profile(
    nickname: str = Form(None),
    photo: UploadFile = File(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(User)
        .options(selectinload(User.pro_profile), selectinload(User.owner_profile))
        .where(User.id == current_user.id)
    )
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if not user.pro_profile and not user.owner_profile:
        raise HTTPException(status_code=400, detail="Tu cuenta no posee un perfil para actualizar (foto o apodo).")
        
    photo_url = None
    if photo:
        os.makedirs("uploads", exist_ok=True)
        file_ext = photo.filename.split('.')[-1]
        file_name = f"{uuid.uuid4()}.{file_ext}"
        file_path = os.path.join("uploads", file_name)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
        photo_url = f"http://localhost:8000/uploads/{file_name}"
        
    if user.pro_profile:
        if nickname is not None:
            user.pro_profile.nickname = nickname
        if photo_url:
            user.pro_profile.photo_url = photo_url
            
    elif user.owner_profile:
        if photo_url:
            user.owner_profile.photo_url = photo_url
            
    await db.commit()
    
    result = await db.execute(
        select(User)
        .options(selectinload(User.pro_profile), selectinload(User.owner_profile))
        .where(User.id == current_user.id)
    )
    return result.scalars().first()

from pydantic import BaseModel
from app.core.security import create_password_reset_token, verify_password_reset_token

class PasswordRecoveryRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@router.post("/password-recovery")
async def recover_password(
    data: PasswordRecoveryRequest,
    db: AsyncSession = Depends(get_db)
):
    user = await crud_user.get_user_by_email(db, data.email)
    if not user:
        return {"message": "Se ha enviado un enlace de recuperación."}
    token = create_password_reset_token(user.email)
    
    from app.core.email import send_password_reset_email
    import asyncio
    
    await send_password_reset_email(user.email, token)
    
    return {"message": "Se ha enviado un enlace de recuperación."}

@router.post("/reset-password")
async def reset_password(
    data: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    email = verify_password_reset_token(data.token)
    if not email:
        raise HTTPException(status_code=400, detail="El token es inválido o ha expirado.")
        
    user = await crud_user.get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
        
    await crud_user.update_user_password(db, user, data.new_password)
    return {"message": "Contraseña actualizada exitosamente."}
