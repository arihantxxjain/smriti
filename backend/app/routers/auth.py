from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Response, Request, Depends, status
from app.database import get_db
from app.auth import hash_password, verify_password, hash_pin, verify_pin, create_access_token, get_current_user
from app.schemas import CaregiverRegister, CaregiverLogin, PatientLogin, TokenResponse
from bson import ObjectId

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/caregiver/register", response_model=TokenResponse)
async def register_caregiver(payload: CaregiverRegister, response: Response):
    db = get_db()
    existing = await db.caregivers.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Caregiver email already registered")
    
    caregiver_doc = {
        "name": payload.name,
        "email": payload.email.lower(),
        "password_hash": hash_password(payload.password),
        "phone": payload.phone or "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.caregivers.insert_one(caregiver_doc)
    user_id = str(result.inserted_id)

    token = create_access_token({"sub": user_id, "role": "caregiver", "email": payload.email.lower()})
    
    # Set httpOnly cookie
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=60 * 60 * 24,  # 24h
        samesite="lax",
        secure=False  # localhost / http dev
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": "caregiver",
        "user": {
            "id": user_id,
            "name": payload.name,
            "email": payload.email.lower(),
            "role": "caregiver"
        }
    }

@router.post("/caregiver/login", response_model=TokenResponse)
async def login_caregiver(payload: CaregiverLogin, response: Response):
    db = get_db()
    caregiver = await db.caregivers.find_one({"email": payload.email.lower()})
    if not caregiver or not verify_password(payload.password, caregiver.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user_id = str(caregiver["_id"])
    token = create_access_token({"sub": user_id, "role": "caregiver", "email": caregiver["email"]})

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=60 * 60 * 24,
        samesite="lax",
        secure=False
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": "caregiver",
        "user": {
            "id": user_id,
            "name": caregiver.get("name"),
            "email": caregiver.get("email"),
            "role": "caregiver"
        }
    }

@router.post("/patient/login", response_model=TokenResponse)
async def login_patient(payload: PatientLogin, response: Response):
    db = get_db()
    code_clean = payload.code.strip().upper()
    patient = await db.patients.find_one({"code": code_clean})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient code not found. Please check with your caregiver.")

    now = datetime.now(timezone.utc)

    # Check 15-minute lockout
    lockout_until = patient.get("lockout_until")
    if lockout_until:
        if isinstance(lockout_until, str):
            lockout_time = datetime.fromisoformat(lockout_until)
        else:
            lockout_time = lockout_until
        
        if lockout_time.tzinfo is None:
            lockout_time = lockout_time.replace(tzinfo=timezone.utc)
            
        if now < lockout_time:
            remaining_mins = int((lockout_time - now).total_seconds() / 60) + 1
            raise HTTPException(
                status_code=403, 
                detail=f"Account locked due to 5 failed PIN attempts. Try again in {remaining_mins} minutes or ask your caregiver to reset your PIN."
            )

    # Verify PIN
    if not verify_pin(payload.pin, patient.get("pin_hash", "")):
        attempts = patient.get("failed_login_attempts", 0) + 1
        update_fields = {"failed_login_attempts": attempts}
        
        if attempts >= 5:
            lockout_dt = now + timedelta(minutes=15)
            update_fields["lockout_until"] = lockout_dt.isoformat()
            await db.patients.update_one({"_id": patient["_id"]}, {"$set": update_fields})
            raise HTTPException(
                status_code=403,
                detail="5 failed PIN attempts reached. Account locked for 15 minutes. Please inform your caregiver."
            )
        else:
            await db.patients.update_one({"_id": patient["_id"]}, {"$set": update_fields})
            remaining = 5 - attempts
            raise HTTPException(
                status_code=401,
                detail=f"Incorrect PIN. {remaining} attempt{'s' if remaining != 1 else ''} remaining before a 15-minute lockout."
            )

    # Reset failed attempts upon successful login
    await db.patients.update_one(
        {"_id": patient["_id"]},
        {"$set": {"failed_login_attempts": 0, "lockout_until": None}}
    )

    user_id = str(patient["_id"])
    token = create_access_token({"sub": user_id, "role": "patient", "code": code_clean})

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=60 * 60 * 24,
        samesite="lax",
        secure=False
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": "patient",
        "user": {
            "id": user_id,
            "name": patient.get("name"),
            "code": code_clean,
            "language": patient.get("language", "as"),
            "dementia_stage": patient.get("dementia_stage", "mild"),
            "caregiver_id": str(patient.get("caregiver_id", "")),
            "role": "patient"
        }
    }

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("access_token")
    auth_header = request.headers.get("Authorization")
    if not token and auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
    
    if not token:
        raise HTTPException(status_code=401, detail="No active session to refresh")
    
    try:
        from app.auth import decode_token
        payload = decode_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token for refresh")
    
    user_id = payload.get("sub")
    role = payload.get("role")
    new_token = create_access_token({"sub": user_id, "role": role})

    response.set_cookie(
        key="access_token",
        value=new_token,
        httponly=True,
        max_age=60 * 60 * 24,
        samesite="lax",
        secure=False
    )

    db = get_db()
    user_data = {"id": user_id, "role": role}
    if role == "caregiver":
        cg = await db.caregivers.find_one({"_id": ObjectId(user_id)})
        if cg:
            user_data.update({"name": cg.get("name"), "email": cg.get("email")})
    elif role == "patient":
        pt = await db.patients.find_one({"_id": ObjectId(user_id)})
        if pt:
            user_data.update({
                "name": pt.get("name"),
                "code": pt.get("code"),
                "language": pt.get("language"),
                "dementia_stage": pt.get("dementia_stage")
            })

    return {
        "access_token": new_token,
        "token_type": "bearer",
        "role": role,
        "user": user_data
    }

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    user_copy = current_user.copy()
    user_copy.pop("password_hash", None)
    user_copy.pop("pin_hash", None)
    if "_id" in user_copy:
        user_copy["_id"] = str(user_copy["_id"])
    return user_copy

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"message": "Logged out successfully"}
