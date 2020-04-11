import React, { useState } from "react"
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js"

const CheckoutForm = ({ price, item }) => {
  const formatPrice = price * 100

  const stripe = useStripe()

  const elements = useElements()

  const [status, setStatus] = useState("default")

  const [message, setMessagae] = useState("")

  const handleSuccess = () => {
    setMessagae("Success! Your payment was processed.")
    elements.getElement(CardElement).clear()
    setStatus("default")
  }

  const handleFailure = () => {
    setMessagae("There was an error processing your payment.")
    setStatus("default")
    elements.getElement(CardElement).clear()
  }

  const submit = async e => {
    e.preventDefault()

    setStatus("submitting")

    try {
      const paymentIntent = await fetch("/.netlify/functions/payment", {
        method: "POST",
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        body: JSON.stringify({
          amount: formatPrice,
          currency: "usd",
          email: "hello@skillthrive.com",
          item_name: item,
        }),
      })

      // If the status comes back with 200 then process the payment
      if (paymentIntent.status === 200) {
        const paymentIntentData = await paymentIntent.json()

        const payment = await stripe.confirmCardPayment(
          paymentIntentData.client_secret,
          {
            payment_method: {
              card: elements.getElement(CardElement),
            },
          }
        )

        if (payment.paymentIntent.status === "succeeded") {
          handleSuccess()
        } else {
          handleFailure()
        }
      }

      // If the status is not 200 do not process and set error state
      if (paymentIntent.status !== 200) {
        handleFailure()
      }
    } catch (error) {
      console.log(error)
      handleFailure()
    }
  }

  return (
    <div style={{ width: "400px" }}>
      <p>{message}</p>
      <CardElement />
      <button type="submit" onClick={submit} disabled={status === "submitting"}>
        {status === "submitting" ? "Submitting" : `Pay $${price}`}
      </button>
    </div>
  )
}

export default CheckoutForm
