import getpass

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.user import User


def main() -> None:
    email = input("Admin email: ").strip()
    username = input("Admin username: ").strip()
    password = getpass.getpass("Admin password (min 8 chars): ")
    if len(password) < 8:
        raise SystemExit("Password must be at least 8 characters")

    with SessionLocal() as db:
        existing = db.scalar(select(User).where(User.email == email))
        if existing:
            existing.role = "admin"
            db.commit()
            print(f"Promoted existing user {email} to admin")
            return

        db.add(
            User(
                email=email,
                username=username,
                password_hash=hash_password(password),
                role="admin",
            )
        )
        db.commit()
        print(f"Created admin {email}")


if __name__ == "__main__":
    main()