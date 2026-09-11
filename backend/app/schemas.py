from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

# Auth Schemas
class CaregiverRegister(BaseModel):
    name: str
    email: str
    password: str
    phone: Optional[str] = ""

class CaregiverLogin(BaseModel):
    email: str
    password: str

class PatientLogin(BaseModel):
    code: str
    pin: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user: Dict[str, Any]

# Survey Sub-models
class SurveyBasic(BaseModel):
    name: str
    dob: str
    gender: str = "other"
    native_language: str = "as"
    years_of_education: int = 12

class SurveyCognitiveBaseline(BaseModel):
    diagnosed_stage: str = "mild"  # none, mild, moderate, severe
    diagnosis_date: str = ""
    triggers_confusion_patterns: str = ""

class FamilyMember(BaseModel):
    name: str
    relationship: str
    notes: Optional[str] = ""
    photo_url: Optional[str] = ""

class SurveyDailyRoutine(BaseModel):
    wake_time: str = "06:30"
    sleep_time: str = "21:30"
    meal_times: List[str] = ["08:00", "13:00", "20:00"]
    medication_schedule: List[str] = ["08:30 (Morning)", "20:30 (Night)"]

class SurveyInterestsHistory(BaseModel):
    hobbies: List[str] = ["gardening", "Assam tea", "reading"]
    former_occupation: str = "Teacher"
    favorite_places: List[str] = ["Jorhat", "Majuli", "Kaziranga"]
    favorite_foods: List[str] = ["Khar", "Masor Tenga", "Pitha"]

class SurveySafety(BaseModel):
    wandering_risk: bool = False
    mobility_level: str = "independent"
    emergency_contact_name: str = ""
    emergency_contact_phone: str = ""

class PatientSurveySchema(BaseModel):
    basic: SurveyBasic
    cognitive_baseline: SurveyCognitiveBaseline
    family_context: List[FamilyMember] = []
    daily_routine: SurveyDailyRoutine
    interests_history: SurveyInterestsHistory
    safety: SurveySafety

# Patient Schemas
class GeofenceSchema(BaseModel):
    center_lat: float = 26.7509
    center_lng: float = 94.2037
    radius_m: float = 500.0

class PatientCreate(BaseModel):
    name: str
    dob: str
    dementia_stage: str = "mild"
    language: str = "as"
    pin: str = "1234"
    geofence: Optional[GeofenceSchema] = None
    consent_flag: bool = True
    survey: Optional[PatientSurveySchema] = None

class PatientPINReset(BaseModel):
    new_pin: str

# Game Session Schemas
class GameResponseItem(BaseModel):
    item_id: str
    prompt: str
    chosen: str
    correct: bool
    reaction_time_ms: int

class GameSubmitSchema(BaseModel):
    patient_id: str
    game_type: str  # memory_match, attention_spot_difference, daily_routine, recognition
    difficulty: str = "medium"
    responses: List[GameResponseItem]
    accuracy: float
    completion: float
    composite_score: float

# Facts & Memories Schemas
class FactCreate(BaseModel):
    category: str = "general"
    content: str

class MemoryCreate(BaseModel):
    title: str
    photo_url: str
    caption: str
    person_event: str
    approx_year_or_date: Optional[str] = ""
    tts_text: Optional[str] = ""

# Reminder Schemas
class ReminderCreate(BaseModel):
    title: str
    time_str: str  # e.g. "08:30"
    category: str = "medication"
    active: bool = True

class ReminderToggle(BaseModel):
    date_str: str  # YYYY-MM-DD
    completed: bool

# Alert Schemas
class SOSCreate(BaseModel):
    patient_id: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    location_unavailable: bool = False
    notes: Optional[str] = "Emergency SOS Triggered from Patient App"

class AlertUpdate(BaseModel):
    read: Optional[bool] = None
    dismissed: Optional[bool] = None
    resolved_by: Optional[str] = None
    resolution_note: Optional[str] = None

# Sathi Companion Schemas
class SathiChatRequest(BaseModel):
    patient_id: str
    message: str
    language: Optional[str] = "as"

# Clinical Audit Log Schema
class AuditLogSchema(BaseModel):
    patient_id: str
    action_type: str  # PIN_RESET, ALERT_RESOLVED, DATA_DELETED, GEOFENCE_UPDATED, REMINDER_MODIFIED
    actor_id: Optional[str] = None
    actor_name: str
    details: Dict[str, Any] = {}
    timestamp: Optional[str] = None
