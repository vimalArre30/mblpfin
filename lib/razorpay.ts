import Razorpay from "razorpay";

// Lazily initialised so the constructor (which validates key_id) only runs
// inside a request handler where the env vars are actually present.
let _instance: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!_instance) {
    _instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID ?? "",
      key_secret: process.env.RAZORPAY_KEY_SECRET ?? "",
    });
  }
  return _instance;
}
