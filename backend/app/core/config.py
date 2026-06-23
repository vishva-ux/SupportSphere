import os
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "SupportSphere"
    API_V1_STR: str = "/api"
    
    # JWT Settings
    JWT_SECRET_KEY: str = Field("super-secret-supportsphere-key-change-in-production", validation_alias="JWT_SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # Database Settings
    POSTGRES_SERVER: str = Field("localhost", validation_alias="POSTGRES_SERVER")
    POSTGRES_USER: str = Field("postgres", validation_alias="POSTGRES_USER")
    POSTGRES_PASSWORD: str = Field("postgres", validation_alias="POSTGRES_PASSWORD")
    POSTGRES_DB: str = Field("supportsphere", validation_alias="POSTGRES_DB")
    POSTGRES_PORT: str = Field("5432", validation_alias="POSTGRES_PORT")
    
    @property
    def DATABASE_URL(self) -> str:
        # Check if DATABASE_URL is directly provided in the environment
        env_url = os.getenv("DATABASE_URL")
        if env_url:
            return env_url
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Default Credentials
    DEFAULT_ADMIN_EMAIL: str = "admin@supportsphere.com"
    DEFAULT_ADMIN_PASSWORD: str = "AdminSphere2026!"
    DEFAULT_ENGINEER_EMAIL: str = "engineer@supportsphere.com"
    DEFAULT_ENGINEER_PASSWORD: str = "EngineerSphere2026!"
    DEFAULT_EMPLOYEE_EMAIL: str = "employee@supportsphere.com"
    DEFAULT_EMPLOYEE_PASSWORD: str = "EmployeeSphere2026!"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
