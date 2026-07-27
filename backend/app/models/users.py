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
    COACH = "Coach"
    ANALYST = "Analyst"

role_permission = Table(
    "role_permission",
    Base.metadata,
    Column("role_id", ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
)

user_role = Table(
    "user_role",
    Base.metadata,
    Column("user_id", ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
)

user_permission = Table(
    "user_permission",
    Base.metadata,
    Column("user_id", ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
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
    users: Mapped[List["User"]] = relationship(secondary=user_role, back_populates="roles")

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, server_default='false')

    roles: Mapped[List["Role"]] = relationship(secondary=user_role, back_populates="users")
    specific_permissions: Mapped[List["Permission"]] = relationship(secondary=user_permission)

    person: Mapped[Optional["Person"]] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )

    @property
    def all_permissions(self) -> List["Permission"]:
        perms_dict = {}
        for role in self.roles:
            for p in role.permissions:
                perms_dict[p.id] = p
        for p in self.specific_permissions:
            perms_dict[p.id] = p
        return list(perms_dict.values())

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
        "with_polymorphic": "*",
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
