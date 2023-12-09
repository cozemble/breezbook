# BreezBook - Booking App

This app is used by customers to book appointments with the business.

## Customer Journey
  0. Customer redirected from the tenant's website to the booking app 
    - with the service selected
    - starts with the [services](#services) page
  1. Multiple options from here:
    - Can go into the [booking](#booking) for the selected service
    - Can select another service and go into the [booking journey](#booking)

### Services
  - Display all the services the tenant provides
    - In a grid of cards
    - Service details
      - Name
      - Description
      - Image
      - Price (approximate because of the time slot and accessories)
      - Duration (approximate)
      - Action to go to [booking](#booking) from here

### Booking
  0. Display the service details
    - Name
    - Description
    - Price (approximate because of the time slot and accessories)
    - Duration
    - Image
    - Display other services too so that the customer can add more services to the cart

  1. Select a time slot
    - Display the available time slots
    - Display the time slots based on the service duration
    - Different pricings based on rules defined by the tenant
  
  2. Select accessories
    - Optional
    - Provide extra details for the accessories
    - Do price calculations based on the accessories and their details
  
  3. Provide customer details
    - Name
    - Email
    - Phone
    - Address
    - Extra details specific to the service or the tenant
  
  4. Add to cart
    - Can go to [cart](#cart) from here
    - Can select more services before going to the cart

### Cart
  - Can add multiple services to the cart
  - Can checkout and pay for all the services in the cart
  - Can remove services from the cart
  - Can edit the services in the cart - (later)
  - Block booking if the time slot have become unavailable while in the cart - (later)
  - Can save the cart for later (on local storage) - (later) 
