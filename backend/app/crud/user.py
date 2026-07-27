from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.models.users import User, ProProfile, OwnerProfile, Role
from app.schemas.user import UserCreate, ProProfileCreate, OwnerProfileCreate
from app.core.security import get_password_hash
from fastapi import HTTPException, status

async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalars().first()

async def get_role_by_name(db: AsyncSession, name: str) -> Role | None:
    result = await db.execute(select(Role).where(Role.name == name))
    return result.scalars().first()

async def ensure_role(db: AsyncSession, name: str) -> Role:
    role = await get_role_by_name(db, name)
    if not role:
        role = Role(name=name)
        db.add(role)
        await db.commit()
        await db.refresh(role)
    return role

async def create_regular_user(db: AsyncSession, user_in: UserCreate) -> User:
    existing_user = await get_user_by_email(db, user_in.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    db_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        roles=[]
    )
    db.add(db_user)
    await db.commit()
    
    res = await db.execute(select(User).options(selectinload(User.roles)).where(User.id == db_user.id))
    return res.scalars().first()

async def create_user_with_pro_profile(db: AsyncSession, user_in: UserCreate, profile_in: ProProfileCreate) -> User:
    existing_user = await get_user_by_email(db, user_in.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    role = await ensure_role(db, "ProPlayer")

    db_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        roles=[role]
    )
    db.add(db_user)
    await db.flush()

    db_profile = ProProfile(
        user_id=db_user.id,
        full_name=profile_in.full_name,
        nickname=profile_in.nickname,
        birth_date=profile_in.birth_date,
        country=profile_in.country,
        roles_in_game=profile_in.roles_in_game
    )
    db.add(db_profile)
    await db.commit()
    
    res = await db.execute(select(User).options(selectinload(User.roles)).where(User.id == db_user.id))
    return res.scalars().first()

async def create_user_with_owner_profile(db: AsyncSession, user_in: UserCreate, profile_in: OwnerProfileCreate) -> User:
    existing_user = await get_user_by_email(db, user_in.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    role = await ensure_role(db, "TeamOwner")

    db_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        roles=[role]
    )
    db.add(db_user)
    await db.flush()

    db_profile = OwnerProfile(
        user_id=db_user.id,
        full_name=profile_in.full_name,
        country=profile_in.country
    )
    db.add(db_profile)
    await db.commit()
    
    res = await db.execute(select(User).options(selectinload(User.roles)).where(User.id == db_user.id))
    return res.scalars().first()

async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
    from app.core.security import verify_password
    from sqlalchemy.orm import selectinload

    result = await db.execute(
        select(User)
        .options(selectinload(User.roles).selectinload(Role.permissions), selectinload(User.specific_permissions))
        .where(User.email == email)
    )
    user = result.scalars().first()

    if not user:
        return None
    if user.is_deleted:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

async def update_user_password(db: AsyncSession, user: User, new_password: str) -> User:
    from app.core.security import get_password_hash
    user.hashed_password = get_password_hash(new_password)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
