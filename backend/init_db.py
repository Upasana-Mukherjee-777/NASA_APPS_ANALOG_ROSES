import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.base import create_tables
from app.models import *

def main():
    print("Initializing database tables...")
    create_tables()
    print("Database tables initialized successfully!")

if __name__ == "__main__":
    main()
