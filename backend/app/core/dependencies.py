from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_access_token, hash_password
from app.models.user import User


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def is_auth_bypass_enabled() -> bool:
    return settings.auth_bypass_enabled and settings.environment.lower() != "production"


def get_or_create_bypass_user(db: Session) -> User:
    user = db.query(User).filter(User.email == settings.auth_bypass_email).first()
    if user:
        return user

    user = User(
        name=settings.auth_bypass_name,
        email=settings.auth_bypass_email,
        password_hash=hash_password("dev-bypass-password"),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_current_user(token: str | None = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    if is_auth_bypass_enabled() and not token:
        return get_or_create_bypass_user(db)

    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    try:
        payload = decode_access_token(token)
        user_id = int(payload["sub"])
    except (ValueError, KeyError):
        if is_auth_bypass_enabled():
            return get_or_create_bypass_user(db)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        if is_auth_bypass_enabled():
            return get_or_create_bypass_user(db)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user
