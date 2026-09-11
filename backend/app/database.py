import logging
from motor.motor_asyncio import AsyncIOMotorClient
import mongomock_motor
from bson import ObjectId
from app.config import settings

logger = logging.getLogger("smriti.database")

client = None
db = None
is_mock = False

async def init_db():
    global client, db, is_mock
    try:
        real_client = AsyncIOMotorClient(settings.MONGO_URL, serverSelectionTimeoutMS=1500)
        await real_client.admin.command('ping')
        client = real_client
        db = client[settings.DB_NAME]
        is_mock = False
        logger.info(f"Connected to real MongoDB at {settings.MONGO_URL}")
    except Exception as e:
        logger.warning(f"Could not connect to MongoDB at {settings.MONGO_URL}: {e}. Falling back to in-memory mongomock_motor.")
        client = mongomock_motor.AsyncMongoMockClient()
        db = client[settings.DB_NAME]
        is_mock = True
        logger.info("Initialized in-memory mongomock_motor database successfully.")

def get_db():
    global db
    if db is None:
        client_mock = mongomock_motor.AsyncMongoMockClient()
        db = client_mock[settings.DB_NAME]
    return db

def serialize_doc(doc: dict) -> dict:
    """Recursively serializes ObjectId and MongoDB types to JSON-safe Python types."""
    if doc is None:
        return None
    res = {}
    for k, v in doc.items():
        if k == "_id":
            res["id"] = str(v)
        elif isinstance(v, ObjectId):
            res[k] = str(v)
        elif isinstance(v, dict):
            res[k] = serialize_doc(v)
        elif isinstance(v, list):
            res[k] = [serialize_doc(item) if isinstance(item, dict) else (str(item) if isinstance(item, ObjectId) else item) for item in v]
        else:
            res[k] = v
    if "_id" in doc and "id" not in res:
        res["id"] = str(doc["_id"])
    return res
