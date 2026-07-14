import enum
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, ForeignKey, Enum, Numeric, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base

if TYPE_CHECKING:
    from app.models.users import OwnerProfile, ProProfile

class ContractState(enum.Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    FINISHED = "FINISHED"
    REJECTED = "REJECTED"
    COUNTER_OFFER = "COUNTER_OFFER"

class TransferOfferState(enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    NEGOTIATING = "NEGOTIATING"

class Team(Base):
    __tablename__ = "teams"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String(255))
    country: Mapped[str] = mapped_column(String(50))
    owner_id: Mapped[int] = mapped_column(ForeignKey("owner_profiles.id", ondelete="RESTRICT"))

    owner: Mapped["OwnerProfile"] = relationship()
    contracts: Mapped[List["Contract"]] = relationship(back_populates="team", cascade="all, delete-orphan")
    
    outgoing_offers: Mapped[List["TransferOffer"]] = relationship(
        foreign_keys="[TransferOffer.from_team_id]",
        back_populates="from_team"
    )
    incoming_offers: Mapped[List["TransferOffer"]] = relationship(
        foreign_keys="[TransferOffer.to_team_id]",
        back_populates="to_team"
    )


class Contract(Base):
    __tablename__ = "contracts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id", ondelete="CASCADE"))
    pro_id: Mapped[int] = mapped_column(ForeignKey("pro_profiles.id", ondelete="CASCADE"))
    
    salary: Mapped[float] = mapped_column(Numeric(10, 2))
    duration_months: Mapped[int] = mapped_column(Integer, default=6)
    buyout_clause: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime)

    status: Mapped[ContractState] = mapped_column(
        Enum(ContractState, name="contract_state_enum", native_enum=True),
        default=ContractState.PENDING
    )

    team: Mapped["Team"] = relationship(back_populates="contracts")
    pro: Mapped["ProProfile"] = relationship()


class TransferOffer(Base):
    __tablename__ = "transfer_offers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    from_team_id: Mapped[int] = mapped_column(ForeignKey("teams.id", ondelete="CASCADE"))
    to_team_id: Mapped[int] = mapped_column(ForeignKey("teams.id", ondelete="CASCADE"))
    pro_id: Mapped[int] = mapped_column(ForeignKey("pro_profiles.id", ondelete="CASCADE"))
    
    amount: Mapped[float] = mapped_column(Numeric(12, 2))
    
    status: Mapped[TransferOfferState] = mapped_column(
        Enum(TransferOfferState, name="transfer_offer_state_enum", native_enum=True),
        default=TransferOfferState.PENDING
    )

    from_team: Mapped["Team"] = relationship(foreign_keys=[from_team_id], back_populates="outgoing_offers")
    to_team: Mapped["Team"] = relationship(foreign_keys=[to_team_id], back_populates="incoming_offers")
    pro: Mapped["ProProfile"] = relationship()
