require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(cors());
app.use(express.json());

const products = {
  car_parking: {
    amount: 600,
    description: 'Car Parking',
  },
  ramp_parking: {
    amount: 1200,
    description: 'Boat Ramp + Truck/Trailer Parking',
  }
};

app.post('/create-checkout-session', async (req, res) => {
  const { productType } = req.body;
  const selected = products[productType] || products.car_parking;

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: selected.description,
          },
          unit_amount: selected.amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      payment_intent_data: {
        application_fee_amount: 100, // $1 cut for you
        transfer_data: {
          destination: process.env.CONNECTED_ACCOUNT_ID, // the ramp owner's Stripe account
        },
      },
      custom_fields: [
        {
          key: 'license_plate',
          label: { type: 'custom', custom: 'License Plate Number' },
          type: 'text',
          text: { minimum_length: 1, maximum_length: 10 },
          optional: false,
        },
      ],
      custom_text: {
        submit: {
          message: 'Please double-check your plate number before paying.',
        }
      },
      success_url: 'http://localhost:3000/success',
      cancel_url: 'http://localhost:3000/cancel',
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));

