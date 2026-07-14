import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.database import SessionLocal
from app.models.users import User, Role, Permission
from app.core.security import get_password_hash

async def seed_db():
    async with SessionLocal() as db:
        print("Empezando a poblar la base de datos...")
        
        permissions_data = [
            {"name": "view_all", "description": "Puede ver toda la información de la plataforma"},
            {"name": "manage_users", "description": "Puede crear, editar, eliminar usuarios"},
            {"name": "manage_roles", "description": "Puede crear, editar, eliminar roles y permisos"},
            {"name": "manage_matches", "description": "Permite crear torneos, asignar equipos a dichos torneos, crear los partidos que se van a jugar y subir la demo para que se carguen las stats"},
        ]
        
        db_permissions = []
        for p_data in permissions_data:
            result = await db.execute(select(Permission).where(Permission.name == p_data["name"]))
            permission = result.scalars().first()
            if not permission:
                permission = Permission(**p_data)
                db.add(permission)
            db_permissions.append(permission)
            
        await db.commit()
        for p in db_permissions:
            await db.refresh(p)
            
        roles_data = ["Admin", "ProPlayer", "TeamOwner"]
        db_roles = {}
        for r_name in roles_data:
            result = await db.execute(select(Role).where(Role.name == r_name))
            role = result.scalars().first()
            if not role:
                role = Role(name=r_name)
                db.add(role)
            db_roles[r_name] = role
            
        await db.commit()
        for r in db_roles.values():
            await db.refresh(r)
            
        admin_role = db_roles["Admin"]
        from sqlalchemy.orm import selectinload
        result = await db.execute(
            select(Role).where(Role.name == "Admin").options(selectinload(Role.permissions))
        )
        admin_role = result.scalars().first()
        
        admin_role.permissions = db_permissions
        db.add(admin_role)
        await db.commit()
        
        result = await db.execute(select(User).where(User.email == "admin"))
        admin_user = result.scalars().first()
        
        if not admin_user:
            hashed_password = get_password_hash("admin123")
            admin_user = User(
                email="admin",
                hashed_password=hashed_password,
                role_id=admin_role.id
            )
            db.add(admin_user)
            await db.commit()
            print("Usuario 'admin' creado con éxito.")
        else:
            print("El usuario administrador ya existe.")

        print("Base de datos poblada con éxito.")

if __name__ == "__main__":
    asyncio.run(seed_db())
