from typing import AsyncGenerator, Annotated, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.db.database import SessionLocal
from app.models.users import User, Role
import jwt
from jwt.exceptions import InvalidTokenError
from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/users/login")

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session

async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except InvalidTokenError:
        raise credentials_exception

    result = await db.execute(
        select(User)
        .where(User.email == email)
        .options(
            selectinload(User.role).selectinload(Role.permissions),
            selectinload(User.person)
        )
    )
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_user_optional(
    token: Annotated[str, Depends(OAuth2PasswordBearer(tokenUrl="api/users/login", auto_error=False))],
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
    except InvalidTokenError:
        return None

    result = await db.execute(
        select(User)
        .where(User.email == email)
        .options(
            selectinload(User.role).selectinload(Role.permissions),
            selectinload(User.person)
        )
    )
    return result.scalars().first()

async def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.role or (current_user.role.name != "Admin" and not current_user.role.permissions):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user
