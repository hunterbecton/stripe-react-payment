import Stripe from "stripe"

require("dotenv").config({
  path: `.env.${process.env.NODE_ENV}`,
})

exports.handler = async event => {
  const { amount, currency, email, item_name } = JSON.parse(event.body)

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    maxNetworkRetries: 2, // Retry this specific request twice before giving up
  })

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  }

  const getCustomer = async email => {
    const customer = await stripe.customers.list(
      {
        limit: 1,
        email: email,
      },
      {
        maxNetworkRetries: 2, // Retry this specific request twice before giving up
      }
    )

    return customer
  }

  const createCustomer = async email => {
    const customer = await stripe.customers.create(
      {
        email: email,
      },
      {
        maxNetworkRetries: 2, // Retry this specific request twice before giving up
      }
    )

    return customer
  }

  const getPaymentIntent = async (
    amount,
    currency,
    email,
    customerId,
    item_name
  ) => {
    const paymentIntent = await stripe.paymentIntents.create(
      {
        payment_method_types: ["card"],
        amount: amount,
        currency: currency,
        receipt_email: email,
        customer: customerId,
        metadata: {
          item_name: item_name,
        },
      },
      {
        maxNetworkRetries: 2, // Retry this specific request twice before giving up
      }
    )

    return paymentIntent
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: "Method Not Allowed" }
  }

  try {
    // Check if customer exists in Stripe based on email
    const customerRequest = await getCustomer(email)

    // If the email exists go ahead and charge the customer using the Stripe ID
    if (customerRequest.data.length > 0) {
      const customerId = customerRequest.data[0].id

      // Create payment intent
      const newPaymentIntent = await getPaymentIntent(
        amount,
        currency,
        email,
        customerId,
        item_name
      )

      // Return with new client secret
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(newPaymentIntent),
      }
    }

    // If the email doesn't exist go ahead and create a new customer
    // and use the ID returned from the function to make the charge
    if (customerRequest.data.length === 0) {
      const newCustomer = await createCustomer(email)

      const newCustomerId = newCustomer.id

      // Create payment intent
      const newPaymentIntent = await getPaymentIntent(
        amount,
        currency,
        email,
        newCustomerId,
        item_name
      )

      // Return with new client secret
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(newPaymentIntent),
      }
    } else {
      return {
        statusCode: 500,
        headers,
        body: "Failed to process payment",
      }
    }
  } catch (error) {
    console.log(error) // Console log the error to Netlify logs
    return {
      statusCode: 500,
      headers,
      body: `An error occurred: ${String(error)}`,
    }
  }
}
