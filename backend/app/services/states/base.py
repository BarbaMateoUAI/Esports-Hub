from abc import ABC, abstractmethod
from typing import Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.models.esports import Contract, TransferOffer

class BaseContractState(ABC):
    def __init__(self, context):
        self.context = context

    @property
    def db(self) -> AsyncSession:
        return self.context.db

    @property
    def contract(self) -> Contract:
        return self.context.contract

    @abstractmethod
    async def process_transition(self, new_status: str, current_user: Any, **kwargs):
        """Processes the state transition based on the requested new_status."""
        pass
        
    def raise_invalid_transition(self, new_status: str):
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid transition from {self.contract.status.value} to {new_status}"
        )


class BaseTransferState(ABC):
    def __init__(self, context):
        self.context = context

    @property
    def db(self) -> AsyncSession:
        return self.context.db

    @property
    def offer(self) -> TransferOffer:
        return self.context.offer

    @abstractmethod
    async def process_transition(self, new_status: str, current_user: Any, **kwargs):
        """Processes the state transition based on the requested new_status."""
        pass
        
    def raise_invalid_transition(self, new_status: str):
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid transition from {self.offer.status.value} to {new_status}"
        )
