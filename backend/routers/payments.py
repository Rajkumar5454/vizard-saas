from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import razorpay
import os

import models, schemas, auth
from database import get_db

router = APIRouter(
    prefix="/payments",
    tags=["Payments"]
)

razorpay_client = razorpay.Client(
    auth=(os.getenv("RAZORPAY_KEY_ID", "dummy_key"), os.getenv("RAZORPAY_KEY_SECRET", "dummy_secret"))
)

# Credit packages mapping (price in INR paise -> credits)
CREDIT_PACKAGES = {
    9900: 20,   # ₹99 -> 20 credits
    19900: 50,  # ₹199 -> 50 credits
    49900: 150  # ₹499 -> 150 credits
}

@router.post("/create-order", response_model=dict)
def create_order(amount: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if amount not in CREDIT_PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid package amount")
    
    try:
        order_data = {
            "amount": amount,
            "currency": "INR",
            "receipt": f"receipt_{current_user.id}"
        }
        order = razorpay_client.order.create(data=order_data)
        return order
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify")
async def verify_payment(request: Request, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    data = await request.json()
    razorpay_payment_id = data.get('razorpay_payment_id')
    razorpay_order_id = data.get('razorpay_order_id')
    razorpay_signature = data.get('razorpay_signature')
    amount = data.get('amount') # Standardize via frontend

    if amount not in CREDIT_PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid package amount")

    try:
        # Verify Signature
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        })
        
        # Check if transaction already exists
        existing_tx = db.query(models.Transaction).filter(models.Transaction.payment_id == razorpay_payment_id).first()
        if existing_tx:
            return {"status": "success", "message": "Payment already verified"}
            
        credits_to_add = CREDIT_PACKAGES[amount]

        # Create Transaction
        new_tx = models.Transaction(
            user_id=current_user.id,
            payment_id=razorpay_payment_id,
            amount=amount,
            credits_added=credits_to_add
        )
        db.add(new_tx)

        # Update User Credits
        current_user.credits += credits_to_add
        db.add(current_user)
        
        db.commit()
        return {"status": "success", "new_credits": current_user.credits}

    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid Signature")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
