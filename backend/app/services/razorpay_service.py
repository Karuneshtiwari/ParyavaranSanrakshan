"""
Razorpay Payment Gateway Service for ParyavaranSanrakshan.
Handles order generation in INR (converted to paise) and server-side HMAC-SHA256 signature verification.
Secrets are kept strictly server-side.
"""

import hmac
import hashlib
import razorpay
from fastapi import HTTPException, status
from backend.app.config import settings


def get_razorpay_client():
    """Initializes and returns the Razorpay client using configured backend credentials."""
    key_id = (settings.RAZORPAY_KEY_ID or "").strip()
    key_secret = (settings.RAZORPAY_KEY_SECRET or "").strip()
    if not key_id or not key_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Razorpay payment gateway is not properly configured on the server. Please ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set in environment variables."
        )
    return razorpay.Client(auth=(key_id, key_secret))


def create_razorpay_order(amount_inr: float, receipt: str, notes: dict = None) -> dict:
    """
    Creates a new Razorpay Order.
    - Validates that amount_inr is positive and valid
    - Converts INR to paise (1 INR = 100 paise)
    - Returns order details including order_id, amount in paise, currency, and public key ID
    """
    if amount_inr is None or amount_inr <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Donation amount must be greater than zero."
        )

    # 1 INR minimum donation
    if amount_inr < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minimum donation amount is ₹1."
        )

    amount_paise = int(round(amount_inr * 100))
    client = get_razorpay_client()

    try:
        order_data = {
            "amount": amount_paise,
            "currency": "INR",
            "receipt": receipt,
            "notes": notes or {
                "project": "ParyavaranSanrakshan",
                "purpose": "Citizen Environmental Conservation Support"
            }
        }
        order = client.order.create(data=order_data)
        return {
            "order_id": order["id"],
            "amount": amount_inr,
            "amount_paise": amount_paise,
            "currency": order["currency"],
            "razorpay_key_id": key_id
        }
    except Exception as e:
        print(f"[!] Razorpay Order Creation Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to create Razorpay payment order: {str(e)}"
        )


def verify_razorpay_signature(order_id: str, payment_id: str, signature: str) -> bool:
    """
    Verifies the Razorpay payment signature using the server-side secret.
    Does not trust any client-reported status without valid signature.
    """
    if not order_id or not payment_id or not signature:
        return False

    client = get_razorpay_client()
    try:
        # Razorpay Python SDK utility verification
        params = {
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': signature
        }
        client.utility.verify_payment_signature(params)
        return True
    except razorpay.errors.SignatureVerificationError:
        print(f"[!] Invalid Razorpay signature for order: {order_id}, payment: {payment_id}")
        return False
    except Exception as e:
        # Fallback manual HMAC-SHA256 check
        try:
            msg = f"{order_id}|{payment_id}".encode("utf-8")
            generated_sig = hmac.new(
                settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
                msg,
                hashlib.sha256
            ).hexdigest()
            return hmac.compare_digest(generated_sig, signature)
        except Exception as inner_e:
            print(f"[!] Manual signature verification failed: {inner_e}")
            return False
