# main.py
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Text, TIMESTAMP, ForeignKey, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base, Session, relationship
from datetime import datetime, timedelta
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import jwt
from passlib.context import CryptContext

# Crear la aplicación FastAPI
app = FastAPI()

# Configurar CORS
origins = [
    "http://localhost:5501",
    "http://127.0.0.1:5501",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.34.1:8000",  # Añadir la dirección IP específica
    "http://192.168.34.1:5500",  # También con otro puerto común
    "http://192.168.34.1:5501",  # También con otro puerto común
    "http://192.168.34.1",       # La IP sin puerto específico
    "*",                         # Permitir todos los orígenes (solo para desarrollo)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Usa la lista de orígenes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# El resto de tu código FastAPI continúa aquí...
# Configuración JWT y base de datos
SECRET_KEY = "tu_clave_secreta_aqui_cambiala"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DATABASE_URL = "postgresql://abde:dawa1234@10.2.82.173/dinetime"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ====================
# MODELOS DE BASE DE DATOS
# ====================

class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    fecha_registro = Column(TIMESTAMP, default=datetime.utcnow)
    rol = Column(String(20), default="usuario", nullable=False)

class Restaurante(Base):
    __tablename__ = "restaurantes"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)

class Reserva(Base):
    __tablename__ = "reservas"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    restaurante_id = Column(Integer, ForeignKey("restaurantes.id"))
    fecha_reserva = Column(DateTime, nullable=False)  # <--- CAMBIADO A DateTime
    personas = Column(Integer, nullable=False)

    usuario = relationship("Usuario")
    restaurante = relationship("Restaurante")

# ====================
# ESQUEMAS Pydantic
# ====================

class UsuarioCreate(BaseModel):
    nombre: str
    email: EmailStr
    password_hash: str

class UsuarioResponse(BaseModel):
    id: int
    nombre: str
    email: EmailStr
    rol: str
    fecha_registro: datetime
    class Config:
        orm_mode = True

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    nombre: str
    rol: str

class LogoutResponse(BaseModel):
    message: str

class ReservaSchema(BaseModel):
    nombre: str
    telefono: str
    email: EmailStr
    fecha_reserva: datetime  # <--- CAMBIADO A datetime
    personas: int
    slug_restaurante: str

# ====================
# INICIALIZAR BD
# ====================
Base.metadata.create_all(bind=engine)

# ====================
# DEPENDENCIAS Y FUNCIONES
# ====================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(db: Session = Depends(get_db), authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token inválido o no enviado")

    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        usuario_id = payload.get("id")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario

# ====================
# ENDPOINTS EXISTENTES
# ====================

@app.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == login_data.email).first()
    if not usuario or login_data.password != usuario.password_hash:
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")

    access_token = create_access_token(
        data={"sub": usuario.email, "id": usuario.id, "rol": usuario.rol},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": usuario.id,
        "nombre": usuario.nombre,
        "rol": usuario.rol
    }

@app.post("/logout", response_model=LogoutResponse)
def logout():
    return {"message": "Sesión cerrada correctamente"}

