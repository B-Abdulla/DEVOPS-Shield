"""
User Authentication Database Schema and Service
Implements real user database with authentication support
"""

import sqlite3
import sys
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any
import hashlib
import secrets

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.utils.logger import get_logger
from src.security.auth_manager import User, UserRole

logger = get_logger(__name__)


class UserDatabase:
    """User database management with authentication support"""
    
    def __init__(self, db_path: str = "database/fraud_logs.db"):
        self.db_path = db_path
        self._ensure_schema()
    
    def _ensure_schema(self):
        """Ensure user tables exist"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Create users table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    role TEXT NOT NULL,
                    mfa_enabled BOOLEAN DEFAULT 0,
                    mfa_secret TEXT,
                    is_active BOOLEAN DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP,
                    login_attempts INTEGER DEFAULT 0,
                    locked_until TIMESTAMP
                )
            """)
            
            # Create sessions table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    token TEXT UNIQUE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP NOT NULL,
                    is_active BOOLEAN DEFAULT 1,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            """)
            
            # Create audit log table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS auth_audit_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT,
                    action TEXT NOT NULL,
                    ip_address TEXT,
                    user_agent TEXT,
                    success BOOLEAN NOT NULL,
                    metadata TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            conn.commit()
            conn.close()
            
            logger.info("✓ User database schema initialized")
            
        except Exception as e:
            logger.error(f"Error creating user schema: {e}")
            raise
    
    def create_user(self, username: str, email: str, password: str, 
                   role: UserRole = UserRole.DEVELOPER) -> Optional[str]:
        """Create a new user"""
        try:
            from src.security.auth_manager import PasswordManager
            
            user_id = secrets.token_urlsafe(16)
            password_manager = PasswordManager()
            hashed, salt = password_manager.hash_password(password)
            password_hash = f"{hashed}:{salt}"
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO users (id, username, email, password_hash, role)
                VALUES (?, ?, ?, ?, ?)
            """, (user_id, username, email, password_hash, role.value))
            
            conn.commit()
            conn.close()
            
            logger.info(f"✓ User created: {username} ({role.value})")
            return user_id
            
        except sqlite3.IntegrityError as e:
            logger.error(f"User already exists: {e}")
            return None
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            return None
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username"""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM users WHERE username = ? AND is_active = 1
            """, (username,))
            
            row = cursor.fetchone()
            conn.close()
            
            if not row:
                return None
            
            return self._row_to_user(row)
            
        except Exception as e:
            logger.error(f"Error getting user: {e}")
            return None
            
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM users WHERE id = ? AND is_active = 1
            """, (user_id,))
            
            row = cursor.fetchone()
            conn.close()
            
            if not row:
                return None
            
            return self._row_to_user(row)
            
        except Exception as e:
            logger.error(f"Error getting user by ID: {e}")
            return None

    def update_user(self, user_id: str, username: Optional[str] = None, email: Optional[str] = None) -> bool:
        """Update user details"""
        try:
            updates = []
            params = []
            
            if username:
                updates.append("username = ?")
                params.append(username)
            if email:
                updates.append("email = ?")
                params.append(email)
                
            if not updates:
                return True
                
            params.append(user_id)
            query = f"UPDATE users SET {', '.join(updates)} WHERE id = ?"
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute(query, tuple(params))
            conn.commit()
            success = cursor.rowcount > 0
            conn.close()
            
            if success:
                logger.info(f"✓ User updated: {user_id}")
            return success
            
        except sqlite3.IntegrityError as e:
            logger.error(f"Update failed (integrity error): {e}")
            return False
        except Exception as e:
            logger.error(f"Error updating user: {e}")
            return False

    def _row_to_user(self, row: sqlite3.Row) -> User:
        """Convert database row to User object"""
        return User(
            id=row['id'],
            username=row['username'],
            email=row['email'],
            role=UserRole(row['role']),
            mfa_enabled=bool(row['mfa_enabled']),
            mfa_secret=row['mfa_secret'],
            password_hash=row['password_hash'],
            is_active=bool(row['is_active']),
            created_at=datetime.fromisoformat(row['created_at']) if row['created_at'] else None,
            last_login=datetime.fromisoformat(row['last_login']) if row['last_login'] else None,
            login_attempts=row['login_attempts'],
            locked_until=datetime.fromisoformat(row['locked_until']) if row['locked_until'] else None
        )
    
    def update_last_login(self, user_id: str):
        """Update user's last login timestamp"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE users 
                SET last_login = CURRENT_TIMESTAMP, login_attempts = 0
                WHERE id = ?
            """, (user_id,))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Error updating last login: {e}")
    
    def increment_login_attempts(self, user_id: str):
        """Increment failed login attempts"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE users 
                SET login_attempts = login_attempts + 1
                WHERE id = ?
            """, (user_id,))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Error incrementing login attempts: {e}")
    
    def log_auth_event(self, user_id: Optional[str], action: str, 
                       success: bool, ip_address: str = None, 
                       metadata: Dict[str, Any] = None):
        """Log authentication event"""
        try:
            import json
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO auth_audit_log 
                (user_id, action, ip_address, success, metadata)
                VALUES (?, ?, ?, ?, ?)
            """, (user_id, action, ip_address, success, 
                  json.dumps(metadata) if metadata else None))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Error logging auth event: {e}")
    
    def seed_default_users(self):
        """Create default users for testing"""
        default_users = [
            ("admin", "admin@devops-shield.com", "Admin@123", UserRole.ADMIN),
            ("analyst", "analyst@devops-shield.com", "Analyst@123", UserRole.SECURITY_ANALYST),
            ("developer", "dev@devops-shield.com", "Dev@123", UserRole.DEVELOPER),
        ]
        
        for username, email, password, role in default_users:
            user_id = self.create_user(username, email, password, role)
            if user_id:
                logger.info(f"✓ Default user created: {username}")


# Global instance
user_db = UserDatabase()


if __name__ == "__main__":
    # Initialize and seed database
    user_db = UserDatabase()
    user_db.seed_default_users()
    print("\n✓ User database initialized with default users:")
    print("  - admin / Admin@123 (ADMIN)")
    print("  - analyst / Analyst@123 (SECURITY_ANALYST)")
    print("  - developer / Dev@123 (DEVELOPER)")
