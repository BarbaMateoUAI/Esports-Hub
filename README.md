# E-Sports Hub

## Requisitos del Sistema
- Node.js (Versión 18 o superior)
- Python (Versión 3.10 o superior)
- PostgreSQL

## Instrucciones de Instalación

### 1. Base de Datos
1. Instalar y configurar PostgreSQL en el entorno local.
2. Crear una base de datos vacía denominada `esports_hub`.

### 2. Configuración del Backend
1. Navegar al directorio del backend:
   ```bash
   cd backend
   ```
2. Crear y activar el entorno virtual:
   ```bash
   python -m venv venv
   
   # Windows:
   .\venv\Scripts\activate
   
   # Unix/MacOS:
   source venv/bin/activate
   ```
3. Instalar las dependencias del proyecto:
   ```bash
   pip install -r requirements.txt
   ```
4. Configurar las variables de entorno. Crear un archivo `.env` en el directorio `backend` con la siguiente estructura y completar con las credenciales correspondientes:
   ```env
   POSTGRES_USER=usuario_postgres
   POSTGRES_PASSWORD=contraseña_postgres
   POSTGRES_SERVER=127.0.0.1
   POSTGRES_PORT=5432
   POSTGRES_DB=esports_hub
   
   SMTP_USER=correo@dominio.com
   SMTP_PASSWORD=contraseña_smtp
   ```
5. Ejecutar las migraciones de la base de datos:
   ```bash
   alembic upgrade head
   ```
6. Inicializar los datos del sistema (generación de roles, permisos y usuario administrador):
   ```bash
   python scripts/seed_admin.py
   ```

### 3. Configuración del Frontend
1. Navegar al directorio del frontend:
   ```bash
   cd frontend
   ```
2. Instalar las dependencias de Node:
   ```bash
   npm install
   ```

## Ejecución del Sistema
Para el correcto funcionamiento de la plataforma, se requiere la ejecución simultánea de ambos servicios en terminales separadas.

**Servicio Backend:**
```bash
cd backend
# Asegurar que el entorno virtual se encuentre activado
uvicorn app.main:app --reload
```
La API se expone en: `http://localhost:8000`

**Servicio Frontend:**
```bash
cd frontend
npm run dev
```
La interfaz de usuario se expone en: `http://localhost:5173`
