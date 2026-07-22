from app.models.esports import TransferOfferState, Contract, ContractState
from app.services.states.base import BaseTransferState

class PendingTransferState(BaseTransferState):
    async def process_transition(self, new_status: TransferOfferState, current_user, **kwargs):
        if new_status == TransferOfferState.ACCEPTED:
            self.offer.status = TransferOfferState.ACCEPTED
            self._create_contract()
        elif new_status == TransferOfferState.REJECTED:
            self.offer.status = TransferOfferState.REJECTED
        elif new_status == TransferOfferState.NEGOTIATING:
            self.offer.status = TransferOfferState.NEGOTIATING
            # Can update amount if provided in kwargs
            amount = kwargs.get('amount')
            if amount is not None:
                self.offer.amount = amount
        else:
            self.raise_invalid_transition(new_status.value)
            
    def _create_contract(self):
        new_contract = Contract(
            team_id=self.offer.from_team_id,
            pro_id=self.offer.pro_id,
            salary=float(self.offer.amount) * 0.10,
            duration_months=6,
            buyout_clause=float(self.offer.amount) * 2,
            status=ContractState.PENDING,
            transfer_offer_id=self.offer.id
        )
        self.db.add(new_contract)


class NegotiatingTransferState(BaseTransferState):
    async def process_transition(self, new_status: TransferOfferState, current_user, **kwargs):
        if new_status == TransferOfferState.ACCEPTED:
            self.offer.status = TransferOfferState.ACCEPTED
            self._create_contract()
        elif new_status == TransferOfferState.REJECTED:
            self.offer.status = TransferOfferState.REJECTED
        elif new_status == TransferOfferState.NEGOTIATING:
            self.offer.status = TransferOfferState.NEGOTIATING
            amount = kwargs.get('amount')
            if amount is not None:
                self.offer.amount = amount
        else:
            self.raise_invalid_transition(new_status.value)

    def _create_contract(self):
        new_contract = Contract(
            team_id=self.offer.from_team_id,
            pro_id=self.offer.pro_id,
            salary=float(self.offer.amount) * 0.10,
            duration_months=6,
            buyout_clause=float(self.offer.amount) * 2,
            status=ContractState.PENDING,
            transfer_offer_id=self.offer.id
        )
        self.db.add(new_contract)


class AcceptedTransferState(BaseTransferState):
    async def process_transition(self, new_status: TransferOfferState, current_user, **kwargs):
        self.raise_invalid_transition(new_status.value)


class RejectedTransferState(BaseTransferState):
    async def process_transition(self, new_status: TransferOfferState, current_user, **kwargs):
        self.raise_invalid_transition(new_status.value)
