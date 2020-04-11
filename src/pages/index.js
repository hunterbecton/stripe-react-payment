import React from "react"
import { Elements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import CheckoutForm from "../components/stripe/CheckoutForm"

export default () => {
  const stripePromise = loadStripe(process.env.STRIPE_PUBLISH_KEY)

  return (
    <div>
      <Elements stripe={stripePromise}>
        <CheckoutForm item="Black T-Shirt" price={23.0} />
      </Elements>
    </div>
  )
}
