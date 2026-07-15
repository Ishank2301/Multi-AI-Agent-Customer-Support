"""
TechMart AI Support — Authentication (JWT + bcrypt)
"""

from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from ..config import settings
from ..database.db import get_db
from ..database.db import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

bearer_scheme = HTTPBearer()


# Password helpers
def hash_password(password: str) -> str:

    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:

    return pwd_context.verify(plain, hashed)


# JWT helpers
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:

    payload = data.copy()

    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    payload.update({"exp": expire})

    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:

    try:

        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

    except JWTError:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )


# FastAPI Dependencies


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:

    payload = decode_token(credentials.credentials)

    user_id: str = payload.get("sub")

    if not user_id:

        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = db.query(User).filter(User.id == user_id).first()

    if not user:

        raise HTTPException(status_code=401, detail="User not found")

    return user


def get_admin_user(current_user: User = Depends(get_current_user)) -> User:

    if not current_user.is_admin:

        raise HTTPException(status_code=403, detail="Admin access required")

    return current_user


# Optional Auth (returns None if no token)


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        HTTPBearer(auto_error=False)
    ),
    db: Session = Depends(get_db),
) -> Optional[User]:

    if not credentials:

        return None

    try:

        payload = decode_token(credentials.credentials)

        user_id = payload.get("sub")

        return db.query(User).filter(User.id == user_id).first()

    except HTTPException:

        return None
