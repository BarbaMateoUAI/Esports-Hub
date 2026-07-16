from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.models.esports import Contract, TransferOffer, ContractState, TransferOfferState

from app.services.states.contract_states import (
    PendingContractState,
    ActiveContractState,
    FinishedContractState,
    RejectedContractState,
    CounterOfferContractState
)

from app.services.states.transfer_states import (
    PendingTransferState,
    AcceptedTransferState,
    RejectedTransferState,
    NegotiatingTransferState
)


class ContractContext:
    def __init__(self, contract: Contract, db: AsyncSession):
        self.contract = contract
        self.db = db
        self.state = self._get_state_instance()

    def _get_state_instance(self):
        status = self.contract.status
        if status == ContractState.PENDING:
            return PendingContractState(self)
        elif status == ContractState.ACTIVE:
            return ActiveContractState(self)
        elif status == ContractState.FINISHED:
            return FinishedContractState(self)
        elif status == ContractState.REJECTED:
            return RejectedContractState(self)
        elif status == ContractState.COUNTER_OFFER:
            return CounterOfferContractState(self)
        else:
            raise HTTPException(status_code=500, detail="Unknown contract state")

    async def transition_to(self, new_status: ContractState, current_user, **kwargs):
        await self.state.process_transition(new_status, current_user, **kwargs)
        self.state = self._get_state_instance()


class TransferOfferContext:
    def __init__(self, offer: TransferOffer, db: AsyncSession):
        self.offer = offer
        self.db = db
        self.state = self._get_state_instance()
        
    def _get_state_instance(self):
        status = self.offer.status
        if status == TransferOfferState.PENDING:
            return PendingTransferState(self)
        elif status == TransferOfferState.ACCEPTED:
            return AcceptedTransferState(self)
        elif status == TransferOfferState.REJECTED:
            return RejectedTransferState(self)
        elif status == TransferOfferState.NEGOTIATING:
            return NegotiatingTransferState(self)
        else:
            raise HTTPException(status_code=500, detail="Unknown transfer offer state")

    async def transition_to(self, new_status: TransferOfferState, current_user, **kwargs):
        await self.state.process_transition(new_status, current_user, **kwargs)
        self.state = self._get_state_instance()