@app.post("/usuarios", response_model=UsuarioResponse)
def crear_usuario(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    existe = db.query(Usuario).filter(Usuario.email == usuario.email).first()
    if existe:
        raise HTTPException(status_code=400, detail="El usuario ya está registrado.")
    nuevo_usuario = Usuario(**usuario.dict())
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario

@app.get("/usuarios", response_model=List[UsuarioResponse])
def obtener_usuarios(db: Session = Depends(get_db)):
    return db.query(Usuario).all()

@app.get("/usuarios/{usuario_id}", response_model=UsuarioResponse)
def obtener_usuario(usuario_id: int, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario

@app.get("/verificar-token", response_model=UsuarioResponse)
def verificar_token(usuario_actual: Usuario = Depends(get_current_user)):
    return usuario_actual

@app.put("/usuarios/{usuario_id}", response_model=UsuarioResponse)
def actualizar_usuario(usuario_id: int, usuario_actualizado: UsuarioCreate, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    for key, value in usuario_actualizado.dict().items():
        setattr(usuario, key, value)
    db.commit()
    db.refresh(usuario)
    return usuario

@app.delete("/usuarios/{usuario_id}")
def eliminar_usuario(usuario_id: int, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(usuario)
    db.commit()
    return {"msg": f"Usuario con ID {usuario_id} eliminado correctamente"}

# ====================
# ENDPOINT DE RESERVAS CON MANEJO DE ERRORES
# ====================

@app.post("/api/reservas")
async def crear_reserva(data: ReservaSchema, db: Session = Depends(get_db)):
    try:
        # Comprueba si el restaurante existe
        restaurante = db.query(Restaurante).filter_by(slug=data.slug_restaurante).first()
        if not restaurante:
            raise HTTPException(status_code=404, detail="Restaurante no encontrado")

        # Busca o crea el usuario
        usuario = db.query(Usuario).filter_by(email=data.email).first()
        if not usuario:
            usuario = Usuario(nombre=data.nombre, email=data.email, password_hash="no-aplica")
            db.add(usuario)
            db.commit()
            db.refresh(usuario)

        # Crea la reserva
        reserva = Reserva(
            usuario_id=usuario.id,
            restaurante_id=restaurante.id,
            fecha_reserva=data.fecha_reserva,
            personas=data.personas,
        )
        db.add(reserva)
        db.commit()
        
        return {"mensaje": "Reserva creada con éxito"}
    except Exception as e:
        # Registrar el error para depuración
        print(f"Error al crear reserva: {str(e)}")
        # Hacer rollback de la transacción en caso de error
        db.rollback()
        # Devolver un error detallado
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

# ====================
# ENDPOINTS PARA VERIFICACIÓN DE RESTAURANTES
# ====================

@app.get("/api/restaurantes/{slug}")
async def verificar_restaurante(slug: str, db: Session = Depends(get_db)):
    restaurante = db.query(Restaurante).filter_by(slug=slug).first()
    if not restaurante:
        return {"existe": False, "mensaje": "Restaurante no encontrado"}
    return {"existe": True, "nombre": restaurante.nombre, "id": restaurante.id}

@app.get("/api/restaurantes")
async def listar_restaurantes(db: Session = Depends(get_db)):
    restaurantes = db.query(Restaurante).all()
    return [{"id": r.id, "nombre": r.nombre, "slug": r.slug} for r in restaurantes]

@app.post("/api/restaurantes")
async def crear_restaurante(nombre: str, slug: str, db: Session = Depends(get_db)):
    existe = db.query(Restaurante).filter_by(slug=slug).first()
    if existe:
        return {"mensaje": "El restaurante ya existe", "id": existe.id}
    
    nuevo_restaurante = Restaurante(nombre=nombre, slug=slug)
    db.add(nuevo_restaurante)
    db.commit()
    db.refresh(nuevo_restaurante)
    return {"mensaje": "Restaurante creado", "id": nuevo_restaurante.id}

# ====================
# PUNTO DE ENTRADA PARA EJECUCIÓN DIRECTA
# ====================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

from fastapi import Path

@app.get("/usuarios/{usuario_id}/reservas")
def obtener_reservas_usuario(usuario_id: int = Path(...), db: Session = Depends(get_db)):
    # Verificar que el usuario exista
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Obtener reservas del usuario con info del restaurante
    reservas = db.query(Reserva).filter(Reserva.usuario_id == usuario_id).all()

    # Formatear respuesta para que incluya nombre del restaurante, fecha y personas
    resultado = []
    for reserva in reservas:
        resultado.append({
            "id": reserva.id,
            "restaurante": reserva.restaurante.nombre,
            "fecha": reserva.fecha_reserva.strftime("%Y-%m-%d %H:%M"),
            "personas": reserva.personas
        })

    return resultado

class ReservaUpdateSchema(BaseModel):
    fecha_reserva: Optional[datetime]
    personas: Optional[int]

@app.put("/reservas/{reserva_id}")
def actualizar_reserva(reserva_id: int, reserva_update: ReservaUpdateSchema, db: Session = Depends(get_db)):
    reserva = db.query(Reserva).filter(Reserva.id == reserva_id).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    # Actualizar sólo los campos que vienen en la petición
    if reserva_update.fecha_reserva is not None:
        reserva.fecha_reserva = reserva_update.fecha_reserva
    if reserva_update.personas is not None:
        reserva.personas = reserva_update.personas

    db.commit()
    db.refresh(reserva)

    return {"mensaje": "Reserva actualizada correctamente"}

@app.delete("/reservas/{reserva_id}")
def eliminar_reserva(reserva_id: int, db: Session = Depends(get_db)):
    reserva = db.query(Reserva).filter(Reserva.id == reserva_id).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    db.delete(reserva)
    db.commit()

    return {"mensaje": "Reserva eliminada correctamente"}

