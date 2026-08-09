export type TermsSection = {
  section: string;
  title: string;
  items: string[];
};

export const TERMS_AND_CONDITIONS: TermsSection[] = [
  {
    section: "Section 1",
    title: "Reservation",
    items: [
      "1.1 All the Success van hire reservations are subject to availability.",
      "1.2 A reservation is only confirmed once payment or a deposit has been received and a confirmation email has been issued.",
      "1.3 The hirer must be at least 23 years old to drive our vans, 25 years old for our Minibuses and hold a valid full driving licence for a minimum of 2 years, our maximum age is 80 years old.",
    ],
  },
  {
    section: "Section 2",
    title: "Payment & Deposit",
    items: [
      "2.1 Full payment or a deposit of \u00a350 is required to secure a reservation.",
      "2.2 A security deposit will be held during the rental period and refunded 21 working days after return of the vehicle in acceptable condition.",
      "2.3 Payment can be made by credit/debit card or bank transfer.",
      "2.4 Security deposit is \u00a3250 for the normal panel vans and \u00a3350 for Luton, Tipper, Refrigerator and Minibuses.",
    ],
  },
  {
    section: "Section 3",
    title: "Cancellation Policy",
    items: [
      "3.1 Cancellations made more than 48 hours prior to the hire date will receive a full refund.",
      "3.2 Cancellations made within 48 hours of the hire date will incur a \u00a350 charge.",
      "3.3 No-shows or same-day cancellations will be charged in full.",
    ],
  },
  {
    section: "Section 4",
    title: "Vehicle Use",
    items: [
      "4.1 The vehicle must not be used for illegal purposes, off-road driving, racing, or towing.",
      "4.2 The hirer is responsible for all fines, penalties, or charges incurred during the hire period.",
      "4.3 Smoking and the transport of pets are not permitted unless agreed in writing.",
      "4.4 Mileage limits (150 miles per day). Excess mileage charges may apply.",
    ],
  },
  {
    section: "Section 5",
    title: "Driver Requirements",
    items: [
      "5.1 Drivers must provide a valid driving licence, proof of address, DVLA check code and ID at collection.",
      "5.2 Additional drivers must be approved and listed in the hire agreement.",
      "5.3 Points, convictions, or disqualifications must be disclosed at booking.",
    ],
  },
  {
    section: "Section 6",
    title: "Insurance",
    items: [
      "6.1 Comprehensive insurance is included in the hire fee (unless stated otherwise).",
      "6.2 An excess of \u00a31750 applies in the event of damage or theft, reduce excess available on request.",
      "6.3 Insurance does not cover personal belongings or damage.",
      "6.4 Damage caused to the vehicle by driver due to the driver negligent, will not covered by insurance.",
      "6.5 In case of damage or broken to locks, if the cost to repair is lower than the insurance excess, then repair will be done outside insurance.",
    ],
  },
  {
    section: "Section 7",
    title: "Breakdown & Accidents",
    items: [
      "7.1 The vehicle is covered by roadside assistance.",
      "7.2 In the event of an accident, the hirer must notify the company and complete an accident report form.",
      "7.3 Any mechanical issues must be reported immediately.",
      "7.4 In an event of breakdown, Success van hire is not responsible for loss of business or holiday purposes.",
    ],
  },
  {
    section: "Section 8",
    title: "Return of Vehicle",
    items: [
      "8.1 The vehicle must be returned on the agreed date and time, in the same condition it was collected.",
      "8.2 Late returns may incur additional charges.",
      "8.3 Fuel must be replaced to the original level or a refuelling charge will apply.",
    ],
  },
  {
    section: "Section 9",
    title: "Liability",
    items: [
      "9.1 The hirer is liable for any loss or damage not covered by insurance.",
      "9.2 Success van hire is not responsible for delays or cancellations due to weather, traffic, or breakdowns.",
    ],
  },
  {
    section: "Section 10",
    title: "Governing Law",
    items: [
      "10.1 These terms are governed by the laws of England and Wales.",
      "10.2 Any disputes will be settled in the courts in London.",
    ],
  },
  {
    section: "Section 11",
    title: "Restrictions on International Travel",
    items: [
      "11.1 The vehicle must not be taken outside of England and Wales under any circumstances.",
      "11.2 Any attempt to drive or transport the vehicle across international borders will be considered a breach of contract and may result in: Immediate termination of the hire agreement, Forfeiture of any deposit paid, Full liability for any recovery, legal, or transport costs incurred, Loss of insurance coverage.",
      "11.3 GPS tracking may be used to monitor vehicle location for security and contract compliance purposes.",
    ],
  },
  {
    section: "Section 12",
    title: "Extension of Hire & Payment Failure",
    items: [
      "12.1 Requests to extend the hire period must be made at least 12 hours before the original return date and are subject to vehicle availability and approval by the Success van hire.",
      "12.2 Full payment for the extended period must be made in advance. The extension will not be confirmed until payment is received.",
      "12.3 If payment for the extension fails or is not received on time, the following will apply: The extension will be considered void, and the original return date/time will remain in effect. Failure to return the vehicle on time will result in late return charges and may be treated as unauthorised use. Success van hire reserves the right to take legal action or recover the vehicle at the hirer's expense.",
    ],
  },
  {
    section: "Section 13",
    title: "Traffic Violations and Administrative Charges",
    items: [
      "13.1 The hirer is fully responsible for any traffic, parking, toll, congestion, or other fines or penalties incurred during the hire period.",
      "13.2 If the company receives a fine or penalty notice relating to the hire period, the company will transfer liability to the hirer where possible.",
      "13.3 An administrative fee of \u00a325 will be charged per fine or notice processed to cover the cost of handling and transferring the ticket.",
      "13.4 If the fine cannot be transferred, the amount will be deducted from the security deposit or charged directly to the hirer's payment method on file.",
    ],
  },
  {
    section: "Section 14",
    title: "Misfuelling (Wrong Fuel Use)",
    items: [
      "14.1 The hirer is responsible for ensuring the correct fuel type is used in the vehicle.",
      "14.2 If the wrong fuel is put into the vehicle, the hirer will be fully liable for: The cost of draining and cleaning the fuel system, Any mechanical damage caused, Recovery or towing charges, Loss of hire while the vehicle is off the road.",
      "14.3 No refund or compensation will be provided for any disruption or delays caused by misfuelling.",
      "14.4 The correct fuel type is clearly indicated on the fuel cap and/or inside the vehicle documentation. If unsure, the hirer must contact the company before refuelling.",
    ],
  },
  {
    section: "Section 15",
    title: "Lock Damage, Theft, and Break-Ins",
    items: [
      "15.1 The hirer is responsible for ensuring the vehicle is securely locked and parked in a safe location when unattended.",
      "15.2 In the event of a break-in, attempted theft, or damage to locks or windows, the hirer will be liable for: The cost of repairs or replacement of locks, windows, or damaged parts, Any items stolen from the vehicle (unless insured separately by the hirer), Any insurance excess applicable \u00a31750, Loss of use while the vehicle is being repaired.",
      "15.3 Theft or vandalism must be reported immediately to the police, and a crime reference number must be provided to the company.",
      "15.4 Insurance coverage may be void if the vehicle was left unsecured or if negligence is found.",
    ],
  },
  {
    section: "Section 16",
    title: "Minor Damage Below Insurance Excess",
    items: [
      "16.1 The hirer is financially responsible for any damage to the vehicle, regardless of fault, up to the value of the insurance excess.",
      "16.2 If the cost of repairing the damage is less than the insurance excess, the hirer will be charged the actual cost of repair, plus a reasonable administration fee \u00a3180 to cover assessment and processing.",
      "16.3 Success van hire will provide an itemised repair invoice or estimate upon request.",
      "16.4 This includes, but is not limited to: Scratches, dents, and scuffs to bodywork, Interior damage, stains, or burns, Damage to wheels, tyres, mirrors, or lights.",
    ],
  },
  {
    section: "Section 17",
    title: "Lost or Damaged Keys",
    items: [
      "17.1 The hirer is responsible for the safekeeping of the vehicle's keys during the hire period.",
      "17.2 In the event of lost, stolen, or damaged keys, the hirer will be liable for: The full cost of key replacement, including programming and re-coding \u00a3400, Any associated vehicle recovery or locksmith charges, Loss of use of the vehicle until a replacement key is provided.",
      "17.3 Spare keys will not be provided unless arranged in advance.",
      "17.4 No refund or reimbursement will be issued for unused hire time due to key loss or delays caused by replacement.",
    ],
  },
  {
    section: "Section 18",
    title: "Windscreen Chips and Damage",
    items: [
      "18.1 The hirer is responsible for any damage to the vehicle's windscreen, including chips, cracks, or impact marks, that occur during the hire period.",
      "18.2 If a chip can be repaired, the hirer will be charged the repair cost (typically \u00a350-\u00a370), plus an administrative fee of \u00a325.",
      "18.3 If the windscreen requires full replacement, the hirer will be liable for the full cost of replacement, up to the insurance excess amount (typically \u00a3250-\u00a3400, depending on the vehicle model).",
      "18.4 If a chip is not reported and worsens into a crack, requiring full replacement, the hirer may be liable for the full cost regardless of insurance cover.",
      "18.5 The hirer should inspect the windscreen upon collection and report any pre-existing damage immediately.",
      "18.6 Optional Windscreen Protection: The hirer may choose to purchase windscreen protection for \u00a310 per day, which covers repair of chips and reduces the replacement cost liability to \u00a3150 excess. This must be added at the time of booking or prior to vehicle collection.",
    ],
  },
];

export const TERMS_META = {
  lastUpdated: "January 2026",
  documentVersion: "1.0",
  phone: "+44 20 3011 1198",
  closing:
    "Thank you for choosing Success Van Hire. By making a reservation with us, you agree to these terms and conditions. We look forward to serving you!",
};
