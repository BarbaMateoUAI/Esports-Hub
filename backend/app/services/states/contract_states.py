from fastapi import HTTPException
import datetime
from dateutil.relativedelta import relativedelta
from sqlalchemy.future import select

from app.models.esports import ContractState, Contract
from app.services.states.base import BaseContractState

class PendingContractState(BaseContractState):
    async def process_transition(self, new_status: ContractState, current_user, **kwargs):
        if new_status == ContractState.ACTIVE:
            await self._activate_contract()
        elif new_status == ContractState.REJECTED:
            self.contract.status = ContractState.REJECTED
        elif new_status == ContractState.COUNTER_OFFER:
            self._apply_counter_offer(**kwargs)
        else:
            self.raise_invalid_transition(new_status.value)
            
    async def _activate_contract(self):
        other_contracts = await self.db.execute(
            select(Contract)
            .where(
                Contract.pro_id == self.contract.pro_id, 
                Contract.status == ContractState.ACTIVE,
                Contract.id != self.contract.id
            )
        )
        for c in other_contracts.scalars().all():
            c.status = ContractState.FINISHED
            
        self.contract.start_date = datetime.datetime.utcnow()
        self.contract.end_date = self.contract.start_date + relativedelta(months=self.contract.duration_months)
        self.contract.status = ContractState.ACTIVE

    def _apply_counter_offer(self, salary=None, duration_months=None, buyout_clause=None, **kwargs):
        if salary is not None:
            self.contract.salary = salary
        if duration_months is not None:
            self.contract.duration_months = duration_months
        if buyout_clause is not None:
            self.contract.buyout_clause = buyout_clause
        self.contract.status = ContractState.COUNTER_OFFER


class CounterOfferContractState(BaseContractState):
    async def process_transition(self, new_status: ContractState, current_user, **kwargs):
        if new_status == ContractState.ACTIVE:
            await self._activate_contract()
        elif new_status == ContractState.REJECTED:
            self.contract.status = ContractState.REJECTED
        elif new_status == ContractState.COUNTER_OFFER:
            self._apply_counter_offer(**kwargs)
        else:
            self.raise_invalid_transition(new_status.value)
            
    async def _activate_contract(self):
        other_contracts = await self.db.execute(
            select(Contract)
            .where(
                Contract.pro_id == self.contract.pro_id, 
                Contract.status == ContractState.ACTIVE,
                Contract.id != self.contract.id
            )
        )
        for c in other_contracts.scalars().all():
            c.status = ContractState.FINISHED
            
        self.contract.start_date = datetime.datetime.utcnow()
        self.contract.end_date = self.contract.start_date + relativedelta(months=self.contract.duration_months)
        self.contract.status = ContractState.ACTIVE

    def _apply_counter_offer(self, salary=None, duration_months=None, buyout_clause=None, **kwargs):
        if salary is not None:
            self.contract.salary = salary
        if duration_months is not None:
            self.contract.duration_months = duration_months
        if buyout_clause is not None:
            self.contract.buyout_clause = buyout_clause
        self.contract.status = ContractState.COUNTER_OFFER


class ActiveContractState(BaseContractState):
    async def process_transition(self, new_status: ContractState, current_user, **kwargs):
        if new_status == ContractState.FINISHED:
            self.contract.status = ContractState.FINISHED
        else:
            self.raise_invalid_transition(new_status.value)


class FinishedContractState(BaseContractState):
    async def process_transition(self, new_status: ContractState, current_user, **kwargs):
        self.raise_invalid_transition(new_status.value)


class RejectedContractState(BaseContractState):
    async def process_transition(self, new_status: ContractState, current_user, **kwargs):
        self.raise_invalid_transition(new_status.value)
