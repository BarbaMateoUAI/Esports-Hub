from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Integer, ForeignKey, DateTime, Float, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.database import Base

if TYPE_CHECKING:
    from app.models.esports import Team
    from app.models.users import ProProfile, User

class Tournament(Base):
    __tablename__ = "tournaments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime)

    matches: Mapped[List["Match"]] = relationship(back_populates="tournament", cascade="all, delete-orphan")


class Match(Base):
    __tablename__ = "matches"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    tournament_id: Mapped[int] = mapped_column(ForeignKey("tournaments.id", ondelete="CASCADE"))
    
    team_a_id: Mapped[int] = mapped_column(ForeignKey("teams.id", ondelete="CASCADE"))
    team_b_id: Mapped[int] = mapped_column(ForeignKey("teams.id", ondelete="CASCADE"))
    
    scheduled_time: Mapped[Optional[datetime]] = mapped_column(DateTime)
    demo_url: Mapped[Optional[str]] = mapped_column(String(255)) # URL al archivo .dem para el procesado

    tournament: Mapped["Tournament"] = relationship(back_populates="matches")
    team_a: Mapped["Team"] = relationship(foreign_keys=[team_a_id])
    team_b: Mapped["Team"] = relationship(foreign_keys=[team_b_id])
    
    stats: Mapped[List["MatchPlayerStat"]] = relationship(back_populates="match", cascade="all, delete-orphan")
    comments: Mapped[List["ForumComment"]] = relationship(back_populates="match", cascade="all, delete-orphan")


class MatchPlayerStat(Base):
    """
    Estadísticas normalizadas de un jugador en una partida en particular.
    """
    __tablename__ = "match_player_stats"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    match_id: Mapped[int] = mapped_column(ForeignKey("matches.id", ondelete="CASCADE"))
    pro_id: Mapped[int] = mapped_column(ForeignKey("pro_profiles.id", ondelete="CASCADE"))
    
    kills: Mapped[int] = mapped_column(Integer, default=0)
    deaths: Mapped[int] = mapped_column(Integer, default=0)
    assists: Mapped[int] = mapped_column(Integer, default=0)
    
    rating: Mapped[float] = mapped_column(Float, default=0.0)

    match: Mapped["Match"] = relationship(back_populates="stats")
    pro: Mapped["ProProfile"] = relationship()


class ForumComment(Base):
    """
    Comentarios de los usuarios en la página del partido, simulando la funcionalidad de foros de HLTV.
    """
    __tablename__ = "forum_comments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    match_id: Mapped[int] = mapped_column(ForeignKey("matches.id", ondelete="CASCADE"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    
    text: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    match: Mapped["Match"] = relationship(back_populates="comments")
    user: Mapped["User"] = relationship()
