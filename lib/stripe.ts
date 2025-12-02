import Stripe from "stripe"

// Initialize Stripe with server-side key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  // apiVersion: "2025-11-17.clover", // Removed to use default/latest
})

export default stripe
