# Service Booking Page

This page serves as the place for booking a service for a customer. It is a multi-step form that allows the user to select a time slot, add extras and enter their details.

## Important Information to Display
- Indicate that the user is booking a service 
- Indicate the service that the user is booking
  - Link back to the service page
- Display the total price as it change

## User Journey
The user journey for this page is as follows:

0. User arrived here with the service selected.
1. ### Time Slots
  - value is saved as the user selects it
  - summary: shortened format of the value
  - actions:
    a. `next` - mark as success and take them to the next step
2. ### Extras
  - values are saved as the user selects them
  - summary: amount of extras selected
  - actions:
    a. `next` - mark as success and take them to the next step
    b. `back` - they are taken to the time slots step
    <!-- TODO extras that depend on each other -->
    <!-- TODO extras that depend on time slots -->
    <!-- TODO extras that depend on resources -->
3. ### Details
  - values are saved as the user selects them
  - no summary is displayed
  - actions
    a. `book now` - booking is saved to cart and user is taken to the cart page
    b. `save to cart` - booking is saved to cart and user is taken to the tenant home page service section
      - helper text caption: "Continue browsing and come back to your cart later"
      - user is notified that the booking has been saved to cart
    c. `back` - they are taken to the extras step
    d. if user leaves the page without saving the booking to cart, they are notified that the booking will be lost