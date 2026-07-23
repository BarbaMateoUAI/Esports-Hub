import enum
import datetime
from typing import List, Optional
from sqlalchemy import String, Integer, ForeignKey, Table, Column, Enum, Boolean, Date
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base

class CS2Role(enum.Enum):
    ENTRY = "Entry"
    AWP = "AWP"
    SUPPORT = "Support"
    LURKER = "Lurker"
    IGL = "IGL"

role_permission = Table(
    "role_permission",
    Base.metadata,
    Column("role_id", ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
)

class Permission(Base):
    __tablename__ = "permissions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(String(255))


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, server_default='false')

    permissions: Mapped[List[Permission]] = relationship(secondary=role_permission)
    users: Mapped[List["User"]] = relationship(back_populates="role")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    role_id: Mapped[Optional[int]] = mapped_column(ForeignKey("roles.id", ondelete="RESTRICT"))
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, server_default='false')

    role: Mapped[Optional["Role"]] = relationship(back_populates="users")
    
    person: Mapped[Optional["Person"]] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )

    @property
    def pro_profile(self) -> Optional["ProProfile"]:
        if isinstance(self.person, ProProfile):
            return self.person
        return None

    @property
    def owner_profile(self) -> Optional["OwnerProfile"]:
        if isinstance(self.person, OwnerProfile):
            return self.person
        return None


class Person(Base):
    __tablename__ = "persons"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    
    full_name: Mapped[str] = mapped_column(String(100))
    photo_url: Mapped[Optional[str]] = mapped_column(String(255))
    country: Mapped[Optional[str]] = mapped_column(String(3))
    
    type: Mapped[str] = mapped_column(String(50))

    __mapper_args__ = {
        "polymorphic_identity": "person",
        "polymorphic_on": "type",
    }

    user: Mapped["User"] = relationship(back_populates="person")


class ProProfile(Person):
    __tablename__ = "pro_profiles"

    id: Mapped[int] = mapped_column(ForeignKey("persons.id", ondelete="CASCADE"), primary_key=True)
    
    nickname: Mapped[str] = mapped_column(String(50), index=True)
    birth_date: Mapped[datetime.date] = mapped_column(Date)
    
    roles_in_game: Mapped[List[CS2Role]] = mapped_column(
        ARRAY(Enum(CS2Role, name="cs2role_enum", native_enum=True)),
        default=list
    )

    __mapper_args__ = {
        "polymorphic_identity": "pro_profile",
    }


class OwnerProfile(Person):
    __tablename__ = "owner_profiles"

    id: Mapped[int] = mapped_column(ForeignKey("persons.id", ondelete="CASCADE"), primary_key=True)

    __mapper_args__ = {
        "polymorphic_identity": "owner_profile",
    }
